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
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
};

type Instrument = {
  id: string;
  productName: string;
  brand?: string | null;
  model?: string | null;
  calibrationDue?: string | null;
};

type Customer = {
  id: string;
  name: string;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  industry?: string | null;
  instruments: Instrument[];
  calibrations: Array<{ id: string; dueDate: string; status: string }>;
  serviceJobs: Array<{ id: string; jobNumber: string; status: string }>;
  leads: Array<{ id: string; type: string; status: string; requirement: string }>;
};

type InboxConversation = {
  id: string;
  channel: "NUNES_CONNECT" | "EMAIL" | "WHATSAPP";
  lastMessageAt?: string | null;
  latestMessage?: Message | null;
  customer: Customer;
  assignedUser?: { id: string; name: string; email: string } | null;
  messageCount: number;
  leadCount: number;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function categoryOf(conversation: InboxConversation) {
  if (
    conversation.customer.calibrations.some((item) =>
      ["UPCOMING", "DUE_SOON", "OVERDUE"].includes(item.status)
    )
  ) {
    return "Calibration";
  }

  if (
    conversation.customer.serviceJobs.some((item) =>
      ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "READY"].includes(item.status)
    )
  ) {
    return "Service";
  }

  return "Product";
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  const diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
  return diff;
}

export default function Home() {
  const searchParams = useSearchParams();
  const requestedConversation = searchParams.get("conversation");
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [replyAutomation, setReplyAutomation] = useState<{ intent?: string | null; campaignId?: string | null; leadId?: string | null } | null>(null);

  async function loadInbox() {
    try {
      setError("");
      const response = await fetch("/api/inbox", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load customer inbox.");
      const payload = await response.json();
      const rows: InboxConversation[] = payload.conversations ?? [];
      setConversations(rows);
      setActiveId((current) => {
        if (requestedConversation && rows.some((row) => row.id === requestedConversation)) {
          return requestedConversation;
        }
        return current || rows[0]?.id || "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load inbox.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/messages?conversationId=${encodeURIComponent(conversationId)}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Could not load messages.");
      const payload = await response.json();
      setMessages(payload.messages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load messages.");
    }
  }

  useEffect(() => {
    loadInbox();
  }, [requestedConversation]);

  useEffect(() => {
    loadMessages(activeId);
  }, [activeId]);

  const active =
    conversations.find((conversation) => conversation.id === activeId) ??
    conversations[0];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const latest = conversation.latestMessage?.body ?? "";
      return [
        conversation.customer.name,
        conversation.customer.company ?? "",
        conversation.customer.industry ?? "",
        latest,
        categoryOf(conversation),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [conversations, search]);

  async function sendMessage() {
    const body = composer.trim();
    if (!body || !active || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: active.id,
          direction: "OUTBOUND",
          channel: active.channel,
          body,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Message could not be saved.");
      }

      setComposer("");
      await Promise.all([loadMessages(active.id), loadInbox()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be saved.");
    } finally {
      setSending(false);
    }
  }


  async function simulateCustomerReply() {
    const body = composer.trim();
    if (!body || !active || sending) return;

    setSending(true);
    setError("");
    setReplyAutomation(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: active.id,
          direction: "INBOUND",
          channel: active.channel,
          body,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Customer reply could not be saved.");
      }

      setComposer("");
      setReplyAutomation(payload.replyAutomation ?? null);
      await Promise.all([loadMessages(active.id), loadInbox()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Customer reply could not be saved.");
    } finally {
      setSending(false);
    }
  }

  const activeCategory = active ? categoryOf(active) : "Product";
  const primaryInstrument = active?.customer.instruments?.[0];
  const calibrationDays = daysUntil(primaryInstrument?.calibrationDue);

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
          <Link href="/customers">
            <Users size={18} /> Customers
          </Link>
          <Link href="/leads">
            <Target size={18} /> Leads
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
            {loading && <div className="emptyState">Loading customer inbox…</div>}
            {!loading && error && conversations.length === 0 && (
              <div className="emptyState">{error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="emptyState">No customer conversations yet.</div>
            )}

            {filtered.map((conversation) => {
              const category = categoryOf(conversation);
              return (
                <button
                  key={conversation.id}
                  className={
                    "conversation " +
                    (conversation.id === activeId ? "conversationActive" : "")
                  }
                  onClick={() => setActiveId(conversation.id)}
                >
                  <div className="avatar">{initials(conversation.customer.name)}</div>
                  <div className="conversationBody">
                    <div className="conversationTop">
                      <strong>{conversation.customer.name}</strong>
                      <span>{formatTime(conversation.lastMessageAt)}</span>
                    </div>
                    <p className="company">
                      {conversation.customer.company ?? "Individual customer"}
                    </p>
                    <div className="conversationBottom">
                      <p>
                        {conversation.latestMessage?.body ??
                          `${category} customer conversation`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="chatPanel">
          {!active ? (
            <div className="emptyConversation">
              <MessageCircleMore size={34} />
              <h2>No conversation selected</h2>
              <p>Add or receive a customer message to start using Nunes Connect.</p>
            </div>
          ) : (
            <>
              <div className="chatHeader">
                <div className="chatIdentity">
                  <div className="avatar large">{initials(active.customer.name)}</div>
                  <div>
                    <h2>{active.customer.name}</h2>
                    <p>
                      {active.customer.company ?? "Customer"} ·{" "}
                      <span className="online">Live database customer</span>
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
                <span className={"status status" + activeCategory}>
                  {activeCategory}
                </span>
                <span>{active.messageCount} stored messages</span>
                <span>{active.leadCount} linked leads</span>
                <button>View full history</button>
              </div>

              <div className="messages">
                <div className="dateChip">Conversation</div>
                {messages.length === 0 && (
                  <div className="emptyState">No stored messages in this conversation.</div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      "messageRow " +
                      (message.direction === "OUTBOUND" ? "messageOwn" : "")
                    }
                  >
                    <div className="bubble">
                      <p>{message.body}</p>
                      <span>
                        {formatTime(message.sentAt ?? message.createdAt)}
                        {message.direction === "OUTBOUND"
                          ? ` · ${message.status.toLowerCase()}`
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="aiBar">
                <Sparkles size={18} />
                <div>
                  <strong>AI next-action foundation</strong>
                  <span>
                    {activeCategory === "Calibration"
                      ? "Calibration opportunity detected from the customer's instrument wallet."
                      : activeCategory === "Service"
                      ? "Active service requirement detected for this customer."
                      : "Product enquiry/customer relationship available for follow-up."}
                  </span>
                </div>
                <button>Create lead</button>
              </div>

              {replyAutomation && (
                <div className="replyAutomationBar">
                  <strong>{replyAutomation.intent || "GENERAL"}</strong>
                  <span>
                    {replyAutomation.campaignId
                      ? "Campaign response detected"
                      : "General customer reply"}
                    {replyAutomation.leadId ? " · Lead created" : ""}
                  </span>
                </div>
              )}

              {error && <div className="inlineError">{error}</div>}

              <div className="composer">
                <button className="composerIcon" aria-label="Attach file">
                  <Paperclip size={20} />
                </button>
                <input
                  value={composer}
                  onChange={(event) => setComposer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message to customer..."
                />
                <button className="quickAction">
                  <FileText size={15} /> Catalogue
                </button>
                <button className="quickAction">Quotation</button>
                <button
                  className="quickAction simulateReply"
                  type="button"
                  disabled={sending || !composer.trim()}
                  onClick={simulateCustomerReply}
                  title="Development test: save this text as a customer reply"
                >
                  Customer reply
                </button>
                <button
                  className="sendButton"
                  aria-label="Send message"
                  disabled={sending || !composer.trim()}
                  onClick={sendMessage}
                >
                  <Send size={19} />
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="customerPanel">
          {active && (
            <>
              <div className="customerCard">
                <div className="avatar customerAvatar">
                  {initials(active.customer.name)}
                </div>
                <h3>{active.customer.name}</h3>
                <p>{active.customer.company ?? "Customer"}</p>
                <div className="customerTags">
                  <span>{active.customer.industry ?? "Existing Customer"}</span>
                  <span>{active.channel.replace("_", " ")}</span>
                </div>
              </div>

              <div className="sideSection">
                <div className="sideTitle">
                  <h4>Customer intelligence</h4>
                  <Sparkles size={17} />
                </div>
                <div className="metric">
                  <span>Stored conversations</span>
                  <strong>{active.messageCount}</strong>
                </div>
                <div className="progress">
                  <div style={{ width: active.messageCount > 0 ? "78%" : "10%" }} />
                </div>
              </div>

              <div className="sideSection">
                <h4>Recommended next action</h4>
                <div className="recommendation">
                  <div className="recommendIcon">
                    {activeCategory === "Service" ? (
                      <Wrench size={19} />
                    ) : (
                      <ShieldCheck size={19} />
                    )}
                  </div>
                  <div>
                    <strong>
                      {activeCategory === "Calibration"
                        ? "Calibration Service"
                        : activeCategory === "Service"
                        ? "Service Follow-up"
                        : "Product Follow-up"}
                    </strong>
                    <p>Suggested from the customer's current records.</p>
                  </div>
                </div>
                <button className="primaryWide">Promote to customer</button>
              </div>

              <div className="sideSection">
                <h4>Instrument wallet</h4>
                {primaryInstrument ? (
                  <div className="instrument">
                    <strong>
                      {[primaryInstrument.brand, primaryInstrument.model]
                        .filter(Boolean)
                        .join(" ") || primaryInstrument.productName}
                    </strong>
                    <span>{primaryInstrument.productName}</span>
                    <p>
                      {calibrationDays === null
                        ? "Calibration date not recorded"
                        : calibrationDays < 0
                        ? `Calibration overdue by ${Math.abs(calibrationDays)} days`
                        : `Calibration due in ${calibrationDays} days`}
                    </p>
                  </div>
                ) : (
                  <div className="instrument">
                    <strong>No instrument stored</strong>
                    <span>Add the customer's equipment to build reminders.</span>
                  </div>
                )}
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
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
