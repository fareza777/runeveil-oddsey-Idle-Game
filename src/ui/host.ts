import type { Game } from '@/core/engine';
import type { SkillId } from '@/core/types';

export type TabId = 'battle' | 'skills' | 'heroes' | 'bag' | 'quests' | 'more';

/** Shared handle so screens can reach the running game without importing each other. */
export const host = {
  game: undefined as unknown as Game,
  refresh: () => undefined as void,
  go: (_tab: TabId) => undefined as void,
  openSkill: (_skill: SkillId) => undefined as void,
  save: () => undefined as void,
  restart: () => undefined as void,
};
