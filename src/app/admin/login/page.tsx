"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Sign-in failed.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A2421] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5">
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#616E69] hover:text-[#164237] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tourist App
        </Link>

        <div className="bg-white rounded-3xl border border-[#EAE7E0] p-7 space-y-6">
          <div className="flex items-center gap-3">
            <img
              src="/images/salcedo/turi-logo.png"
              alt="Project CEDO: Turi Logo"
              className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-xs"
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#616E69]">
                Project CEDO: Turi
              </p>
              <h1 className="font-display text-xl font-bold text-[#1A2421]">
                Admin Console
              </h1>
            </div>
          </div>

          <div className="rounded-xl bg-[#F3F2EE] p-3 text-xs text-[#616E69] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#164237] shrink-0 mt-0.5" />
            <span>
              Restricted to authorized LGU tourism staff. Tourist browsing remains
              account-free.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#616E69]">
                Username or Official Email
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cedo_superadmin"
                className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#164237]/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#616E69]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#EAE7E0] bg-[#FAF9F6] pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#164237]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#616E69] hover:text-[#1A2421] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#164237] text-white py-3 text-xs font-semibold hover:bg-[#10322A] transition disabled:opacity-60 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
