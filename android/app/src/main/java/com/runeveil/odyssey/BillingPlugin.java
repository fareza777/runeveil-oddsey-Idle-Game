package com.runeveil.odyssey;

import android.content.Context;

import androidx.annotation.NonNull;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private static final String PRODUCT_ID = "remove_ads";
    private static final String PREFS = "runeveil_billing";
    private static final String PURCHASED = "remove_ads_purchased";

    private BillingClient billingClient;
    private PluginCall pendingCall;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
            )
            .setListener(this)
            .build();
        connect();
    }

    private void connect() {
        if (billingClient == null || billingClient.isReady()) return;
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) { }

            @Override
            public void onBillingServiceDisconnected() { }
        });
    }

    private boolean isPurchased() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(PURCHASED, false);
    }

    private void setPurchased() {
        getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(PURCHASED, true).apply();
    }

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("available", billingClient != null && billingClient.isReady());
        result.put("purchased", isPurchased());
        return result;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        connect();
        call.resolve(status());
    }

    @PluginMethod
    public void restore(PluginCall call) {
        pendingCall = call;
        connect();
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("Google Play Billing is not ready.");
            pendingCall = null;
            return;
        }
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
            (result, purchases) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    handlePurchases(purchases);
                }
                resolvePending();
            }
        );
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        pendingCall = call;
        connect();
        if (billingClient == null || !billingClient.isReady()) {
            call.reject("Google Play Billing is not ready.");
            pendingCall = null;
            return;
        }
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Collections.singletonList(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(PRODUCT_ID)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()))
            .build();
        billingClient.queryProductDetailsAsync(params, (result, queryResult) -> {
            List<ProductDetails> products = queryResult.getProductDetailsList();
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || products.isEmpty()) {
                rejectPending("Remove Ads is not available yet in Google Play.");
                return;
            }
            ProductDetails product = products.get(0);
            BillingFlowParams flow = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(product)
                        .build()))
                .build();
            BillingResult launch = billingClient.launchBillingFlow(getActivity(), flow);
            if (launch.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                rejectPending(launch.getDebugMessage());
            }
        });
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult result, List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            handlePurchases(purchases);
            resolvePending();
        } else if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            rejectPending("Purchase canceled.");
        } else if (result.getResponseCode() != BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            rejectPending(result.getDebugMessage());
        } else {
            resolvePending();
        }
    }

    private void handlePurchases(List<Purchase> purchases) {
        for (Purchase purchase : purchases) {
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED && purchase.getProducts().contains(PRODUCT_ID)) {
                setPurchased();
                if (!purchase.isAcknowledged()) {
                    billingClient.acknowledgePurchase(
                        AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.getPurchaseToken()).build(),
                        (ignored) -> { }
                    );
                }
            }
        }
    }

    private void resolvePending() {
        if (pendingCall == null) return;
        PluginCall call = pendingCall;
        pendingCall = null;
        call.resolve(status());
    }

    private void rejectPending(String message) {
        if (pendingCall == null) return;
        PluginCall call = pendingCall;
        pendingCall = null;
        call.reject(message == null || message.isEmpty() ? "Purchase could not be completed." : message);
    }
}
