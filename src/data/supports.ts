import { site, type ExtraProfile, type SocialPurpose } from '../config/site.ts';

const supportPurposes: readonly SocialPurpose[] = ['trakteer', 'tako', 'membership'];

export const supportLinks: ExtraProfile[] = site.profile.socials.filter(({ purpose }) => supportPurposes.includes(purpose));
