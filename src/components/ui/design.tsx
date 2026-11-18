import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";

/**
 * Project CEDO: Turi shared design library.
 *
 * Every screen (tourist app + admin) must build its headers, chips, and
 * stat graphics from these components so colors and typography can never
 * drift off-palette again. Palette tokens live in globals.css:
 * green #164237 · teal #1D7874 · gold #B88A44 (dark gold #8A6527 for small
 * text) · ivory #FAF9F6 · charcoal #1A2421 · muted #616E69 · border #EAE7E0.
 */

export const PALETTE = {
  green: "#164237",
  dark: "#10322A",
  teal: "#1D7874",
  gold: "#B88A44",
  goldText: "#8A6527",
  ivory: "#FAF9F6",
  charcoal: "#1A2421",
  muted: "#616E69",
  border: "#EAE7E0",
} as const;

/** Small uppercase label that sits above every section title. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1D7874]">
      {children}
    </p>
  );
}

/** The one section header used everywhere: eyebrow + Fraunces title. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <div className="flex items-end justify-between gap-2">
      <div className="space-y-0.5 min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2
          className={`font-display text-lg font-bold leading-tight ${
            tone === "light" ? "text-white" : "text-[#1A2421]"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`text-xs leading-relaxed ${
              tone === "light" ? "text-white/70" : "text-[#616E69]"
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const CHIP_TONES = {
  neutral: "bg-white border border-[#EAE7E0] text-[#1A2421]",
  soft: "bg-[#F3F2EE] text-[#1A2421]",
  green: "bg-[#164237] text-white",
  greenSoft: "bg-[#164237]/10 text-[#164237]",
  tealSoft: "bg-[#1D7874]/10 text-[#164237]",
  goldSoft: "bg-[#B88A44]/15 text-[#8A6527]",
} as const;

/** The one pill/chip. Use `tone`, never hand-rolled colors. */
export function Chip({
  tone = "neutral",
  className = "",
  children,
}: {
  tone?: keyof typeof CHIP_TONES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${CHIP_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Graphic stat tile: soft tint wash of a palette accent + icon in that
 * accent + big display numeral. Tint must be a PALETTE hex.
 */
export function StatTile({
  icon: Icon,
  tint,
  value,
  label,
  tone = "dark",
}: {
  icon: LucideIcon;
  tint: string;
  value: string;
  label: string;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={`rounded-2xl px-2 py-3 text-center space-y-1 ${
        tone === "light"
          ? "bg-white/10 border border-white/15"
          : "bg-white border border-[#EAE7E0]"
      }`}
    >
      <span
        className="mx-auto w-7 h-7 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${tint}1A` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: tint }} />
      </span>
      <p
        className={`font-display text-lg font-bold leading-none tabular-nums ${
          tone === "light" ? "text-white" : "text-[#1A2421]"
        }`}
      >
        {value}
      </p>
      <p
        className={`text-[9px] font-semibold uppercase tracking-wider leading-tight ${
          tone === "light" ? "text-white/70" : "text-[#616E69]"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/** Icon-led label/value row used inside divided info cards. */
export function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2.5">
      <span className="w-8 h-8 rounded-full bg-[#164237]/5 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#164237]" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#616E69]">
          {label}
        </p>
        <div className="text-[13px] leading-relaxed text-[#1A2421]">{children}</div>
      </div>
    </div>
  );
}

/** Yes/no amenity tile (café Wi-Fi, parking, …). Renders nothing when unknown. */
export function FeatureTile({
  icon: Icon,
  label,
  available,
}: {
  icon: LucideIcon;
  label: string;
  available: boolean | null;
}) {
  if (available === null) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white border border-[#EAE7E0] px-3 py-2.5">
      <Icon className={`w-4 h-4 shrink-0 ${available ? "text-[#164237]" : "text-[#D8D3C8]"}`} />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#1A2421] leading-tight">{label}</p>
        <p className="text-[10px] text-[#616E69]">{available ? "Available" : "Not available"}</p>
      </div>
      {available && <Check className="w-3.5 h-3.5 text-[#1D7874] ml-auto shrink-0" />}
    </div>
  );
}

/* ---------- Loading skeletons (shared shapes, palette neutrals) ---------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#ECE9E0] ${className}`} aria-hidden="true" />;
}

export function PlaceRowSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl bg-white border border-[#EAE7E0] p-2.5" aria-hidden="true">
      <Skeleton className="w-20 h-20 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function PlaceListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" role="status" aria-label="Loading places">
      {Array.from({ length: rows }).map((_, i) => (
        <PlaceRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * The one header for every numbered step section (Trip planner Steps 1–3).
 * Number badge + eyebrow + Fraunces title + description, identical metrics
 * everywhere so the steps read as one matched set.
 */
export function StepHeader({
  step,
  eyebrow,
  title,
  description,
  action,
}: {
  step: number;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-8 h-8 rounded-full bg-[#164237] text-white font-display text-sm font-bold flex items-center justify-center shrink-0 shadow-[0_6px_16px_-6px_rgba(22,66,55,0.6)]">
          {step}
        </span>
        <div className="space-y-0.5 min-w-0 pt-0.5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="font-display text-lg font-bold leading-tight text-[#1A2421]">{title}</h2>
          {description && <p className="text-xs leading-relaxed text-[#616E69]">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
