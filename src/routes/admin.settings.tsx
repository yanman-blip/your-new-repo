import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [{ title: "Settings - WET LACE Admin" }],
  }),
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <section>
      <header className="mb-5">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Store configuration, account, and integrations.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Account" description="Your admin login. Manage in the Supabase dashboard.">
          <DashboardLink
            href="https://supabase.com/dashboard/project/yqhcbasmpotpgxybfjzo/auth/users"
            label="Open Supabase users"
          />
        </Card>

        <Card title="Database" description="Tables, RLS policies, and SQL editor.">
          <DashboardLink
            href="https://supabase.com/dashboard/project/yqhcbasmpotpgxybfjzo/editor"
            label="Open Supabase tables"
          />
        </Card>

        <Card title="Storage" description="Product images and payment proofs.">
          <DashboardLink
            href="https://supabase.com/dashboard/project/yqhcbasmpotpgxybfjzo/storage/buckets"
            label="Open Supabase storage"
          />
        </Card>

        <Card title="Deployment" description="Logs and environment variables on Cloudflare.">
          <DashboardLink
            href="https://dash.cloudflare.com/"
            label="Open Cloudflare dashboard"
          />
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        More in-app settings (store hours, default delivery fees, notification preferences) coming soon.
      </p>
    </section>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function DashboardLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-80"
    >
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}
