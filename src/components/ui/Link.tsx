import type { AnchorHTMLAttributes } from 'react';
import { Link as RouterLink } from 'react-router';

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

/** A link inside this site that changes page without a reload. A link to a spot on the current page (`#faq`) stays a plain anchor. */
export function Link({ to, ...rest }: LinkProps) {
  return to.startsWith('#') ? <a href={to} {...rest} /> : <RouterLink to={to} {...rest} />;
}
