"use client";

import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCheck,
  MessageCircleMore,
  Send,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PortalMessage = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  status: string;
  createdAt: string;
  sentAt?: string | null;
};

type PortalPayload = {
  customer: {
    id: string;
    name: string;
    company?: string | null;
    instruments: Array<{
      id: string;
      productName: string;
      brand?: string | null;
      model?: string | null;
      serialNumber?: string | null;
      calibrationDue?: string | null;
    }>;
    calibrations: Array<{
      id: string;
      dueDate: string;
      status: string;
    }>;
    serviceJobs: Array<{
      id: string;
      jobNumber: string;
      status: string;
      problem?: string | null;
    }>;
  };
  conversation: {
    id: string;
    channel: string;
  };
  messages: PortalMessage[];
};

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function dueText(value?: string | null) {
  if (!value) return "Calibration date not recorded";
  const diff = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
  if (diff === 0) return "Calibration due today";
  return `Calibration due in ${diff} days`;
}

export default function CustomerPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [data, setData] = useState<PortalPayload | null>(null);
  const [composer, setComposer] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadPortal() {
    try {
      setError("");
      const response = await fetch(`/api/portal/${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "This customer link is unavailable.");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open Nunes Connect.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadPortal();
  }, [token]);

  async function sendReply() {
    const body = composer.trim();
    if (!body || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/portal/${encodeURIComponent(token)}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Message could not be sent.");
      }

      setComposer("");
      await loadPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  const primaryInstrument = useMemo(
    () => data?.customer.instruments?.[0] ?? null,
    [data]
  );

  if (loading) {
    return (
      <main className="portalLoading">
        <div className="portalLogo">N</div>
        <p>Opening Nunes Connect…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="portalLoading">
        <div className="portalLogo">N</div>
        <h1>Link unavailable</h1>
        <p>{error || "This customer access link may have expired."}</p>
      </main>
    );
  }

  return (
    <main className="customerPortal">
      <header className="portalHeader">
        <div className="portalHeaderLeft">
          <button aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="portalAvatar">N</div>
          <div>
            <strong>Nunes Instrumentation</strong>
            <span>Customer Connect</span>
          </div>
        </div>
        <button className="portalBell" aria-label="Notifications">
          <Bell size={19} />
        </button>
      </header>

      <section className="portalWelcome">
        <div>
          <p className="portalEyebrow">WELCOME BACK</p>
          <h1>{data.customer.name}</h1>
          <span>{data.customer.company || "Nunes customer account"}</span>
        </div>
        <div className="portalSecure">
          <ShieldCheck size={16} />
          Secure customer link
        </div>
      </section>

      <section className="portalCards">
        <article className="portalInfoCard">
          <div className="portalCardIcon"><ShieldCheck size={20} /></div>
          <div>
            <span>Instrument wallet</span>
            <strong>
              {primaryInstrument
                ? [primaryInstrument.brand, primaryInstrument.model]
                    .filter(Boolean)
                    .join(" ") || primaryInstrument.productName
                : "No instrument added"}
            </strong>
            <small>
              {primaryInstrument
                ? dueText(primaryInstrument.calibrationDue)
                : "Your purchased instruments can appear here"}
            </small>
          </div>
        </article>

        <article className="portalInfoCard">
          <div className="portalCardIcon"><Wrench size={20} /></div>
          <div>
            <span>Service</span>
            <strong>{data.customer.serviceJobs.length} records</strong>
            <small>
              {data.customer.serviceJobs[0]
                ? data.customer.serviceJobs[0].status.replace("_", " ")
                : "No active service job"}
            </small>
          </div>
        </article>

        <article className="portalInfoCard">
          <div className="portalCardIcon"><CalendarClock size={20} /></div>
          <div>
            <span>Calibration</span>
            <strong>{data.customer.calibrations.length} records</strong>
            <small>
              {data.customer.calibrations[0]
                ? data.customer.calibrations[0].status.replace("_", " ")
                : "No calibration reminder"}
            </small>
          </div>
        </article>
      </section>

      <section className="portalChat">
        <div className="portalChatTitle">
          <div>
            <MessageCircleMore size={18} />
            <strong>Chat with Nunes</strong>
          </div>
          <span>Usually replies during business hours</span>
        </div>

        <div className="portalMessages">
          <div className="portalDateChip">Conversation</div>

          {data.messages.length === 0 && (
            <div className="portalEmpty">
              <MessageCircleMore size={28} />
              <strong>No messages yet</strong>
              <span>Send a message to Nunes Instrumentation.</span>
            </div>
          )}

          {data.messages.map((message) => (
            <div
              key={message.id}
              className={
                "portalMessageRow " +
                (message.direction === "INBOUND" ? "portalMessageOwn" : "")
              }
            >
              <div className="portalBubble">
                <p>{message.body}</p>
                <span>
                  {formatTime(message.sentAt ?? message.createdAt)}
                  {message.direction === "OUTBOUND" && (
                    <CheckCheck size={13} />
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="portalError">{error}</div>}

        <div className="portalComposer">
          <input
            value={composer}
            onChange={(event) => setComposer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendReply();
              }
            }}
            placeholder="Message Nunes Instrumentation"
          />
          <button
            aria-label="Send"
            disabled={sending || !composer.trim()}
            onClick={sendReply}
          >
            <Send size={19} />
          </button>
        </div>
      </section>

      <footer className="portalFooter">
        <strong>NUNES CONNECT</strong>
        <span>Products · Service · Calibration · Support</span>
      </footer>
    </main>
  );
}
