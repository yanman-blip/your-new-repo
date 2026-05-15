import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Joy's Closet" },
      { name: "description", content: "Questions about sizing, care, or your order? The Joy's Closet team replies within 24 hours." },
      { property: "og:title", content: "Contact Joy's Closet" },
      { property: "og:description", content: "We reply within 24 hours, in English or French." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">L'atelier</span>
      <h1 className="mt-3 text-5xl md:text-6xl font-semibold tracking-tight">Bonjour.</h1>
      <p className="mt-4 text-muted-foreground text-lg">
        Sizing questions, fabric care, a tricky exchange? Send us a note and our team in Harare will get back to you within 24 hours.
        in English or French.
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
