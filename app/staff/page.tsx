"use client";

import AppHeader from "@/components/AppHeader";
import { Check, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  active: boolean;
  passwordChangedAt?: string | null;
  _count?: {
    assignedLeads: number;
    assignedServiceJobs: number;
    conversations: number;
  };
};

export default function StaffPage() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });

  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/staff", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not load staff");
      setUsers(payload.users ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createStaff(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not create staff");
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      setShowForm(false);
      setNotice("Staff account created.");
      await loadUsers();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create staff");
    } finally {
      setSaving(false);
    }
  }

  async function updateStaff(id: string, patch: Record<string, unknown>) {
    setNotice("");
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not update staff");
      setNotice("Staff access updated.");
      await loadUsers();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update staff");
    }
  }

  return (
    <main className="appShell">
      <AppHeader active="customers" />
      <section className="modulePage">
        <div className="moduleHero">
          <div>
            <p className="eyebrow">ADMINISTRATION</p>
            <h1>Staff Access</h1>
            <p className="moduleSub">
              Admin controls who can sign in and which role each person has.
            </p>
          </div>
          <button className="newButton" onClick={() => setShowForm(true)}>
            <UserPlus size={18} /> Add staff
          </button>
        </div>

        <div className="statGrid">
          <div className="statCard"><span>Total users</span><strong>{users.length}</strong><small>All staff accounts</small></div>
          <div className="statCard"><span>Admins</span><strong>{users.filter((u) => u.role === "ADMIN").length}</strong><small>Full access</small></div>
          <div className="statCard"><span>Managers</span><strong>{users.filter((u) => u.role === "MANAGER").length}</strong><small>Campaign and operational control</small></div>
          <div className="statCard"><span>Active staff</span><strong>{users.filter((u) => u.active).length}</strong><small>Can sign in</small></div>
        </div>

        {notice && <div className="noticeBar">{notice}</div>}

        <section className="panelCard">
          <div className="panelHeading">
            <div><h2>Team permissions</h2><p>Admin / Manager / Staff</p></div>
            <ShieldCheck size={20} />
          </div>

          {loading && <div className="emptyState">Loading staff…</div>}

          <div className="staffList">
            {users.map((user) => (
              <div className="staffRow" key={user.id}>
                <div className="staffAvatar">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
                <div className="staffIdentity">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="staffStats">
                  <span>{user._count?.assignedLeads ?? 0} leads</span>
                  <span>{user._count?.assignedServiceJobs ?? 0} service jobs</span>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => updateStaff(user.id, { role: e.target.value })}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                </select>
                <button
                  className={user.active ? "staffActiveButton" : "staffDisabledButton"}
                  onClick={() => updateStaff(user.id, { active: !user.active })}
                >
                  {user.active ? "Active" : "Disabled"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </section>

      {showForm && (
        <div className="modalBackdrop">
          <form className="modalCard staffModal" onSubmit={createStaff}>
            <div className="modalTitle">
              <div><p className="eyebrow">NEW STAFF USER</p><h2>Create login</h2></div>
              <button type="button" className="iconButton" onClick={() => setShowForm(false)}><X size={19} /></button>
            </div>

            <div className="formGrid">
              <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Password<input type="password" minLength={10} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
              <label>Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
            </div>

            <div className="modalActions">
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="newButton" disabled={saving}>{saving ? "Creating…" : <><Check size={17} /> Create staff</>}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
