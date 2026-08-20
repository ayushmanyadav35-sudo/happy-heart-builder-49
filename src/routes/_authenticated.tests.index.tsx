import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppPage, EmptyState, PageHeader } from "@/components/AppShell";
import { useMySubjects } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/tests/")({
  head: () => ({
    meta: [
      { title: "Mock Tests — BtechBuddy" },
      {
        name: "description",
        content: "Take timed mock tests and quizzes to check your exam readiness.",
      },
      { property: "og:title", content: "Mock Tests — BtechBuddy" },
      {
        property: "og:description",
        content: "Take timed mock tests and quizzes to check your exam readiness.",
      },
    ],
  }),
  component: TestsPage,
});

function TestsPage() {
  const { data: mine = [] } = useMySubjects();
  const subjectIds = mine.map((s) => s.subject_id);

  const { data: tests = [] } = useQuery({
    queryKey: ["tests", subjectIds],
    enabled: subjectIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("id, title, test_type, difficulty, duration_minutes, subject_id, is_premium")
        .in("subject_id", subjectIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: results = [] } = useQuery({
    queryKey: ["test-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select("id, test_id, score, total, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const nameOf = new Map(mine.map((s) => [s.subject_id, s.subject.name]));

  return (
    <AppPage>
      <PageHeader title="Mock Tests" subtitle="Practice under exam conditions" />

      {tests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tests available"
          description="Tests appear here once they're added for your subjects."
        />
      ) : (
        <ul className="space-y-2">
          {tests.map((t) => (
            <li key={t.id}>
              <Link
                to="/tests/$testId"
                params={{ testId: t.id }}
                className="block rounded-xl border border-border bg-card px-4 py-3"
              >
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{nameOf.get(t.subject_id) ?? "Subject"}</span>
                  <span>·</span>
                  <Clock className="size-3" />
                  <span>{t.duration_minutes} min</span>
                  <span>·</span>
                  <span className="capitalize">{t.difficulty}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {results.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-base font-semibold">Recent Attempts</h2>
          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <span className="text-sm font-semibold">
                  {r.score}/{r.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppPage>
  );
}
