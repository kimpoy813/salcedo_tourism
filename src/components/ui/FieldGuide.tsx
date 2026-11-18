import type { ReactNode } from "react";
import { useId } from "react";

/** The mountain, sun and river from the Turi mark, drawn for small sizes. */
export function LandscapeMark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="landscape-mark">
      <rect width="48" height="48" rx="14" fill="#25483C" />
      <circle cx="28.5" cy="12.5" r="3.7" fill="#E7C18B" />
      <g stroke="#FAF6E9" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6.5 27 11.8-14.4L28 24.3M21.5 20l3.8-4.6L38 28.5M30.1 21l3.7-4.5 7.7 10.2M14.9 16.8l3.4 1.2 2.1-2.7" />
        <path d="M7 29c5.2-3.7 12.6-4 18.7-2.1 3.1 1-.7 2.3-4.9 3.8-7.9 2.8-1.9 4.7 9.3 5.7M8.5 32.8c2.8-1.8 5.4-2.8 9-3.7M25.5 32.6c5.6-2.4 9.9-2.4 15.2-1.3M30.9 34.4c2.8-.7 5.5-.7 8.1-.3" />
      </g>
    </svg>
  );
}

export function Wordmark({ subtitle = "Tourism guide" }: { subtitle?: string }) {
  return (
    <span className="guide-brand">
      <LandscapeMark />
      <span className="brand-type">
        <strong>Salcedo</strong>
        <small>{subtitle}</small>
      </span>
    </span>
  );
}

/** A field-guide stamp; editable vector rather than text baked into photography. */
export function FieldStamp() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="field-stamp" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <path id={`${id}-top`} d="M16 61a44 44 0 0 1 88 0" />
        <path id={`${id}-bottom`} d="M10 61a50 50 0 0 0 100 0" />
      </defs>
      <g stroke="currentColor">
        <circle cx="60" cy="60" r="57" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="53.5" strokeWidth=".65" />
        <circle cx="60" cy="60" r="38.5" strokeWidth=".8" />
      </g>
      <g
        fill="currentColor"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="8.5"
        letterSpacing="2.3"
        textAnchor="middle"
      >
        <text>
          <textPath href={`#${id}-top`} startOffset="50%">
            SALCEDO TOURISM
          </textPath>
        </text>
        <text>
          <textPath href={`#${id}-bottom`} startOffset="50%">
            ILOCOS SUR · PH
          </textPath>
        </text>
      </g>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="66" cy="42" r="4.2" />
        <path d="m30 69 20.3-28 15.9 19.6 7.6-12.4L91 69M43.4 50.6l6.8 2.3 4.3-6.7M60.2 52.9l5.4-7.2 6.5 7.5M33 72c10-5.8 18.9-6.7 30.3-3.6 4 1.2-3.9 3.9-10.5 6.5-10.4 4 4.2 7.2 16.2 6.6M32.5 75.4c4.7-3.2 11.2-4.9 17.5-5.2M65.2 74.9c9.2-4.2 14-4.3 21.5-3.2M68.3 77.7c5.4-2 9.1-2 13.8-1.5" />
      </g>
      <g fill="currentColor">
        <circle cx="12.5" cy="62" r="1.8" />
        <circle cx="107.5" cy="62" r="1.8" />
      </g>
    </svg>
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
