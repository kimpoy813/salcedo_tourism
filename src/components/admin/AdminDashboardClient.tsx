"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { AdminPrincipal } from "@/lib/admin-auth";
import { AdminAnalyticsPanel, type DashboardMetrics } from "./AdminAnalyticsPanel";
import { AdminPlacesPanel } from "./AdminPlacesPanel";
import {
  AdminCheckinsPanel,
  AdminVisitorsPanel,
  type AdminVisitorRow,
} from "./AdminVisitorsCheckinsPanel";
import {
  AdminContentPanel,
  AdminGovernancePanel,
  AdminMediaPanel,
} from "./AdminContentGovernancePanel";

type AdminTab =
  | "overview"
  | "places"
  | "content"
  | "visitors"
  | "checkins"
  | "media"
  | "governance";

export function AdminDashboardClient({ principal }: { principal: AdminPrincipal }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hasPerm = (p: string) =>
    principal.roles.includes("super_admin") || principal.permissions.includes(p);

  const canContentEdit = hasPerm("content.edit");
  const canContentPublish = hasPerm("content.publish");
  const canVisitorRead = hasPerm("visitor.aggregate.read");
  const canCheckins = hasPerm("checkins.manage");
  const canMedia = hasPerm("media.manage");
  const canAdminGov =
    hasPerm("admin.users.manage") ||
    hasPerm("admin.audit.read") ||
    hasPerm("admin.settings.manage");

  const canAnalytics = hasPerm("analytics.read");
  const defaultTab: AdminTab = canAnalytics
    ? "overview"
    : canContentEdit
    ? "places"
    : canVisitorRead
    ? "visitors"
    : "overview";

  const [activeTab, setActiveTab] = useState<AdminTab>(defaultTab);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);
  const [placesData, setPlacesData] = useState<{
    places: never[];
    barangays: never[];
    categories: never[];
  } | null>(null);
  const [contentData, setContentData] = useState<{
    municipalInfo: never[];
    historicalArticles: never[];
    culturalArticles: never[];
    travelGuides: never[];
    events: never[];
    products: never[];
    announcements: never[];
    emergencyContacts: never[];
    barangays: never[];
  } | null>(null);
  const [visitorsData, setVisitorsData] = useState<{
    canReadPii: boolean;
    canDeletePii: boolean;
    submissions: AdminVisitorRow[];
  } | null>(null);
  const [checkinsData, setCheckinsData] = useState<{
    methods: never[];
    places: never[];
    checkins: never[];
    totalVerifiedArrivals: number;
  } | null>(null);
  const [mediaData, setMediaData] = useState<{
    assets: never[];
    vercelBlobConfigured: boolean;
  } | null>(null);
  const [govData, setGovData] = useState<{
    users: never[];
    auditLogs: never[];
    privacySettings: never[];
    analyticsSettings: never[];
  } | null>(null);

  const loadActiveTab = useCallback(async (tab: AdminTab) => {
    if (tab === "overview") {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) setDashboard(await res.json());
    } else if (tab === "places") {
      const res = await fetch("/api/admin/places");
      if (res.ok) setPlacesData(await res.json());
    } else if (tab === "content") {
      const res = await fetch("/api/admin/content");
      if (res.ok) setContentData(await res.json());
    } else if (tab === "visitors") {
      const res = await fetch("/api/admin/visitors");
      if (res.ok) setVisitorsData(await res.json());
    } else if (tab === "checkins") {
      const res = await fetch("/api/admin/checkins");
      if (res.ok) setCheckinsData(await res.json());
    } else if (tab === "media") {
      const res = await fetch("/api/admin/media");
      if (res.ok) setMediaData(await res.json());
    } else if (tab === "governance") {
      const [uRes, aRes, sRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/audit-logs"),
        fetch("/api/admin/settings"),
      ]);
      const users = uRes.ok ? (await uRes.json()).users : [];
      const auditLogs = aRes.ok ? (await aRes.json()).logs : [];
      const settingsJson = sRes.ok
        ? await sRes.json()
        : { privacySettings: [], analyticsSettings: [] };
      setGovData({
        users,
        auditLogs,
        privacySettings: settingsJson.privacySettings || [],
        analyticsSettings: settingsJson.analyticsSettings || [],
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadActiveTab(activeTab);
    });
    return () => {
      active = false;
    };
  }, [activeTab, loadActiveTab]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
  }> = [
    { id: "overview", label: "Analytics & Overview", icon: BarChart3, visible: true },
    { id: "places", label: "Places & Directory", icon: MapPin, visible: canContentEdit },
    { id: "content", label: "Municipal Content", icon: FileText, visible: canContentEdit },
    { id: "visitors", label: "Visitor Submissions", icon: Users, visible: canVisitorRead },
    { id: "checkins", label: "Verified Check-Ins", icon: CheckSquare, visible: canCheckins },
    { id: "media", label: "Media Library", icon: ImageIcon, visible: canMedia },
    { id: "governance", label: "Users, Logs & Privacy", icon: Settings, visible: canAdminGov },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A2421] flex">
      {/* Mobile Sidebar Scrim */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Minimalist White Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#EAE7E0] flex flex-col justify-between transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/images/salcedo/turi-logo.png"
                alt="Project CEDO: Turi Logo"
                className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs"
              />
              <div className="min-w-0">
                <p className="font-display font-bold text-sm text-[#1A2421] truncate">
                  Project CEDO: Turi
                </p>
                <p className="text-[11px] text-[#616E69] truncate">Admin • Salcedo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="lg:hidden p-1 text-[#616E69] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems
              .filter((i) => i.visible)
              .map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                      active
                        ? "bg-[#164237] text-white font-semibold"
                        : "text-[#616E69] hover:bg-[#FAF9F6] hover:text-[#1A2421]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#EAE7E0] space-y-2.5 text-xs">
          <a
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-[#1A2421] hover:bg-[#FAF9F6] transition font-medium"
          >
            <span>Open Tourist App</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#616E69]" />
          </a>

          <div className="px-3 space-y-0.5">
            <p className="font-bold text-[#1A2421] truncate">{principal.fullName}</p>
            <p className="text-[11px] text-[#616E69] capitalize truncate">
              {principal.roles.map((r) => r.replace(/_/g, " ")).join(", ")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#EAE7E0] px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-1.5 rounded-lg border border-[#EAE7E0] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="font-display text-base font-bold text-[#1A2421] truncate">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
          </div>

          <span className="hidden sm:inline-flex items-center rounded-full bg-[#F3F2EE] text-[#1A2421] px-3 py-1 text-[11px] font-medium">
            {principal.username}
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">
          {activeTab === "overview" && dashboard && <AdminAnalyticsPanel data={dashboard} />}
          {activeTab === "places" && placesData && (
            <AdminPlacesPanel
              places={placesData.places}
              barangays={placesData.barangays}
              categories={placesData.categories}
              canPublish={canContentPublish}
              onReload={() => loadActiveTab("places")}
            />
          )}
          {activeTab === "content" && contentData && (
            <AdminContentPanel
              municipalInfo={contentData.municipalInfo}
              historicalArticles={contentData.historicalArticles}
              culturalArticles={contentData.culturalArticles}
              travelGuides={contentData.travelGuides}
              events={contentData.events}
              products={contentData.products}
              announcements={contentData.announcements}
              contacts={contentData.emergencyContacts}
              barangays={contentData.barangays}
              canPublish={canContentPublish}
              onReload={() => loadActiveTab("content")}
            />
          )}
          {activeTab === "visitors" && visitorsData && (
            <AdminVisitorsPanel
              submissions={visitorsData.submissions}
              canReadPii={visitorsData.canReadPii}
              canDeletePii={visitorsData.canDeletePii}
              canExport={hasPerm("visitor.export")}
              onReload={() => loadActiveTab("visitors")}
            />
          )}
          {activeTab === "checkins" && checkinsData && (
            <AdminCheckinsPanel
              methods={checkinsData.methods}
              places={checkinsData.places}
              checkins={checkinsData.checkins}
              totalVerifiedArrivals={checkinsData.totalVerifiedArrivals}
              onReload={() => loadActiveTab("checkins")}
            />
          )}
          {activeTab === "media" && mediaData && (
            <AdminMediaPanel
              assets={mediaData.assets}
              vercelBlobConfigured={mediaData.vercelBlobConfigured}
              onReload={() => loadActiveTab("media")}
            />
          )}
          {activeTab === "governance" && govData && (
            <AdminGovernancePanel
              users={govData.users}
              auditLogs={govData.auditLogs}
              privacySettings={govData.privacySettings}
              analyticsSettings={govData.analyticsSettings}
              onReload={() => loadActiveTab("governance")}
            />
          )}
        </main>
      </div>
    </div>
  );
}
