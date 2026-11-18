import type { ReactNode } from "react";

export type Fact = readonly [label: string, value: ReactNode];
/** A label always reads with its value, including on a narrow screen. Suppress
 * unknown fields but keep meaningful zeroes. */
export function FactList({rows, numeric=false}: {rows:ReadonlyArray<Fact>; numeric?:boolean}) {
  const present = rows.filter(([,value])=>value != null && value !== "" && value !== false);
  return present.length ? <dl className={`fact-list${numeric?' numeric-facts':''}`}>{present.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : null;
}
