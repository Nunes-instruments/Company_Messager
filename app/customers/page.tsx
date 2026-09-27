"use client";

import AppHeader from "@/components/AppHeader";
import { Check, Copy, Link2, MessageCircleMore, Search, UserPlus, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  industry?: string | null;
  consentWhatsApp: boolean;
  consentEmail: boolean;
  consentPush: boolean;
  _count?: {
    conversations: number;
    instruments: number;
    serviceJobs: number;
    calibrations: number;
    leads: number;
  };
};

const emptyForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  industry: "",
  consentWhatsApp: false,
  consentEmail: false,
  consentPush: true,
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [portalLink, setPortalLink] = useState<string | null>(null);

  async function loadCustomers() {
    setLoading(true);
    try {
      const response = await fetch("/api/customers", { cache: "no-store" });
      const payload = await response.json();
      setCustomers(payload.customers ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [
        customer.name,
        customer.company ?? "",
        customer.phone ?? "",
        customer.email ?? "",
        customer.city ?? "",
        customer.industry ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [customers, search]);

  async function createCustomer(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          company: form.company || null,
          phone: form.phone || null,
          email: form.email || null,
          city: form.city || null,
          state: form.state || null,
          industry: form.industry || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not create customer");
      }

      setForm(emptyForm);
      setShowForm(false);
      setNotice("Customer created successfully.");
      await loadCustomers();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create customer");
    } finally {
      setSaving(false);
    }
  }


  async function createPortalLink(customerId: string) {
    const secret = window.prompt(
      "Enter the Nunes admin action secret to create a secure customer portal link:"
    );

    if (!secret) return;

    setNotice("");
    setPortalLink(null);

    try {
      const response = await fetch("/api/portal-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-action-secret": secret,
        },
        body: JSON.stringify({
          customerId,
          label: "Customer portal",
          expiresInDays: 365,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not create customer portal link");
      }

      const absoluteUrl = new URL(payload.path, window.location.origin).toString();
      setPortalLink(absoluteUrl);

      try {
        await navigator.clipboard.writeText(absoluteUrl);
        setNotice("Secure customer portal link created and copied.");
      } catch {
        setNotice("Secure customer portal link created.");
      }
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not create customer portal link"
      );
    }
  }

  async function startChat(customerId: string) {
    setNotice("");

    try {
      const existing = await fetch(
        `/api/conversations?customerId=${encodeURIComponent(customerId)}`,
        { cache: "no-store" }
      );
      const existingPayload = await existing.json();
      const existingConversation = (existingPayload.conversations ?? []).find(
        (item: { channel: string; status: string }) =>
          item.channel === "NUNES_CONNECT" && item.status === "OPEN"
      );

      if (existingConversation) {
        window.location.href = `/?conversation=${existingConversation.id}`;
        return;
      }

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          channel: "NUNES_CONNECT",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not start conversation");
      }

      window.location.href = `/?conversation=${payload.conversation.id}`;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start conversation");
    }
  }

  return (
    <main className="appShell">
      <AppHeader active="customers" />
      <section className="modulePage">
        <div className="moduleHero">
          <div>
            <p className="eyebrow">CUSTOMER MASTER</p>
            <h1>Customers</h1>
            <p className="moduleSub">
              Add customers, review engagement history and start Nunes Connect conversations.
            </p>
          </div>
          <button className="newButton" onClick={() => setShowForm(true)}>
            <UserPlus size={18} /> Add customer
          </button>
        </div>

        <div className="statGrid">
          <div className="statCard"><span>Total customers</span><strong>{customers.length}</strong><small>Stored in the live database</small></div>
          <div className="statCard"><span>WhatsApp consent</span><strong>{customers.filter((c) => c.consentWhatsApp).length}</strong><small>Eligible before opt-out checks</small></div>
          <div className="statCard"><span>Email consent</span><strong>{customers.filter((c) => c.consentEmail).length}</strong><small>Eligible before opt-out checks</small></div>
          <div className="statCard"><span>Nunes Connect</span><strong>{customers.filter((c) => c.consentPush).length}</strong><small>Enabled for internal notifications</small></div>
        </div>

        <section className="panelCard">
          <div className="customerToolbar">
            <div>
              <h2>Customer directory</h2>
              <p>{filtered.length} customers visible</p>
            </div>
            <label className="searchBox customerSearch">
              <Search size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, company, phone, email or industry" />
            </label>
          </div>

          {notice && <div className="noticeBar">{notice}</div>}

          {portalLink && (
            <div className="portalLinkBar">
              <div>
                <strong>Customer portal link</strong>
                <span>{portalLink}</span>
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(portalLink);
                  setNotice("Portal link copied.");
                }}
              >
                <Copy size={15} /> Copy
              </button>
            </div>
          )}

          <div className="customerTable">
            <div className="customerTableHead">
              <span>Customer</span><span>Contact</span><span>Industry / Location</span><span>Relationship</span><span>Action</span>
            </div>

            {loading && <div className="emptyState">Loading customers…</div>}

            {!loading && filtered.map((customer) => (
              <div className="customerTableRow" key={customer.id}>
                <div><strong>{customer.name}</strong><span>{customer.company || "Individual customer"}</span></div>
                <div><strong>{customer.phone || "No phone"}</strong><span>{customer.email || "No email"}</span></div>
                <div><strong>{customer.industry || "Not classified"}</strong><span>{[customer.city, customer.state].filter(Boolean).join(", ") || "Location not set"}</span></div>
                <div className="relationshipMini">
                  <span>{customer._count?.conversations ?? 0} chats</span>
                  <span>{customer._count?.instruments ?? 0} instruments</span>
                  <span>{customer._count?.leads ?? 0} leads</span>
                </div>
                <div className="customerActions">
                  <button className="customerChatButton" onClick={() => startChat(customer.id)}>
                    <MessageCircleMore size={16} /> Chat
                  </button>
                  <button className="portalLinkButton" onClick={() => createPortalLink(customer.id)}>
                    <Link2 size={16} /> Portal
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {showForm && (
        <div className="modalBackdrop">
          <form className="modalCard" onSubmit={createCustomer}>
            <div className="modalTitle">
              <div><p className="eyebrow">NEW CUSTOMER</p><h2>Add to Nunes Connect</h2></div>
              <button type="button" className="iconButton" onClick={() => setShowForm(false)}><X size={19} /></button>
            </div>

            <div className="formGrid">
              <label>Customer name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>Company<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
              <label>Phone / WhatsApp<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label>State<input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></label>
              <label className="formFull">Industry<input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Laboratory, Pharma, Engineering..." /></label>
            </div>

            <div className="consentBox">
              <strong>Communication permissions</strong>
              <p>Only enable channels where the customer has provided the required consent.</p>
              <label><input type="checkbox" checked={form.consentPush} onChange={(e) => setForm({ ...form, consentPush: e.target.checked })} /> Nunes Connect notifications</label>
              <label><input type="checkbox" checked={form.consentWhatsApp} onChange={(e) => setForm({ ...form, consentWhatsApp: e.target.checked })} /> WhatsApp promotions</label>
              <label><input type="checkbox" checked={form.consentEmail} onChange={(e) => setForm({ ...form, consentEmail: e.target.checked })} /> Email promotions</label>
            </div>

            <div className="modalActions">
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="newButton" disabled={saving}>{saving ? "Saving…" : <><Check size={17} /> Save customer</>}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
