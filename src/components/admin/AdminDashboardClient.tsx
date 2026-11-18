"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wordmark, Kicker } from "@/components/ui/FieldGuide";
import { Modal } from "@/components/ui/Modal";
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
  "overview" | "places" | "content" | "visitors" | "checkins" | "media" | "governance";

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

  const [loadErrors, setLoadErrors] = useState<Partial<Record<AdminTab, string>>>({});
  const [signOutError, setSignOutError] = useState("");
  const canUsers = hasPerm("admin.users.manage"),
    canAudit = hasPerm("admin.audit.read"),
    canSettings = hasPerm("admin.settings.manage");
  const loadActiveTab = useCallback(
    async (tab: AdminTab) => {
      const read = async (resource: string) => {
        const response = await fetch(`/api/admin/${resource}`, { cache: "no-store" });
        if (response.status === 401) router.replace("/admin/login");
        if (!response.ok) throw new Error(`Could not load ${resource}`);
        return response.json();
      };
      setLoadErrors((previous) => ({ ...previous, [tab]: undefined }));
      try {
        if (tab === "overview") setDashboard(await read("dashboard"));
        if (tab === "places") setPlacesData(await read("places"));
        if (tab === "content") setContentData(await read("content"));
        if (tab === "visitors") setVisitorsData(await read("visitors"));
        if (tab === "checkins") setCheckinsData(await read("checkins"));
        if (tab === "media") setMediaData(await read("media"));
        if (tab === "governance") {
          const [users, audit, settings] = await Promise.all([
            canUsers ? read("users") : null,
            canAudit ? read("audit-logs") : null,
            canSettings ? read("settings") : null,
          ]);
          setGovData({
            users: users?.users || [],
            auditLogs: audit?.logs || [],
            privacySettings: settings?.privacySettings || [],
            analyticsSettings: settings?.analyticsSettings || [],
          });
        }
      } catch {
        setLoadErrors((previous) => ({
          ...previous,
          [tab]: "This section couldn’t be loaded. Check your connection and try again.",
        }));
      }
    },
    [router, canUsers, canAudit, canSettings],
  );

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
    setSignOutError("");
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setSignOutError("Sign out failed. Check your connection and try again.");
    }
  };

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
  }> = [
    { id: "overview", label: "Analytics & Overview", icon: BarChart3, visible: canAnalytics },
    { id: "places", label: "Places & Directory", icon: MapPin, visible: canContentEdit },
    { id: "content", label: "Municipal Content", icon: FileText, visible: canContentEdit },
    { id: "visitors", label: "Visitor Submissions", icon: Users, visible: canVisitorRead },
    { id: "checkins", label: "Verified Check-Ins", icon: CheckSquare, visible: canCheckins },
    { id: "media", label: "Media Library", icon: ImageIcon, visible: canMedia },
    { id: "governance", label: "Users, Logs & Privacy", icon: Settings, visible: canAdminGov },
  ];

  const currentData = {
    overview: dashboard,
    places: placesData,
    content: contentData,
    visitors: visitorsData,
    checkins: checkinsData,
    media: mediaData,
    governance: govData,
  }[activeTab];
  const title = navItems.find((n) => n.id === activeTab)?.label;
  const navigation = (
    <>
      <div className="staff-brand-row">
        <Wordmark subtitle="Tourism office" />
        <button
          className="staff-menu-close"
          aria-label="Close staff menu"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>
      <p className="staff-nav-label">Workspace</p>
      <nav aria-label="Staff workspace">
        {navItems
          .filter((item) => item.visible)
          .map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={id === activeTab ? "page" : undefined}
              onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
                window.scrollTo(0, 0);
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
      </nav>
      <div className="staff-account">
        <Link href="/app/" target="_blank" rel="noopener noreferrer">
          Open visitor guide <ExternalLink size={14} />
        </Link>
        <strong>{principal.fullName}</strong>
        <small>{principal.roles.map((r) => r.replaceAll("_", " ")).join(", ")}</small>
        <button onClick={() => void handleLogout()}>
          <LogOut size={14} />
          Sign out
        </button>
        {signOutError && <p role="alert">{signOutError}</p>}
      </div>
    </>
  );
  return (
    <div className="staff-workspace">
      <a className="skip-link" href="#staff-content">
        Skip to workspace
      </a>
      <aside className="staff-sidebar">{navigation}</aside>
      {sidebarOpen && (
        <Modal
          label="Staff navigation"
          className="staff-nav-dialog"
          onClose={() => setSidebarOpen(false)}
        >
          <div className="staff-mobile-sidebar">{navigation}</div>
        </Modal>
      )}
      <div className="staff-shell">
        <header className="staff-header">
          <div>
            <button
              type="button"
              className="staff-menu-button"
              aria-label="Open staff menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <span>Salcedo Tourism Office</span>
          </div>
          <span className="staff-identity">{principal.username}</span>
        </header>
        <main id="staff-content" tabIndex={-1} className="staff-main">
          <div className="staff-page-heading">
            <Kicker>Municipal workspace</Kicker>
            <h1>{title}</h1>
          </div>
          {loadErrors[activeTab] ? (
            <div role="alert" className="staff-load-state">
              {loadErrors[activeTab]}{" "}
              <button className="secondary-button" onClick={() => void loadActiveTab(activeTab)}>
                Try again
              </button>
            </div>
          ) : (
            !currentData && (
              <p role="status" className="staff-load-state">
                Loading {title?.toLowerCase()}…
              </p>
            )
          )}
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
              canUsers={canUsers} canAudit={canAudit} canSettings={canSettings}
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
