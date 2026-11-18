import Image from "next/image";
import { Kicker } from "./FieldGuide";

export function GuideBanner({
  eyebrow,
  title,
  description,
  image,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  note?: string;
}) {
  return (
    <header className="guide-banner">
      <div className="banner-image">
        <Image src={image} alt="" fill priority sizes="(max-width: 600px) 100vw, 60vw" />
      </div>
      <div className="banner-shade" />
      <div className="guide-wrap banner-layout">
        <div>
          <Kicker>{eyebrow}</Kicker>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {note && <small>{note}</small>}
      </div>
    </header>
  );
}
