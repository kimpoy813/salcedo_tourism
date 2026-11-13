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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
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
    <div className="min-h-screen bg-[#0D3029] flex flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <img
            src="/images/salcedo/seal-of-salcedo.png"
            alt="Municipality of Salcedo Seal"
            className="w-12 h-12 rounded-full border border-[#E5E0D5] p-0.5 bg-white"
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#168A8A]">
              Authorized Municipal Personnel Only
            </p>
            <h1 className="font-display text-xl font-bold text-[#202B28]">
              Project CEDO Admin Console
            </h1>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F8F7F2] border border-[#E5E0D5] p-3.5 flex items-start gap-2.5 text-xs text-[#5A6B66]">
          <ShieldCheck className="w-4 h-4 text-[#123F35] shrink-0 mt-0.5" />
          <span>
            Role-based access control enforced server-side. Tourists do not require login and
            should use <strong className="text-[#123F35]">/app</strong>.
          </span>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202B28]">Staff Username</label>
            <input
              required
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., cedo_superadmin"
              className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#202B28]">Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-[#E5E0D5] bg-[#F8F7F2] pl-3.5 pr-10 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5A6B66] hover:text-[#202B28] cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#123F35] text-white py-3 text-sm font-bold hover:bg-[#0D3029] disabled:opacity-50 transition cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            {loading ? "Signing In..." : "Sign In to CEDO Admin"}
          </button>
        </form>

        <div className="pt-2 border-t border-[#E5E0D5] text-center">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#168A8A] hover:text-[#123F35] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Tourist Mobile App (/app)
          </Link>
        </div>
      </div>
    </div>
  );
}
