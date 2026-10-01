import type { GameEvent } from '@/core/state';

export interface Screen {
  el: HTMLElement;
  /** Rebuild the full view (called when the tab opens or after a structural change). */
  show(): void;
  /** Cheap per-tick refresh of progress bars and counters. */
  update(): void;
  event?(e: GameEvent): void;
}
