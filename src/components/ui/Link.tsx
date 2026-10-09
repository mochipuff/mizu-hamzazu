import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { navigate } from '../../i18n/navigation.ts';

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

const isPlainLeftClick = (event: MouseEvent): boolean => event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

/** A link inside this site that changes page without a reload. A link to a spot on the current page (`#faq`) stays a plain anchor. */
export function Link({ to, target, onClick, ...rest }: LinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || to.startsWith('#') || target === '_blank' || !isPlainLeftClick(event)) return;
    event.preventDefault();
    navigate(to);
  };

  return <a href={to} target={target} onClick={handleClick} {...rest} />;
}
