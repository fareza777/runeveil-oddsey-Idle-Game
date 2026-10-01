import type { ZoneDef } from '@/core/types';
import { asset } from './icons';

export const zoneBgUrl = (z: ZoneDef): string => asset(`gen/zones/zone_${z.id}.png`);