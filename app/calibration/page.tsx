import AppHeader from "@/components/AppHeader";
import { BellRing, CalendarClock, CheckCircle2, Plus, ShieldCheck } from "lucide-react";

const due = [
  ["OHAUS AX224/E", "Apex Testing Labs", "26 days", "Upcoming"],
  ["Pressure Gauge PG-12", "Vertex Instruments", "12 days", "Due soon"],
  ["Temperature Calibrator", "Nova Pharma", "Overdue 4 days", "Overdue"],
];

export default function CalibrationPage() {
  return (
    <main className="appShell">
      <AppHeader active="calibration" />
      <section className="modulePage">
        <div className="moduleHero">
          <div><p className="eyebrow">CALIBRATION LIFECYCLE</p><h1>Calibration</h1><p className="moduleSub">Turn calibration due dates into timely reminders, service leads and repeat business.</p></div>
          <button className="newButton"><Plus size={18}/> Add instrument</button>
        </div>
        <div className="statGrid">
          <div className="statCard"><span>Due in 30 days</span><strong>126</strong><small>Upcoming customer instruments</small></div>
          <div className="statCard"><span>Due in 7 days</span><strong>38</strong><small>High-priority reminders</small></div>
          <div className="statCard"><span>Overdue</span><strong>17</strong><small>Immediate follow-up required</small></div>
          <div className="statCard"><span>Booked</span><strong>42</strong><small>Calibration jobs confirmed</small></div>
        </div>
        <section className="panelCard">
          <div className="panelHeading"><div><h2>Calibration due queue</h2><p>Instrument wallet reminders</p></div><ShieldCheck size={20}/></div>
          <div className="tableList">
            {due.map((item) => <div className="tableRow calibrationRow" key={item[0]}><div><strong>{item[0]}</strong><span>{item[1]}</span></div><strong>{item[2]}</strong><span className={"pill " + (item[3] === "Overdue" ? "paused" : "ready")}>{item[3]}</span><button className="rowAction">Notify</button></div>)}
          </div>
        </section>
        <div className="channelGrid">
          <div className="channelCard"><CalendarClock size={22}/><strong>30 / 15 / 7 day reminders</strong><span>Structured reminder stages before the due date.</span></div>
          <div className="channelCard"><BellRing size={22}/><strong>Customer notification</strong><span>Send relevant reminders through configured channels.</span></div>
          <div className="channelCard"><CheckCircle2 size={22}/><strong>Booking conversion</strong><span>Convert a customer response directly into a calibration lead.</span></div>
        </div>
      </section>
    </main>
  );
}
