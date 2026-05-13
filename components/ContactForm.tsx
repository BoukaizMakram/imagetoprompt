"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in your name, email, and message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not send message.");
      setStatus("sent");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Could not send message.");
    }
  };

  if (status === "sent") {
    return (
      <div className="bg-accent-lime rounded-3xl p-8 text-ink">
        <div className="text-2xl font-bold">Thanks — message sent ✓</div>
        <p className="mt-2 text-ink/75">
          We received your note and will get back to you at the email you provided within two
          business days.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-5 inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-black/5 rounded-3xl p-6 sm:p-8 shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_40px_-20px_rgba(0,0,0,0.08)]"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
        />
      </div>
      <div className="mt-4">
        <Field
          label="Subject"
          value={subject}
          onChange={setSubject}
          placeholder="What's this about?"
        />
      </div>
      <div className="mt-4">
        <label className="block text-xs font-semibold text-ink/65 mb-1.5">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind…"
          rows={6}
          className="w-full px-4 py-3 rounded-2xl bg-paper border border-black/10 focus:border-ink focus:outline-none text-[15px] resize-y"
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex items-center justify-end gap-4 flex-wrap">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-ink text-paper font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink/65 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl bg-paper border border-black/10 focus:border-ink focus:outline-none text-[15px]"
      />
    </div>
  );
}
