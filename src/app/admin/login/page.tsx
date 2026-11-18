"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Kicker, Wordmark } from "@/components/ui/FieldGuide";
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
    <main className="staff-login">
      <aside className="staff-login-landscape">
        <div>
          <Kicker>Municipality of Salcedo</Kicker>
          <h2>Tourism office</h2>
          <p>Manage the place directory, visitor information, and submitted itineraries.</p>
          <figure className="staff-relief">
            <img
              src="/app/maps/valley-plate.webp"
              width="640"
              height="394"
              alt="Relief model of the Buaya River valley"
            />
            <figcaption>
              Buaya River valley · <Link href="/app/more#sources">GEBCO</Link> ·{" "}
              <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>
            </figcaption>
          </figure>
        </div>
      </aside>
      <section className="staff-login-form">
        <Link className="back-link" href="/app/">
          <ArrowLeft size={15} />
          Back to the visitor guide
        </Link>
        <div className="login-inner">
          <Wordmark subtitle="Tourism office" />
          <div className="login-heading">
            <Kicker>Staff workspace</Kicker>
            <h1>Staff sign in</h1>
            <p>Use your municipal staff account to continue.</p>
          </div>
          <form onSubmit={handleSubmit} aria-busy={loading}>
            <label htmlFor="username">Username or official email</label>
            <input
              id="username"
              name="username"
              className="guide-field"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label htmlFor="password">Password</label>
            <div className="login-password">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="guide-field"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button" type="submit" disabled={loading}>
              <Lock size={15} />
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="staff-notice">
            <ShieldCheck size={17} />
            For authorized LGU staff. Visitors can explore and plan trips without signing in.
          </p>
        </div>
        <p className="login-colophon">
          Project CEDO: Turi <span>·</span> Salcedo, Ilocos Sur
        </p>
      </section>
    </main>
  );
}
