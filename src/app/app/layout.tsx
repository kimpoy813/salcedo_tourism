import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: { absolute: "Salcedo Tourism Guide — Ilocos Sur", template: "%s | Salcedo Tourism Guide" },
  manifest: "/app/manifest.webmanifest",
};

export default function TouristAppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
