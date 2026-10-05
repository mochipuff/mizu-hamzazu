import { membershipBadgeUrl } from '../lib/assets.ts';

export interface MembershipTier {
  id: string;
  level: number;
  badge: string;
}

const TIER_COUNT = 6;

export const membershipTiers: MembershipTier[] = Array.from({ length: TIER_COUNT }, (_, index) => {
  const level = index + 1;
  const id = `tier-${level}`;
  return { id, level, badge: membershipBadgeUrl(id) };
});
