import type { PlatformId } from '../../config/site.ts';
import type { IconName } from './Icon.tsx';

export const platformIcon: Record<PlatformId, IconName> = {
  youtube: 'play',
  twitch: 'chat',
  x: 'post',
  discord: 'discord',
};
