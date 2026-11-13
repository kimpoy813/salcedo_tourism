import type { Metadata } from "next";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "Project CEDO: Turi App — Discover Salcedo, Ilocos Sur",
  manifest: "/app/manifest.webmanifest",
};

export default function TouristAppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
