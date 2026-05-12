import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Orbit" },
      { name: "description", content: "Talk to a real human. Orbit support, sales, and press contacts." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Contact</span>
      <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">Say hello.</h1>
      <p className="mt-4 text-muted-foreground text-lg">
        Questions about a phone, an order, or anything else? We answer within 24 hours.
      </p>
      <form
        onSubmit={(e) => { e.preventDefault(); }}
        className="mt-10 grid gap-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <input className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground/40" placeholder="Your name" />
          <input type="email" className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground/40" placeholder="Email" />
        </div>
        <textarea rows={5} className="rounded-xl bg-surface border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground/40" placeholder="How can we help?" />
        <button className="justify-self-start px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition">
          Send message
        </button>
      </form>
    </section>
  );
}
