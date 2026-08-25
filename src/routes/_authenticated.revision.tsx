import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AppPage, PageHeader, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/revision")({
  head: () => ({
    meta: [
      { title: "Spaced Revision — BtechBuddy" },
      {
        name: "description",
        content: "Revise topics right before you forget them with spaced repetition.",
      },
      { property: "og:title", content: "Spaced Revision — BtechBuddy" },
      {
        property: "og:description",
        content: "Revise topics right before you forget them with spaced repetition.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RevisionPage,
});

type RevisionRow = {
  id: string;
  due_at: string;
  interval_days: number;
  last_revised_at: string | null;
  topic: { id: string; title: string; priority: string } | null;
};

function RevisionPage() {
  const { data: user } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["revision-items", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revision_items")
        .select("id, due_at, interval_days, last_revised_at, topic:topics(id, title, priority)")
        .order("due_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RevisionRow[];
    },
  });

  const markRevised = useMutation({
    mutationFn: async (item: RevisionRow) => {
      const nextInterval = Math.min(item.interval_days * 2 || 1, 30);
      const dueAt = new Date(Date.now() + nextInterval * 86_400_000).toISOString();
      const { error } = await supabase
        .from("revision_items")
        .update({
          interval_days: nextInterval,
          due_at: dueAt,
          last_revised_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nice! Scheduled for later.");
      queryClient.invalidateQueries({ queryKey: ["revision-items", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = Date.now();
  const due = items.filter((i) => new Date(i.due_at).getTime() <= now);
  const upcoming = items.filter((i) => new Date(i.due_at).getTime() > now);

  return (
    <AppPage>
      <PageHeader title="Revision" subtitle="Spaced repetition keeps topics fresh" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="Nothing to revise yet"
          description="Mark topics as done while studying and they'll show up here for timed revision."
        />
      ) : (
        <div className="space-y-5">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-foreground">Due now ({due.length})</h2>
            {due.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up.</p>
            ) : (
              <ul className="space-y-2">
                {due.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.topic?.title ?? "Topic"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Every {item.interval_days} day{item.interval_days === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={markRevised.isPending}
                      onClick={() => markRevised.mutate(item)}
                    >
                      <CheckCircle2 className="size-4" /> Revised
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-foreground">Upcoming</h2>
              <ul className="space-y-2">
                {upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                  >
                    <span className="truncate text-sm">{item.topic?.title ?? "Topic"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.due_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppPage>
  );
}
