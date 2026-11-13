"use client";

import React, { useState } from "react";
import { Upload, UserPlus, Shield, FileClock } from "lucide-react";

export function AdminContentPanel({
  events,
  products,
  announcements,
  contacts,
  canPublish,
  onReload,
}: {
  events: Array<{ id: string; title: string; startDate: string; status: string }>;
  products: Array<{ id: string; name: string; category: string; status: string }>;
  announcements: Array<{ id: string; title: string; priority: string; status: string }>;
  contacts: Array<{ id: string; agencyName: string; phoneNumbers: string[]; category: string }>;
  canPublish: boolean;
  onReload: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [category, setCategory] = useState("Tourism Advisory");
  const [saving, setSaving] = useState(false);

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slug = `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "announcement",
          payload: {
            title,
            slug,
            summary,
            body: bodyText || summary,
            category,
            status: canPublish ? "published" : "pending_review",
          },
        }),
      });
      if (res.ok) {
        setTitle("");
        setSummary("");
        setBodyText("");
        await onReload();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save announcement.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handlePublishAnnouncement}
        className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4"
      >
        <h3 className="font-display text-lg font-bold text-[#202B28]">
          Post Municipal Announcement / Visitor Advisory
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement Title"
            className="sm:col-span-2 rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2 text-sm"
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2 text-sm"
          />
        </div>
        <input
          required
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Short summary for tourists..."
          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2 text-sm"
        />
        <textarea
          rows={2}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Full announcement body..."
          className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-[#123F35] text-white px-5 py-2 text-sm font-bold cursor-pointer"
        >
          {saving
            ? "Saving..."
            : canPublish
            ? "Publish Announcement"
            : "Submit for Review"}
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Municipal Events ({events.length})
          </h3>
          {events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl bg-[#F8F7F2] p-3 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-sm text-[#202B28]">{ev.title}</p>
                <p className="text-[#5A6B66]">{ev.startDate}</p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 font-bold capitalize">
                {ev.status}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Local Products ({products.length}) &amp; Advisories ({announcements.length})
          </h3>
          {products.map((pr) => (
            <div
              key={pr.id}
              className="rounded-xl bg-[#F8F7F2] p-3 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-sm text-[#202B28]">{pr.name}</p>
                <p className="text-[#5A6B66]">{pr.category}</p>
              </div>
              <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 font-bold capitalize">
                {pr.status}
              </span>
            </div>
          ))}
          {announcements.map((an) => (
            <div
              key={an.id}
              className="rounded-xl bg-[#F8F7F2] p-3 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-bold text-sm text-[#202B28]">{an.title}</p>
                <p className="text-[#5A6B66] capitalize">{an.priority}</p>
              </div>
              <span className="rounded-full bg-slate-200 text-slate-900 px-2.5 py-0.5 font-bold capitalize">
                {an.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
        <h3 className="font-display text-lg font-bold text-[#202B28]">
          Verified Emergency Hotlines ({contacts.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-xl bg-[#F8F7F2] p-3 text-xs">
              <p className="font-bold text-[#202B28]">{c.agencyName}</p>
              <p className="text-[#168A8A] font-mono">{c.phoneNumbers.join(", ")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminMediaPanel({
  assets,
  vercelBlobConfigured,
  onReload,
}: {
  assets: Array<{
    id: string;
    fileName: string;
    url: string;
    storageProvider: string;
    attribution: string | null;
  }>;
  vercelBlobConfigured: boolean;
  onReload: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [attribution, setAttribution] = useState("Municipality of Salcedo — CEDO");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!fileInput?.files?.[0]) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", fileInput.files[0]);
      fd.append("attribution", attribution);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Upload failed.");
      } else {
        form.reset();
        await onReload();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleUpload}
        className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Upload Verified Media Asset
          </h3>
          <span className="text-xs font-semibold text-[#168A8A]">
            Storage: {vercelBlobConfigured ? "Vercel Blob Active" : "Local /public/uploads Fallback"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-xs"
          />
          <input
            type="text"
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="Source Attribution"
            className="rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-[#123F35] text-white px-5 py-2.5 text-sm font-bold cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-2xl border border-[#E5E0D5] overflow-hidden text-xs"
          >
            <img src={a.url} alt={a.fileName} className="w-full h-36 object-cover" />
            <div className="p-3 space-y-1">
              <p className="font-bold text-[#202B28] truncate">{a.fileName}</p>
              <p className="text-[11px] text-[#5A6B66] truncate">{a.attribution}</p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(a.url)}
                className="text-[11px] font-bold text-[#168A8A] hover:underline cursor-pointer"
              >
                Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminGovernancePanel({
  users,
  auditLogs,
  privacySettings,
  analyticsSettings,
  onReload,
}: {
  users: Array<{
    id: string;
    username: string;
    fullName: string;
    email: string;
    roles: Array<{ slug: string; name: string }>;
  }>;
  auditLogs: Array<{
    id: string;
    actorUsername: string;
    action: string;
    summary: string;
    createdAt: string;
  }>;
  privacySettings: Array<{ settingKey: string; settingValue: unknown; description: string | null }>;
  analyticsSettings: Array<{ settingKey: string; settingValue: unknown; description: string | null }>;
  onReload: () => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleSlug, setRoleSlug] = useState("content_editor");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, fullName, password, roleSlug }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to create admin user.");
      return;
    }
    setUsername("");
    setEmail("");
    setFullName("");
    setPassword("");
    await onReload();
  };

  return (
    <div className="space-y-6">
      {/* Admin Users */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreateUser}
          className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#123F35]" />
            <h3 className="font-display text-lg font-bold text-[#202B28]">
              Create Admin User
            </h3>
          </div>
          <input
            required
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
          />
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Official Email"
            className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
          />
          <select
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value)}
            className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3 py-2 text-sm"
          >
            <option value="content_editor">Content Editor</option>
            <option value="tourism_admin">Tourism Administrator</option>
            <option value="visitor_data_officer">Authorized Visitor Data Officer</option>
            <option value="super_admin">Super Administrator</option>
          </select>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#123F35] text-white py-2.5 text-sm font-bold cursor-pointer"
          >
            Create Staff Account
          </button>
        </form>

        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#168A8A]" />
            <h3 className="font-display text-lg font-bold text-[#202B28]">
              RBAC Staff Accounts
            </h3>
          </div>
          <div className="space-y-2.5">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3.5 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <p className="font-bold text-sm text-[#202B28]">
                    {u.fullName} <span className="font-mono text-[#5A6B66]">({u.username})</span>
                  </p>
                  <p className="text-[#5A6B66]">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <span
                      key={r.slug}
                      className="rounded-full bg-[#123F35] text-white px-2.5 py-0.5 text-[11px] font-bold"
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy & Analytics Settings */}
      <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
        <h3 className="font-display text-lg font-bold text-[#202B28]">
          RA 10173 Privacy &amp; Analytics Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {[...privacySettings, ...analyticsSettings].map((s) => (
            <div
              key={s.settingKey}
              className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#123F35]">{s.settingKey}</span>
                <span className="font-bold text-[#202B28]">
                  {JSON.stringify(s.settingValue)}
                </span>
              </div>
              {s.description && <p className="text-[#5A6B66]">{s.description}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-3xl border border-[#E5E0D5] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <FileClock className="w-4 h-4 text-[#123F35]" />
          <h3 className="font-display text-lg font-bold text-[#202B28]">
            Immutable Admin Audit Log
          </h3>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl bg-[#F8F7F2] border border-[#E5E0D5] p-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-[#202B28]">{log.summary}</p>
                <p className="text-[#5A6B66]">
                  Actor: <strong>{log.actorUsername}</strong> • Action:{" "}
                  <span className="font-mono">{log.action}</span>
                </p>
              </div>
              <span className="text-[11px] text-[#5A6B66] shrink-0">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
