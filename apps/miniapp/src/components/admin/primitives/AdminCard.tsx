import React from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'button' | 'a';
  href?: string;
  padding?: 'none' | 'sm' | 'md';
};

const PADDING: Record<NonNullable<Props['padding']>, string> = {
  none: '',
  sm: 'p-2.5',
  md: 'p-3',
};

export const AdminCard = React.forwardRef<HTMLDivElement, Props>(function AdminCard(
  { as = 'div', href, padding = 'md', className = '', children, ...rest },
  ref,
) {
  const cls = `bg-white border border-slate-200 rounded-[12px] ${PADDING[padding]} ${className}`;
  if (as === 'a' && href) {
    return (
      <a href={href} className={cls} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  if (as === 'button') {
    return (
      <button type="button" className={`${cls} text-left`} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }
  return (
    <div ref={ref} className={cls} {...rest}>
      {children}
    </div>
  );
});
