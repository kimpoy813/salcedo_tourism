import type { ReactNode } from "react";

export function Wordmark({ subtitle = "Tourism guide" }: { subtitle?: string }) {
  return (
    <span className="guide-brand">
      <img
        className="municipal-mark"
        src="/images/salcedo/municipal-seal.webp"
        width="48"
        height="48"
        alt=""
      />
      <span className="brand-type">
        <strong>Salcedo</strong>
        <small>{subtitle}</small>
      </span>
    </span>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="guide-kicker">{children}</p>;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="page-intro">
      <div>
        <Kicker>{eyebrow}</Kicker>
        <h1>{title}</h1>
        <p className="intro-description">{description}</p>
      </div>
      {aside && <div className="intro-aside">{aside}</div>}
    </header>
  );
}
