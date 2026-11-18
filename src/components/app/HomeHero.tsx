import Form from "next/form";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { interests } from "@/lib/guide-interests";

export function HomeHero() {
  return <section className="guide-wrap visitor-start" aria-labelledby="cover-title">
    <div className="welcome-cover">
      <div className="welcome-copy">
        <p className="welcome-location"><MapPin size={15} aria-hidden="true"/> Ilocos Sur, Philippines</p>
        <h1 id="cover-title">Visit Salcedo</h1>
        <p>Waterfalls, spring resorts and local food in the Buaya River valley.</p>
        <Link href="/app/map">Explore the map <ArrowRight size={16}/></Link>
      </div>
      <figure className="welcome-art">
        <Image src="/images/salcedo/guide-valley.webp" alt="Illustrated river valley with rice fields and wooded slopes" width={1408} height={768} unoptimized priority />
        <figcaption>Valley illustration</figcaption>
      </figure>
    </div>
    <Form action="/app/discover" role="search" className="place-finder">
      <label className="finder-query"><span>Find a place</span><span className="finder-input"><Search size={17} aria-hidden="true"/><input type="search" name="q" placeholder="Place name or barangay" /></span></label>
      <label className="finder-interest"><span>Interest</span><select name="interest" defaultValue=""><option value="">All interests</option>{interests.map(i=><option key={i.key} value={i.key}>{i.label}</option>)}</select></label>
      <button type="submit" className="primary-button">Search places <ArrowRight size={15}/></button>
    </Form>
  </section>;
}
