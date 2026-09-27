"use client";

import AppHeader from "@/components/AppHeader";
import { ArrowRight, Mail, Megaphone, MessageCircleMore, Plus, Search, Sparkles, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Campaign = {
  id: string;
  name: string;
  type: string;
  status: string;
  channel: string;
  message: string;
  _count?: { recipients: number };
};

type AudienceCustomer = {
  id: string;
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  industry?: string | null;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channel, setChannel] = useState("NUNES_CONNECT");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [audience, setAudience] = useState<AudienceCustomer[]>([]);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [loadingAudience, setLoadingAudience] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignType, setCampaignType] = useState("PRODUCT");
  const [notice, setNotice] = useState("");

  async function loadCampaigns() {
    const response = await fetch("/api/campaigns", { cache: "no-store" });
    const payload = await response.json();
    setCampaigns(payload.campaigns ?? []);
  }

  async function loadAudience() {
    setLoadingAudience(true);
    setNotice("");
    try {
      const params = new URLSearchParams({
        channel,
        ...(industry.trim() ? { industry: industry.trim() } : {}),
        ...(city.trim() ? { city: city.trim() } : {}),
      });
      const response = await fetch(`/api/campaign-audience?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not build audience");
      setAudience(payload.customers ?? []);
      setEligibleCount(payload.eligibleCount ?? 0);
      setMatchedCount(payload.totalMatched ?? 0);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not build audience");
    } finally {
      setLoadingAudience(false);
    }
  }

  useEffect(() => { loadCampaigns(); }, []);
  useEffect(() => { loadAudience(); }, [channel]);

  const activeCampaigns = useMemo(
    () => campaigns.filter((campaign) => ["SCHEDULED", "RUNNING"].includes(campaign.status)).length,
    [campaigns]
  );

  async function createCampaign() {
    if (!campaignName.trim() || !campaignMessage.trim()) {
      setNotice("Campaign name and message are required.");
      return;
    }
    setNotice("");
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName.trim(),
          type: campaignType,
          message: campaignMessage.trim(),
          channel,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not create campaign");
      setCampaignName("");
      setCampaignMessage("");
      setNotice("Campaign draft created successfully.");
      await loadCampaigns();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create campaign");
    }
  }

  return (
    <main className="appShell">
      <AppHeader active="campaigns" />
      <section className="modulePage">
        <div className="moduleHero">
          <div>
            <p className="eyebrow">CUSTOMER ENGAGEMENT</p>
            <h1>Campaigns</h1>
            <p className="moduleSub">Build a real customer audience using consent, opt-out and customer profile rules.</p>
          </div>
          <button className="newButton" onClick={createCampaign}><Plus size={18} /> Save draft campaign</button>
        </div>

        <div className="statGrid">
          <div className="statCard"><span>Eligible customers</span><strong>{eligibleCount}</strong><small>{matchedCount} matched before channel rules</small></div>
          <div className="statCard"><span>Campaigns</span><strong>{campaigns.length}</strong><small>Saved in the live database</small></div>
          <div className="statCard"><span>Active campaigns</span><strong>{activeCampaigns}</strong><small>Scheduled or running</small></div>
          <div className="statCard"><span>Current channel</span><strong className="statText">{channel.replace("_", " ")}</strong><small>Audience respects permissions</small></div>
        </div>

        {notice && <div className="noticeBar">{notice}</div>}

        <div className="moduleGrid">
          <section className="panelCard panelWide">
            <div className="panelHeading"><div><h2>Audience builder</h2><p>Only eligible customers are returned</p></div><Users size={20} /></div>

            <div className="campaignBuilder">
              <label>Channel
                <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                  <option value="NUNES_CONNECT">Nunes Connect</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </label>
              <label>Industry<input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Laboratory, Pharma..." /></label>
              <label>City<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Coimbatore" /></label>
              <button className="customerChatButton audienceSearch" onClick={loadAudience} disabled={loadingAudience}>
                <Search size={16} /> {loadingAudience ? "Checking…" : "Build audience"}
              </button>
            </div>

            <div className="audienceSummary">
              <strong>{eligibleCount} eligible</strong>
              <span>Active customers with channel consent and no opt-out.</span>
            </div>

            <div className="customerTable compactAudienceTable">
              <div className="customerTableHead audienceHead"><span>Customer</span><span>Industry</span><span>Location</span><span>Contact</span></div>
              {audience.length === 0 && <div className="emptyState">No eligible customers for the current filters.</div>}
              {audience.slice(0, 50).map((customer) => (
                <div className="customerTableRow audienceRow" key={customer.id}>
                  <div><strong>{customer.name}</strong><span>{customer.company || "Individual customer"}</span></div>
                  <div><strong>{customer.industry || "Not classified"}</strong></div>
                  <div><strong>{[customer.city, customer.state].filter(Boolean).join(", ") || "Not set"}</strong></div>
                  <div><strong>{channel === "EMAIL" ? customer.email || "No email" : customer.phone || "Nunes Connect"}</strong></div>
                </div>
              ))}
            </div>
          </section>

          <section className="panelCard">
            <div className="panelHeading"><div><h2>Create campaign</h2><p>Save a real draft</p></div><Sparkles size={20} /></div>
            <div className="campaignForm">
              <label>Campaign name<input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="September Calibration Reminder" /></label>
              <label>Campaign type
                <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
                  <option value="PRODUCT">Product</option>
                  <option value="SERVICE">Service</option>
                  <option value="CALIBRATION">Calibration</option>
                  <option value="REENGAGEMENT">Re-engagement</option>
                </select>
              </label>
              <label>Message<textarea value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} placeholder="Write the approved customer-facing message..." rows={7} /></label>
              <button className="primaryWide" onClick={createCampaign}>Save draft</button>
            </div>
          </section>
        </div>

        <section className="panelCard">
          <div className="panelHeading"><div><h2>Saved campaigns</h2><p>Live campaign records from PostgreSQL</p></div><Megaphone size={20} /></div>
          <div className="tableList">
            {campaigns.length === 0 && <div className="emptyState">No campaigns created yet.</div>}
            {campaigns.map((campaign) => (
              <div className="tableRow" key={campaign.id}>
                <div><strong>{campaign.name}</strong><span>{campaign._count?.recipients ?? 0} recipients attached</span></div>
                <span>{campaign.channel.replace("_", " ")}</span>
                <span className={"pill " + campaign.status.toLowerCase()}>{campaign.status}</span>
                <button className="rowAction"><ArrowRight size={17} /></button>
              </div>
            ))}
          </div>
        </section>

        <div className="channelGrid">
          <div className="channelCard"><MessageCircleMore size={22} /><strong>Nunes Connect</strong><span>Direct in-app promotions and notifications.</span></div>
          <div className="channelCard"><Mail size={22} /><strong>Email</strong><span>Catalogues, service reminders and campaigns.</span></div>
          <div className="channelCard"><MessageCircleMore size={22} /><strong>WhatsApp</strong><span>Requires consent and respects opt-outs.</span></div>
        </div>
      </section>
    </main>
  );
}
