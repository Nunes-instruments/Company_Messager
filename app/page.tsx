"use client";

import {
  Bell,
  CirclePlus,
  FileText,
  Megaphone,
  MessageCircleMore,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Conversation = {
  id: number;
  name: string;
  company: string;
  preview: string;
  time: string;
  unread: number;
  category: "Product" | "Service" | "Calibration";
  initials: string;
};

const conversations: Conversation[] = [
  {
    id: 1,
    name: "Arun Kumar",
    company: "Apex Testing Labs",
    preview: "Please send the calibration quotation.",
    time: "09:42",
    unread: 2,
    category: "Calibration",
    initials: "AK",
  },
  {
    id: 2,
    name: "Priya S",
    company: "Vertex Instruments",
    preview: "Do you have OHAUS AX224/E ready stock?",
    time: "09:18",
    unread: 1,
    category: "Product",
    initials: "PS",
  },
  {
    id: 3,
    name: "Mohammed Irfan",
    company: "MI Engineering",
    preview: "Machine is showing an error after startup.",
    time: "Yesterday",
    unread: 0,
    category: "Service",
    initials: "MI",
  },
  {
    id: 4,
    name: "Rakesh",
    company: "Nova Pharma",
    preview: "Send your latest laboratory catalogue.",
    time: "Yesterday",
    unread: 0,
    category: "Product",
    initials: "RK",
  },
];

const demoMessages = [
  {
    from: "customer",
    text: "Good morning. We purchased an analytical balance from you last year.",
    time: "09:34",
  },
  {
    from: "nunes",
    text: "Good morning, sir. Yes, we can see the instrument in your account.",
    time: "09:35",
  },
  {
    from: "customer",
    text: "We need calibration support now. Can you send the quotation?",
    time: "09:38",
  },
  {
    from: "nunes",
    text: "Certainly. Please confirm the model and quantity. We will prepare the calibration quotation.",
    time: "09:40",
  },
];

export default function Home() {
  const [activeId, setActiveId] = useState(1);
  const [search, setSearch] = useState("");

  const active =
    conversations.find((conversation) => conversation.id === activeId) ??
    conversations[0];

  const filtered = useMemo(
    () =>
      conversations.filter((conversation) =>
        [
          conversation.name,
          conversation.company,
          conversation.preview,
          conversation.category,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [search]
  );

  return (
    <main className="appShell">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark">N</div>
          <div>
            <strong>NUNES CONNECT</strong>
            <span>Nunes Instrumentation</span>
          </div>
        </div>

        <nav className="mainNav">
          <Link className="navActive" href="/">
            <MessageCircleMore size={18} /> Messages
          </Link>
          <Link href="/campaigns">
            <Megaphone size={18} /> Campaigns
          </Link>
          <Link href="/service">
            <Wrench size={18} /> Service
          </Link>
          <Link href="/calibration">
            <ShieldCheck size={18} /> Calibration
          </Link>
        </nav>

        <div className="topActions">
          <button className="iconButton" aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button className="iconButton" aria-label="Settings">
            <Settings size={20} />
          </button>
          <div className="ownerBadge">SN</div>
        </div>
      </header>

      <section className="workspace">
        <aside className="chatList">
          <div className="listHeader">
            <div>
              <p className="eyebrow">CUSTOMER INBOX</p>
              <h1>Messages</h1>
            </div>
            <button className="newButton">
              <CirclePlus size={18} /> New
            </button>
          </div>

          <label className="searchBox">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer or company"
            />
          </label>

          <div className="filters">
            <button className="filterActive">All</button>
            <button>Unread</button>
            <button>Product</button>
            <button>Service</button>
          </div>

          <div className="conversationList">
            {filtered.map((conversation) => (
              <button
                key={conversation.id}
                className={
                  "conversation " +
                  (conversation.id === activeId ? "conversationActive" : "")
                }
                onClick={() => setActiveId(conversation.id)}
              >
                <div className="avatar">{conversation.initials}</div>
                <div className="conversationBody">
                  <div className="conversationTop">
                    <strong>{conversation.name}</strong>
                    <span>{conversation.time}</span>
                  </div>
                  <p className="company">{conversation.company}</p>
                  <div className="conversationBottom">
                    <p>{conversation.preview}</p>
                    {conversation.unread > 0 && (
                      <span className="unread">{conversation.unread}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="chatPanel">
          <div className="chatHeader">
            <div className="chatIdentity">
              <div className="avatar large">{active.initials}</div>
              <div>
                <h2>{active.name}</h2>
                <p>
                  {active.company} · <span className="online">Active customer</span>
                </p>
              </div>
            </div>
            <div className="chatActions">
              <button aria-label="Search conversation">
                <Search size={19} />
              </button>
              <button aria-label="More actions">
                <MoreVertical size={19} />
              </button>
            </div>
          </div>

          <div className="contextStrip">
            <span className={"status status" + active.category}>
              {active.category}
            </span>
            <span>Customer since 2024</span>
            <span>3 previous enquiries</span>
            <button>View full history</button>
          </div>

          <div className="messages">
            <div className="dateChip">Today</div>
            {demoMessages.map((message, index) => (
              <div
                key={index}
                className={
                  "messageRow " + (message.from === "nunes" ? "messageOwn" : "")
                }
              >
                <div className="bubble">
                  <p>{message.text}</p>
                  <span>{message.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="aiBar">
            <Sparkles size={18} />
            <div>
              <strong>AI suggestion</strong>
              <span>
                Customer is asking for calibration. Create a calibration lead and
                prepare quotation.
              </span>
            </div>
            <button>Create lead</button>
          </div>

          <div className="composer">
            <button className="composerIcon" aria-label="Attach file">
              <Paperclip size={20} />
            </button>
            <input placeholder="Type a message to customer..." />
            <button className="quickAction">
              <FileText size={15} /> Catalogue
            </button>
            <button className="quickAction">Quotation</button>
            <button className="sendButton" aria-label="Send message">
              <Send size={19} />
            </button>
          </div>
        </section>

        <aside className="customerPanel">
          <div className="customerCard">
            <div className="avatar customerAvatar">{active.initials}</div>
            <h3>{active.name}</h3>
            <p>{active.company}</p>
            <div className="customerTags">
              <span>Existing Customer</span>
              <span>High Value</span>
            </div>
          </div>

          <div className="sideSection">
            <div className="sideTitle">
              <h4>Customer intelligence</h4>
              <Sparkles size={17} />
            </div>
            <div className="metric">
              <span>Relationship score</span>
              <strong>92%</strong>
            </div>
            <div className="progress">
              <div style={{ width: "92%" }} />
            </div>
          </div>

          <div className="sideSection">
            <h4>Recommended next action</h4>
            <div className="recommendation">
              <div className="recommendIcon">
                <ShieldCheck size={19} />
              </div>
              <div>
                <strong>Calibration Service</strong>
                <p>High match based on previous purchase.</p>
              </div>
            </div>
            <button className="primaryWide">Promote to customer</button>
          </div>

          <div className="sideSection">
            <h4>Instrument wallet</h4>
            <div className="instrument">
              <strong>OHAUS AX224/E</strong>
              <span>Analytical Balance</span>
              <p>Calibration due in 26 days</p>
            </div>
          </div>

          <div className="sideSection">
            <h4>Quick actions</h4>
            <div className="quickGrid">
              <button>Product</button>
              <button>Service</button>
              <button>Calibration</button>
              <button>Campaign</button>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
