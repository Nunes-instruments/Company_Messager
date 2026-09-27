"use client";

import Link from "next/link";
import {
  Bell,
  Megaphone,
  MessageCircleMore,
  Target,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

export default function AppHeader({
  active,
}: {
  active: "messages" | "customers" | "leads" | "campaigns" | "service" | "calibration";
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brandMark">N</div>
        <div>
          <strong>NUNES CONNECT</strong>
          <span>Nunes Instrumentation</span>
        </div>
      </div>
      <nav className="mainNav">
        <Link className={active === "messages" ? "navActive" : ""} href="/">
          <MessageCircleMore size={18} /> Messages
        </Link>
        <Link className={active === "customers" ? "navActive" : ""} href="/customers">
          <Users size={18} /> Customers
        </Link>
        <Link className={active === "leads" ? "navActive" : ""} href="/leads">
          <Target size={18} /> Leads
        </Link>
        <Link className={active === "campaigns" ? "navActive" : ""} href="/campaigns">
          <Megaphone size={18} /> Campaigns
        </Link>
        <Link className={active === "service" ? "navActive" : ""} href="/service">
          <Wrench size={18} /> Service
        </Link>
        <Link className={active === "calibration" ? "navActive" : ""} href="/calibration">
          <ShieldCheck size={18} /> Calibration
        </Link>
      </nav>
      <div className="topActions">
        <button className="iconButton" aria-label="Notifications"><Bell size={20} /></button>
        <button className="iconButton" aria-label="Settings"><Settings size={20} /></button>
        <div className="ownerBadge">SN</div>
      </div>
    </header>
  );
}
