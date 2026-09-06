import type { ReactNode } from "react";

/** Named, focusable overflow area so keyboard users can pan a wide diagram. */
export function ScrollRegion({
  label,
  className,
  children,
}: {
  label: string;
  className: string;
  children: ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: Overflow regions need focus for keyboard scrolling.
    <section className={className} tabIndex={0} aria-label={label}>
      {children}
    </section>
  );
}
