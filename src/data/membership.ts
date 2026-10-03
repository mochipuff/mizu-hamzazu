import { membershipBadgePng } from '../lib/assets.ts';

export interface MembershipTier {
  id: string;
  name: string;
  badge: string;
}

const TIER_NAMES = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5', 'Tier 6'] as const;

export const membershipTiers: MembershipTier[] = TIER_NAMES.map((name, index) => {
  const id = `tier-${index + 1}`;
  return { id, name, badge: membershipBadgePng(id) };
});
