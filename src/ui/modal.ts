import { h } from './dom';
import { audio } from './audio';

export interface SheetHandle {
  body: HTMLElement;
  close: () => void;
}

let toastBox: HTMLElement | null = null;

export function toast(text: string, kind: 'good' | 'bad' | 'info' | 'gold' = 'info') {
  if (!toastBox) {
    toastBox = h('div', { class: 'toasts' });
    document.body.appendChild(toastBox);
  }
  const t = h('div', { class: `toast ${kind}`, text });
  toastBox.appendChild(t);
  while (toastBox.children.length > 3) toastBox.firstElementChild?.remove();
  setTimeout(() => t.remove(), 2700);
}

export function openSheet(title: string, build: (body: HTMLElement, close: () => void) => void, opts: { mid?: boolean; onClose?: () => void; noX?: boolean } = {}): SheetHandle {
  const body = h('div', { class: 'bd' });
  const close = () => {
    ov.remove();
    opts.onClose?.();
  };
  const ov = h(
    'div',
    { class: `overlay ${opts.mid ? 'mid' : ''}`, onclick: (e: Event) => { if (e.target === ov) close(); } },
    h('div', { class: 'sheet' },
      h('div', { class: 'hd' }, h('h3', { text: title }), opts.noX ? null : h('button', { class: 'x', text: '✕', onclick: () => { audio.sfx('ui_close'); close(); } })),
      body),
  );
  document.body.appendChild(ov);
  build(body, close);
  audio.sfx('ui_page');
  return { body, close };
}

export function confirmBox(opts: { title: string; text: string; ok?: string; cancel?: string; danger?: boolean; onOk: () => void }) {
  openSheet(opts.title, (body, close) => {
    body.append(
      h('p', { class: 'muted', style: 'margin:4px 0 16px;line-height:1.5', text: opts.text }),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost grow', text: opts.cancel ?? 'Cancel', onclick: close }),
        h('button', { class: `btn ${opts.danger ? 'red' : 'gold'} grow`, text: opts.ok ?? 'Confirm', onclick: () => { close(); opts.onOk(); } })),
    );
  }, { mid: true });
}

export function infoBox(title: string, text: string) {
  openSheet(title, (body, close) => {
    body.append(h('p', { class: 'muted', style: 'margin:4px 0 16px;line-height:1.5', text }), h('button', { class: 'btn gold block', text: 'OK', onclick: close }));
  }, { mid: true });
}
