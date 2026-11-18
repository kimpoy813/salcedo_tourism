"use client";

import { StaffNotice } from "./StaffNotice";
import React, { useState } from "react";
import { FileClock, Shield, Upload, UserPlus } from "lucide-react";

export { AdminContentPanel } from "./AdminContentPanel";

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
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!fileInput?.files?.[0]) return;
    setUploading(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append("file", fileInput.files[0]);
      fd.append("attribution", attribution);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        setNotice({ text: err.error || "Upload failed.", tone: "err" });
      } else {
        form.reset();
        setNotice({ text: "Asset uploaded.", tone: "ok" });
        await onReload();
      }
    } catch {
      setNotice({ text: "Upload could not be confirmed. Check the media library before trying again.", tone: "err" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <StaffNotice notice={notice} dismiss={() => setNotice(null)} />

      <form
        onSubmit={handleUpload}
        className="bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-3 text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-[#1A2421]">
            Upload Media Asset
          </h3>
          <span className="text-[11px] font-medium text-[#616E69]">
            {vercelBlobConfigured ? "Vercel Blob Active" : "Local Storage"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="grid gap-1.5 font-medium">Image file (PNG, JPG, WebP or GIF)
          <input
            required
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
          />
          </label>
          <label className="grid gap-1.5 font-medium">Photo credit
          <input
            type="text"
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="Photographer or source"
            className="rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
          />
          </label>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#164237] text-white px-4 py-2 font-semibold cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </form>

      {assets.length === 0 && <p className="empty-note">No images yet. Upload a photo above to use it in the guide.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {assets.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-2xl border border-[#EAE7E0] overflow-hidden text-xs"
          >
            <img src={a.url} alt={a.fileName} className="w-full h-32 object-cover" />
            <div className="p-3 space-y-1">
              <p className="font-semibold text-[#1A2421] truncate">{a.fileName}</p>
              <p className="text-[11px] text-[#616E69] truncate">{a.attribution}</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(a.url);
                    setNotice({ text: "Image URL copied.", tone: "ok" });
                  } catch { setNotice({ text: `Copy this image URL: ${a.url}`, tone: "ok" }); }
                }}
                className="text-[11px] font-semibold text-[#164237] hover:underline cursor-pointer"
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
  canUsers, canAudit, canSettings,
  privacySettings,
  analyticsSettings,
  onReload,
}: {
  canUsers: boolean;
  canAudit: boolean;
  canSettings: boolean;
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
  privacySettings: Array<{
    settingKey: string;
    settingValue: unknown;
    description: string | null;
  }>;
  analyticsSettings: Array<{
    settingKey: string;
    settingValue: unknown;
    description: string | null;
  }>;
  onReload: () => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [roleSlug, setRoleSlug] = useState("content_editor");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

  const [creating, setCreating] = useState(false);
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, fullName, password, roleSlug }),
      });
      if (!res.ok) {
        const err = await res.json();
        setNotice({ text: err.error || "Failed to create admin user.", tone: "err" });
        return;
      }
      setUsername("");
      setEmail("");
      setFullName("");
      setPassword("");
      setNotice({ text: "Staff account created.", tone: "ok" });
      await onReload();
    } catch {
      setNotice({ text: "The account could not be confirmed. Check the account list before trying again.", tone: "err" });
    } finally { setCreating(false); }
  };

  return (
    <div className="space-y-4">
      <StaffNotice notice={notice} dismiss={() => setNotice(null)} />

      {canUsers && <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <form
          onSubmit={handleCreateUser}
          className="lg:col-span-5 bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-2.5 text-xs"
        >
          <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[#1A2421]">
            <UserPlus className="w-4 h-4 text-[#164237]" />
            Create Staff User
          </div>
          <input
            required
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
          />
          <input
            required
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Official Email"
            className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
          />
          <label className="grid gap-1 font-medium">Staff role
          <select
            value={roleSlug}
            onChange={(e) => setRoleSlug(e.target.value)}
            className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3 py-2"
          >
            <option value="content_editor">Content Editor</option>
            <option value="tourism_admin">Tourism Administrator</option>
            <option value="visitor_data_officer">Visitor Data Officer</option>
            <option value="super_admin">Super Administrator</option>
          </select>
          </label>
          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-full bg-[#164237] text-white py-2.5 font-semibold cursor-pointer"
          >
            {creating ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-3">
          <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[#1A2421]">
            <Shield className="w-4 h-4 text-[#1D7874]" />
            Staff accounts
          </div>
          <ul className="divide-y divide-[#EAE7E0] text-xs">
            {users.map((u) => (
              <li key={u.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1A2421]">
                    {u.fullName}{" "}
                    <span className="font-mono text-[#616E69]">({u.username})</span>
                  </p>
                  <p className="text-[11px] text-[#616E69]">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <span
                      key={r.slug}
                      className="rounded-full bg-[#F3F2EE] text-[#164237] px-2.5 py-0.5 text-[10px] font-semibold"
                    >
                      {r.name}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>}

      {canSettings && <div className="bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-2.5">
        <h3 className="font-display text-sm font-bold text-[#1A2421]">
          RA 10173 &amp; Analytics Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {[...privacySettings, ...analyticsSettings].map((s) => (
            <div
              key={s.settingKey}
              className="rounded-xl bg-[#FAF9F6] border border-[#EAE7E0] p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-[#164237]">
                  {s.settingKey}
                </span>
                <span className="font-medium text-[#1A2421]">
                  {JSON.stringify(s.settingValue)}
                </span>
              </div>
              {s.description && (
                <p className="text-[11px] text-[#616E69]">{s.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>}

      {canAudit && <div className="bg-white rounded-2xl border border-[#EAE7E0] p-5 space-y-2.5">
        <div className="flex items-center gap-1.5 font-display text-sm font-bold text-[#1A2421]">
          <FileClock className="w-4 h-4 text-[#164237]" />
          Audit Log
        </div>
        <ul tabIndex={0} aria-label="Recent audit entries" className="divide-y divide-[#EAE7E0] max-h-72 overflow-y-auto text-xs">
          {auditLogs.map((log) => (
            <li key={log.id} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[#1A2421]">{log.summary}</p>
                <p className="text-[11px] text-[#616E69]">
                  {log.actorUsername} • <span className="font-mono">{log.action}</span>
                </p>
              </div>
              <span className="text-[10px] text-[#616E69] shrink-0 tabular-nums">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>}
    </div>
  );
}
