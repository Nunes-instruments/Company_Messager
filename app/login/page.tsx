"use client";

import { LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (response.ok) window.location.href = "/";
      })
      .catch(() => undefined);
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Login failed");
      }

      const next =
        new URLSearchParams(window.location.search).get("next") || "/";
      window.location.href = next.startsWith("/") ? next : "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authBrandPanel">
        <div className="authLogo">N</div>
        <p className="authEyebrow">NUNES INSTRUMENTATION</p>
        <h1>Nunes Connect</h1>
        <p className="authLead">
          Customer messaging, campaigns, service, calibration and lead conversion
          in one secure workspace.
        </p>

        <div className="authFeature">
          <ShieldCheck size={19} />
          <div>
            <strong>Protected staff workspace</strong>
            <span>Role-based access for Admin, Manager and Staff.</span>
          </div>
        </div>
      </section>

      <section className="authFormPanel">
        <form className="authCard" onSubmit={login}>
          <div className="authIcon"><LockKeyhole size={22} /></div>
          <p className="eyebrow">STAFF ACCESS</p>
          <h2>Sign in to Nunes Connect</h2>
          <p className="authHint">
            Use the email and password assigned by your Nunes administrator.
          </p>

          <label>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@nunes..."
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••"
            />
          </label>

          {error && <div className="authError">{error}</div>}

          <button className="authSubmit" disabled={loading}>
            <LogIn size={18} />
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="authFooterText">
            First-time owner setup? <a href="/setup-admin">Configure Admin</a>
          </div>
        </form>
      </section>
    </main>
  );
}
