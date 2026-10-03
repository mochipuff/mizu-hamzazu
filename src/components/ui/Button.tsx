import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon.tsx';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'sun';
type Size = 'sm' | 'md' | 'lg';

interface SharedProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  children: ReactNode;
}

const isExternal = (href: string): boolean => /^https?:\/\//.test(href);

function Content({ icon, children }: Pick<SharedProps, 'icon' | 'children'>) {
  return (
    <>
      {icon && <Icon name={icon} size={20} />}
      <span>{children}</span>
    </>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={[styles.button, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      {...rest}
    >
      <Content icon={icon}>{children}</Content>
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  href,
  className,
  ...rest
}: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const external = isExternal(href);
  return (
    <a
      href={href}
      className={[styles.button, className].filter(Boolean).join(' ')}
      data-variant={variant}
      data-size={size}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...rest}
    >
      <Content icon={icon}>{children}</Content>
    </a>
  );
}
