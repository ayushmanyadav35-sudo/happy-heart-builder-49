import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, CalendarClock, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { AppPage, PageHeader, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthUser } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_LABEL } from "@/lib/academics";

export const Route = createFileRoute("/_authenticated/revision")({
  head: () => ({
    meta: [
      { title: "Revision Plan — BtechBuddy" },
      {
        name: "description",
        content:
          "A days-left revision plan that shows what is overdue, due today and coming up this week.",
      },
      { property: "og:title", content: "Revision Plan — BtechBuddy" },
      {
        property: "og:description",
        content:
          "A days-left revision plan that shows what is overdue, due today and coming up this week.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RevisionPage,
});

interface RevisionRow {
  id: string;
  due_at: string;
  interval_days: number;
  last_revised_at: string | null;
  topic: { id: string; title: string; priority: string; subject_id: string } | null;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole days between today and the due date. Negative = overdue. */
function daysLeft(dueISO: string) {
  const due = new Date(dueISO);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - startOfToday()) / 86_400_000);
}

function daysLeftLabel(days: number) {
  if (days < -1) return `${Math.abs(days)} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

const BUCKETS = [
  { key: "overdue", title: "Overdue", hint: "Revise these first", match: (d: number) => d < 0 },
  { key: "today", title: "Due today", hint: "Today's plan", match: (d: number) => d === 0 },
  { key: "week", title: "Next 7 days", hint: "Coming up", match: (d: number) => d > 0 && d <= 7 },
  { key: "later", title: "Later", hint: "Scheduled ahead", match: (d: number) => d > 7 },
] as const;

function RevisionPage() {
  const { data: user } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["revision-items", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revision_items")
        .select(
          "id, due_at, interval_days, last_revised_at, topic:topics(id, title, priority, subject_id)",
        )
        .order("due_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as RevisionRow[];
    },
  });

  const reschedule = useMutation({
    mutationFn: async ({ item, days }: { item: RevisionRow; days: number }) => {
      const dueAt = new Date(startOfToday() + days * 86_400_000).toISOString();
      const { error } = await supabase
        .from("revision_items")
        .update({
          interval_days: days,
          due_at: dueAt,
          last_revised_at: new Date().toISOString(),
        })
        .eq("id", item.id);
      if (error) throw error;
      return days;
    },
    onSuccess: (days) => {
      toast.success(`Scheduled again in ${days} day${days === 1 ? "" : "s"}`);
      void queryClient.invalidateQueries({ queryKey: ["revision-items", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const snooze = useMutation({
    mutationFn: async (item: RevisionRow) => {
      const dueAt = new Date(startOfToday() + 86_400_000).toISOString();
      const { error } = await supabase
        .from("revision_items")
        .update({ due_at: dueAt })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pushed to tomorrow");
      void queryClient.invalidateQueries({ queryKey: ["revision-items", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = reschedule.isPending || snooze.isPending;
  const withDays = items.map((item) => ({ item, days: daysLeft(item.due_at) }));
  const dueNow = withDays.filter((x) => x.days <= 0).length;

  return (
    <AppPage>
      <PageHeader title="Revision plan" subtitle="Scheduled by days left until each review" />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your plan…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="Nothing to revise yet"
          description="Mark topics as done while studying and they'll show up here on a spaced schedule."
          action={
            <Button asChild className="rounded-xl">
              <Link to="/subjects">Go to subjects</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              icon={Clock3}
              label="Ready to revise"
              value={`${dueNow}`}
              tone="accent"
            />
            <SummaryCard
              icon={CalendarClock}
              label="Scheduled ahead"
              value={`${items.length - dueNow}`}
              tone="muted"
            />
          </div>

          {BUCKETS.map((bucket) => {
            const rows = withDays.filter((x) => bucket.match(x.days));
            if (rows.length === 0) return null;
            return (
              <section key={bucket.key}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="text-sm font-semibold text-foreground">
                    {bucket.title} ({rows.length})
                  </h2>
                  <span className="text-xs text-muted-foreground">{bucket.hint}</span>
                </div>
                <ul className="space-y-2">
                  {rows.map(({ item, days }) => (
                    <li key={item.id} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.topic?.title ?? "Topic"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {daysLeftLabel(days)} · every {item.interval_days} day
                            {item.interval_days === 1 ? "" : "s"}
                            {item.last_revised_at
                              ? ` · last ${new Date(item.last_revised_at).toLocaleDateString()}`
                              : ""}
                          </p>
                        </div>
                        {item.topic?.priority && (
                          <Badge variant={days <= 0 ? "default" : "outline"}>
                            {PRIORITY_LABEL[item.topic.priority] ?? item.topic.priority}
                          </Badge>
                        )}
                      </div>

                      {days <= 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                          {[1, 3, 7].map((d) => (
                            <Button
                              key={d}
                              size="sm"
                              variant={d === 3 ? "default" : "outline"}
                              className="rounded-lg"
                              disabled={pending}
                              onClick={() => reschedule.mutate({ item, days: d })}
                            >
                              <CheckCircle2 className="size-4" /> Revised · +{d}d
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() => snooze.mutate(item)}
                          >
                            Snooze
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </AppPage>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  tone: "accent" | "muted";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        tone === "accent" ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-2 font-heading text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
