"use client";

import AppHeader from "@/components/AppHeader";
import { MessageCircleMore, Search, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  type: "PRODUCT" | "SERVICE" | "CALIBRATION";
  status: "NEW" | "ASSIGNED" | "FOLLOW_UP" | "QUOTATION" | "WON" | "LOST";
  requirement: string;
  source?: string | null;
  conversationId?: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    company?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  assignedUser?: { id: string; name: string } | null;
};

const statuses = ["NEW", "ASSIGNED", "FOLLOW_UP", "QUOTATION", "WON", "LOST"] as const;

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadLeads() {
    setLoading(true);
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const payload = await response.json();
      setLeads(payload.leads ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const statusMatch = statusFilter === "ALL" || lead.status === statusFilter;
      const textMatch =
        !q ||
        [
          lead.customer.name,
          lead.customer.company ?? "",
          lead.requirement,
          lead.type,
          lead.status,
          lead.source ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return statusMatch && textMatch;
    });
  }, [leads, search, statusFilter]);

  async function updateStatus(leadId: string, status: Lead["status"]) {
    setNotice("");
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not update lead");
      setNotice(`Lead moved to ${status.replace("_", " ")}.`);
      await loadLeads();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update lead");
    }
  }

  const counts = Object.fromEntries(
    statuses.map((status) => [
      status,
      leads.filter((lead) => lead.status === status).length,
    ])
  );

  return (
    <main className="appShell">
      <AppHeader active="leads" />
      <section className="modulePage">
        <div className="moduleHero">
          <div>
            <p className="eyebrow">SALES CONVERSION</p>
            <h1>Leads</h1>
            <p className="moduleSub">
              Campaign replies and customer requirements flow here for staff follow-up.
            </p>
          </div>
        </div>

        <div className="statGrid">
          <div className="statCard"><span>New</span><strong>{counts.NEW ?? 0}</strong><small>Fresh customer opportunities</small></div>
          <div className="statCard"><span>Follow-up</span><strong>{counts.FOLLOW_UP ?? 0}</strong><small>Needs staff action</small></div>
          <div className="statCard"><span>Quotation</span><strong>{counts.QUOTATION ?? 0}</strong><small>Price / quotation stage</small></div>
          <div className="statCard"><span>Won</span><strong>{counts.WON ?? 0}</strong><small>Converted opportunities</small></div>
        </div>

        <section className="panelCard">
          <div className="leadToolbar">
            <div className="leadFilters">
              <button className={statusFilter === "ALL" ? "filterActive" : ""} onClick={() => setStatusFilter("ALL")}>All</button>
              {statuses.map((status) => (
                <button
                  key={status}
                  className={statusFilter === status ? "filterActive" : ""}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            <label className="searchBox leadSearch">
              <Search size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, requirement or source" />
            </label>
          </div>

          {notice && <div className="noticeBar">{notice}</div>}

          <div className="leadList">
            {loading && <div className="emptyState">Loading leads…</div>}
            {!loading && filtered.length === 0 && <div className="emptyState">No leads in this view.</div>}

            {filtered.map((lead) => (
              <div className="leadCard" key={lead.id}>
                <div className="leadTypeIcon"><Target size={18} /></div>

                <div className="leadMain">
                  <div className="leadTop">
                    <div>
                      <strong>{lead.customer.name}</strong>
                      <span>{lead.customer.company || "Individual customer"}</span>
                    </div>
                    <span className={"status status" + (lead.type === "CALIBRATION" ? "Calibration" : lead.type === "SERVICE" ? "Service" : "Product")}>
                      {lead.type}
                    </span>
                  </div>
                  <p>{lead.requirement}</p>
                  <small>
                    {lead.source?.startsWith("campaign:")
                      ? "Campaign response"
                      : lead.source || "Customer conversation"}
                  </small>
                </div>

                <div className="leadStatusControl">
                  <label>Status</label>
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value as Lead["status"])}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="customerChatButton"
                  disabled={!lead.conversationId}
                  onClick={() => {
                    if (lead.conversationId) {
                      window.location.href = `/?conversation=${lead.conversationId}`;
                    }
                  }}
                >
                  <MessageCircleMore size={16} /> Open chat
                </button>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
