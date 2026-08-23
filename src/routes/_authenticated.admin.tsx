import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { checkAdmin } from "@/lib/admin.functions";
import { AppPage } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — BtechBuddy" },
      { name: "description", content: "Manage syllabus, notes, PYQs and tests." },
      { property: "og:title", content: "Admin — BtechBuddy" },
      { property: "og:description", content: "Manage syllabus, notes, PYQs and tests." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const verify = useServerFn(checkAdmin);
  const { isLoading, error } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => verify(),
    retry: false,
  });

  if (isLoading) {
    return (
      <AppPage>
        <p className="text-center text-sm text-muted-foreground">Checking admin access…</p>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-6 py-10 text-center">
          <h1 className="font-heading text-xl font-semibold text-destructive">Admin only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view this page.
          </p>
        </div>
      </AppPage>
    );
  }

  return <Outlet />;
}
