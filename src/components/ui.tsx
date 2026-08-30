/**
 * Shared UI primitives (Task UI-2): small, dependency-free components with
 * consistent variants, focus handling, and 44px targets. Pages compose
 * these instead of restyling raw elements.
 */

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  small?: boolean;
}

export function Button({
  variant = "secondary",
  small = false,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = ["ui-btn", `ui-btn--${variant}`];
  if (small) classes.push("ui-btn--sm");
  if (className) classes.push(className);
  return <button type={type} className={classes.join(" ")} {...rest} />;
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name - icon-only controls must be labeled. */
  label: string;
}

export function IconButton({ label, className, type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={className ? `ui-icon-btn ${className}` : "ui-icon-btn"}
      {...rest}
    />
  );
}

type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "role-data_eval"
  | "role-agent_env"
  | "role-post_training";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  const cls = tone === "neutral" ? "ui-badge" : `ui-badge ui-badge--${tone}`;
  return <span className={cls}>{children}</span>;
}

export function Card({
  children,
  tone,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  tone?: "warning";
  className?: string;
  ariaLabel?: string;
}) {
  const cls = tone === "warning" ? "ui-card ui-card--warning" : "ui-card";
  return (
    <section className={className ? `${cls} ${className}` : cls} aria-label={ariaLabel}>
      {children}
    </section>
  );
}

export function ProgressBar({
  value,
  max,
  label,
  tone = "accent",
}: {
  value: number;
  max: number;
  label: string;
  tone?: "accent" | "success" | "warning";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const toneClass = tone === "accent" ? "" : ` ui-progress__fill--${tone}`;
  return (
    <div
      className="ui-progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={`ui-progress__fill${toneClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="ui-page-header">
      <h1>{title}</h1>
      {description ? <p className="ui-page-header__desc">{description}</p> : null}
      {children ? <div className="ui-page-header__row">{children}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <p className="ui-empty__title">{title}</p>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}

/** Accessible disclosure toggle + content region. */
export function Disclosure({
  label,
  openLabel,
  children,
  defaultOpen = false,
}: {
  label: string;
  openLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useRef(`disclosure-${Math.random().toString(36).slice(2, 9)}`);
  return (
    <>
      <button
        type="button"
        className="ui-disclosure-toggle"
        aria-expanded={open}
        aria-controls={regionId.current}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (openLabel ?? `Hide ${label.toLowerCase()}`) : label}
      </button>
      {open ? (
        <div id={regionId.current} className="ui-disclosure">
          {children}
        </div>
      ) : null}
    </>
  );
}

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Accessible overflow menu: labeled trigger, menu semantics, Escape and
 * outside-click close, focus returns to the trigger.
 */
export function Menu({ triggerLabel, items }: { triggerLabel: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="ui-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className="ui-icon-btn"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open ? (
        <div className="ui-menu" role="menu" aria-label={triggerLabel}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="ui-menu__item"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
                // Return focus to the trigger after closing the menu.
                triggerRef.current?.focus();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Loading placeholder rows. */
export function SkeletonRows({ rows = 3, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="ui-skeleton"
          style={{ height: 44, marginBottom: "var(--space-2)", width: `${100 - i * 8}%` }}
        />
      ))}
    </div>
  );
}
