import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, Search, Shield, Users } from "lucide-react";
import { listUsers, setUserPremium, setUserRole } from "@/lib/admin-users.functions";
import { withData } from "@/lib/server-fn";
import { AppPage, EmptyState, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — BtechBuddy Admin" },
      {
        name: "description",
        content: "Review BtechBuddy students, grant admin or moderator roles and manage premium.",
      },
      { property: "og:title", content: "Users & Roles — BtechBuddy Admin" },
      {
        property: "og:description",
        content: "Review BtechBuddy students, grant admin or moderator roles and manage premium.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");

  const getUsers = useServerFn(listUsers);
  const roleFn = useServerFn(setUserRole);
  const premiumFn = useServerFn(setUserPremium);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => getUsers({ data: { search } }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const roleMutation = useMutation({
    mutationFn: withData(roleFn),
    onSuccess: () => {
      toast.success("Roles updated");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const premiumMutation = useMutation({
    mutationFn: withData(premiumFn),
    onSuccess: () => {
      toast.success("Plan updated");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = roleMutation.isPending || premiumMutation.isPending;

  return (
    <AppPage>
      <PageHeader
        title="Users & Roles"
        subtitle={`${users.length} student${users.length === 1 ? "" : "s"}`}
        back="/admin"
      />

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(term);
        }}
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by name"
          className="rounded-xl"
        />
        <Button type="submit" variant="outline" className="rounded-xl">
          <Search className="size-4" /> Search
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try a different search term."
        />
      ) : (
        <ul className="space-y-3">
          {users.map((u) => {
            const isAdmin = u.roles.includes("admin");
            const isModerator = u.roles.includes("moderator");
            return (
              <li key={u.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.branch ?? "—"} · Sem {u.semester ?? "—"} ·{" "}
                      {new Date(u.created_at).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {isAdmin && (
                        <Badge className="gap-1">
                          <Shield className="size-3" /> Admin
                        </Badge>
                      )}
                      {isModerator && <Badge variant="secondary">Moderator</Badge>}
                      {u.is_premium && (
                        <Badge variant="outline" className="gap-1">
                          <Crown className="size-3" /> Premium
                        </Badge>
                      )}
                      {!u.onboarded && <Badge variant="outline">Not onboarded</Badge>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                  <ToggleRow
                    label="Admin role"
                    checked={isAdmin}
                    disabled={pending}
                    onChange={(grant) =>
                      roleMutation.mutate({ user_id: u.id, role: "admin", grant })
                    }
                  />
                  <ToggleRow
                    label="Moderator role"
                    checked={isModerator}
                    disabled={pending}
                    onChange={(grant) =>
                      roleMutation.mutate({ user_id: u.id, role: "moderator", grant })
                    }
                  />
                  <ToggleRow
                    label="Premium access"
                    checked={u.is_premium}
                    disabled={pending}
                    onChange={(is_premium) =>
                      premiumMutation.mutate({ user_id: u.id, is_premium })
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button asChild variant="ghost" className="mt-6 w-full">
        <Link to="/admin">Back to content admin</Link>
      </Button>
    </AppPage>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
