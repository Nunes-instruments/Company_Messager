import AppHeader from "@/components/AppHeader";
import { AlertCircle, CheckCircle2, Clock3, Plus, Wrench } from "lucide-react";

const jobs = [
  ["SV-1048", "MI Engineering", "Digital Manometer", "In progress"],
  ["SV-1047", "Nova Pharma", "Laboratory Oven", "Waiting customer"],
  ["SV-1046", "Apex Testing Labs", "Analytical Balance", "Ready"],
];

export default function ServicePage() {
  return (
    <main className="appShell">
      <AppHeader active="service" />
      <section className="modulePage">
        <div className="moduleHero">
          <div><p className="eyebrow">AFTER-SALES SUPPORT</p><h1>Service</h1><p className="moduleSub">Track repairs, customer communication and service opportunities in one place.</p></div>
          <button className="newButton"><Plus size={18}/> New service job</button>
        </div>
        <div className="statGrid">
          <div className="statCard"><span>Open jobs</span><strong>18</strong><small>Currently under service</small></div>
          <div className="statCard"><span>Waiting customer</span><strong>07</strong><small>Approval or information required</small></div>
          <div className="statCard"><span>Ready to close</span><strong>05</strong><small>Completed and ready</small></div>
          <div className="statCard"><span>Service reminders</span><strong>126</strong><small>Customers due for follow-up</small></div>
        </div>
        <section className="panelCard">
          <div className="panelHeading"><div><h2>Live service queue</h2><p>Current customer jobs</p></div><Wrench size={20}/></div>
          <div className="tableList">
            {jobs.map((job) => <div className="tableRow serviceRow" key={job[0]}><strong>{job[0]}</strong><div><strong>{job[1]}</strong><span>{job[2]}</span></div><span className="pill ready">{job[3]}</span><button className="rowAction">Open</button></div>)}
          </div>
        </section>
        <div className="channelGrid">
          <div className="channelCard"><Clock3 size={22}/><strong>Automatic follow-up</strong><span>Remind customers based on service history.</span></div>
          <div className="channelCard"><AlertCircle size={22}/><strong>Attention queue</strong><span>Surface jobs waiting too long for action.</span></div>
          <div className="channelCard"><CheckCircle2 size={22}/><strong>Close & re-engage</strong><span>After completion, schedule the next service reminder.</span></div>
        </div>
      </section>
    </main>
  );
}
