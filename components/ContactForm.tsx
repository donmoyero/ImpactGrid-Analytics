"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) return setStatus("sent");
      setError((await res.json()).error ?? "Something went wrong.");
    } catch {
      setError("Couldn't send your message. Please try again.");
    }
    setStatus("error");
  }

  if (status === "sent") {
    return (
      <p className="mt-10 rounded-2xl border border-blueprint2 bg-ink2 p-6 text-sm">
        Thanks, your message has been sent. We&apos;ll reply by email.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      <input name="name" required className="input" placeholder="Your name" />
      <input name="email" required type="email" className="input" placeholder="Email" />
      <textarea name="message" required rows={5} className="input resize-none" placeholder="How can we help?" />
      {status === "error" && <p className="text-sm text-signal">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-medium text-ink hover:bg-blueprint2 disabled:opacity-60"
      >
        {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
        Send message
      </button>
    </form>
  );
}
