import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Shield, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { AppPage, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuthUser, useProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — BtechBuddy" },
      { name: "description", content: "Manage your academic details and account on BtechBuddy." },
      { property: "og:title", content: "Your Profile — BtechBuddy" },
      {
        property: "og:description",
        content: "Manage your academic details and account on BtechBuddy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const { data: profile } = useProfile();

  const { data: roles = [] } = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    },
  });
  const isAdmin = roles.includes("admin");

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/login" });
  }

  return (
    <AppPage>
      <PageHeader title="Profile" subtitle={user?.email ?? undefined} />

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-base font-semibold text-foreground">
          {profile?.full_name || "Student"}
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">University</dt>
            <dd className="font-medium">{profile?.university ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Branch</dt>
            <dd className="font-medium">{profile?.branch ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Year / Semester</dt>
            <dd className="font-medium">
              {profile?.year ?? "—"} / {profile?.semester ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-medium">{profile?.is_premium ? "Premium" : "Free"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Roles</dt>
            <dd className="font-medium capitalize">
              {roles.length > 0 ? roles.join(", ") : "Student"}
            </dd>
          </div>
        </dl>
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link to="/setup-profile">
            <GraduationCap className="size-4" /> Edit academic details
          </Link>
        </Button>
      </section>

      {isAdmin && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-heading text-base font-semibold text-foreground">Admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage syllabus content, and review users and their roles.
          </p>
          <Button asChild className="mt-3 w-full">
            <Link to="/admin">
              <Shield className="size-4" /> Open admin panel
            </Link>
          </Button>
          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/admin/users">Users &amp; roles</Link>
          </Button>
        </section>
      )}

      <Button variant="ghost" className="mt-4 w-full text-destructive" onClick={signOut}>
        <LogOut className="size-4" /> Sign out
      </Button>
    </AppPage>
  );
}
