"use client";

import { CheckCircle2, KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";

export default function SetupAdminPage() {
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("Sebastian Nunes");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function setup(event: FormEvent) {
    event.preventDefault();
    setNotice("");
    setOk(false);

    if (password !== confirm) {
      setNotice("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/bootstrap-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-action-secret": secret,
        },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Admin setup failed");
      }

      setOk(true);
      setNotice("Admin login configured successfully. You can now sign in.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Admin setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="setupPage">
      <form className="setupCard" onSubmit={setup}>
        <div className="authIcon"><KeyRound size={22} /></div>
        <p className="eyebrow">ONE-TIME OWNER SETUP</p>
        <h1>Configure Nunes Admin</h1>
        <p>
          This keeps the existing Admin user and adds a secure login password.
        </p>

        <label>
          Admin action secret
          <input
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </label>

        <label>
          Admin name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label>
          Admin email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            minLength={10}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            minLength={10}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        {notice && (
          <div className={ok ? "setupSuccess" : "authError"}>
            {ok && <CheckCircle2 size={16} />}
            {notice}
          </div>
        )}

        <button className="authSubmit" disabled={loading}>
          {loading ? "Configuring…" : "Configure Admin"}
        </button>

        <a className="setupLoginLink" href="/login">
          Back to login
        </a>
      </form>
    </main>
  );
}
