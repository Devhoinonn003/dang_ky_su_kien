import type { ReactNode } from 'react';

interface SectionHeadingProps {
  step: number;
  title: string;
  as?: 'h2' | 'legend';
  aside?: ReactNode;
}

/** Numbered section title shared by every form step. */
export function SectionHeading({ step, title, as = 'h2', aside }: SectionHeadingProps) {
  const Tag = as;
  return (
    <Tag className="mb-4 flex w-full items-center gap-3 text-lg font-bold text-(--er-on-surface) sm:text-xl">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--er-ink) text-sm font-bold text-(--er-on-ink)"
      >
        {step}
      </span>
      <span className="flex-1">{title}</span>
      {aside}
    </Tag>
  );
}
