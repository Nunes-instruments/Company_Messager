import AppHeader from "@/components/AppHeader";
import { ArrowRight, Mail, Megaphone, MessageCircleMore, Plus, Sparkles, Users } from "lucide-react";

const campaigns = [
  { name: "Calibration Due — 30 Days", audience: "248 customers", channel: "WhatsApp + Email", status: "Ready" },
  { name: "Laboratory Products", audience: "1,426 customers", channel: "Nunes Connect", status: "Draft" },
  { name: "Old Customer Re-Engagement", audience: "892 customers", channel: "Email", status: "Paused" },
];

export default function CampaignsPage() {
  return (
    <main className="appShell">
      <AppHeader active="campaigns" />
      <section className="modulePage">
        <div className="moduleHero">
          <div>
            <p className="eyebrow">CUSTOMER ENGAGEMENT</p>
            <h1>Campaigns</h1>
            <p className="moduleSub">Promote the right product, service or calibration offer to the right customers.</p>
          </div>
          <button className="newButton"><Plus size={18}/> Create campaign</button>
        </div>

        <div className="statGrid">
          <div className="statCard"><span>Eligible customers</span><strong>3,842</strong><small>Available for targeted campaigns</small></div>
          <div className="statCard"><span>Active campaigns</span><strong>06</strong><small>Across product, service and calibration</small></div>
          <div className="statCard"><span>Responses</span><strong>428</strong><small>Customer replies this month</small></div>
          <div className="statCard"><span>Leads created</span><strong>117</strong><small>Converted from campaign replies</small></div>
        </div>

        <div className="moduleGrid">
          <section className="panelCard panelWide">
            <div className="panelHeading"><div><h2>Campaign workspace</h2><p>Current promotion flows</p></div><Megaphone size={20}/></div>
            <div className="tableList">
              {campaigns.map((campaign) => (
                <div className="tableRow" key={campaign.name}>
                  <div><strong>{campaign.name}</strong><span>{campaign.audience}</span></div>
                  <span>{campaign.channel}</span>
                  <span className={"pill " + campaign.status.toLowerCase()}>{campaign.status}</span>
                  <button className="rowAction"><ArrowRight size={17}/></button>
                </div>
              ))}
            </div>
          </section>

          <section className="panelCard">
            <div className="panelHeading"><div><h2>AI audience</h2><p>Smart targeting</p></div><Sparkles size={20}/></div>
            <div className="suggestCard"><Users size={22}/><div><strong>1,126 strong matches</strong><p>Customers with prior laboratory instrument interest.</p></div></div>
            <button className="primaryWide">Build AI campaign</button>
          </section>
        </div>

        <div className="channelGrid">
          <div className="channelCard"><MessageCircleMore size={22}/><strong>Nunes Connect</strong><span>Direct in-app promotions and customer notifications.</span></div>
          <div className="channelCard"><Mail size={22}/><strong>Email</strong><span>Catalogues, offers, service and calibration campaigns.</span></div>
          <div className="channelCard"><MessageCircleMore size={22}/><strong>WhatsApp</strong><span>Approved customer messaging flows and follow-ups.</span></div>
        </div>
      </section>
    </main>
  );
}
