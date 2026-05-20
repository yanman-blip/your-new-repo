import { createFileRoute } from "@tanstack/react-router";

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
        <Card title="Auth" description="Use your own Supabase Auth admin URL for users, roles, and providers.">
          <Note text="Set Site URL and redirect URLs for production, preview, and localhost." />
        </Card>

        <Card title="Database" description="Use your own SQL/admin tooling for schema, policies, and data.">
          <Note text="Run all SQL files in supabase/migrations against your self-hosted database." />
        </Card>

        <Card title="Storage" description="Configure product and payment-proof buckets on your own Supabase instance.">
          <Note text="Confirm storage policies and CORS allow your web app domains." />
        </Card>

        <Card title="Deployment" description="Manage logs and environment variables in your own hosting provider.">
          <Note text="Required vars: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY), SUPABASE_SERVICE_ROLE_KEY." />
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

function Note({ text }: { text: string }) {
  return (
    <p className="text-sm text-foreground">{text}</p>
  );
}
