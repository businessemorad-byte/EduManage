"use client";

import { useState, type FormEvent } from "react";

export type ContactFormLabels = {
  name: string;
  email: string;
  subject: string;
  message: string;
  submit: string;
};

export default function ContactForm({
  labels,
  lang,
}: {
  labels: ContactFormLabels;
  lang: string;
}) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-green-700">
          {lang === "fr"
            ? "Merci ! Votre message a bien été envoyé."
            : "Thank you! Your message has been sent."}
        </p>
      </div>
    );
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700">{labels.name}</span>
          <input
            required
            type="text"
            name="name"
            autoComplete="name"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-700">{labels.email}</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">{labels.subject}</span>
        <input
          required
          type="text"
          name="subject"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">{labels.message}</span>
        <textarea
          required
          name="message"
          rows={5}
          className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          {labels.submit}
        </button>
      </div>
    </form>
  );
}