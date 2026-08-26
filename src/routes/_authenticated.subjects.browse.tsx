import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, ChevronRight, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppPage, EmptyState, PageHeader } from "@/components/AppShell";
import { BRANCHES } from "@/lib/academics";
import { Button } from "@/components/ui/button";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const Route = createFileRoute("/_authenticated/subjects/browse")({
  head: () => ({
    meta: [
      { title: "Browse Subjects — BtechBuddy" },
      {
        name: "description",
        content: "Explore B.Tech subjects by branch and semester, then open their units and topics.",
      },
      { property: "og:title", content: "Browse Subjects — BtechBuddy" },
      {
        property: "og:description",
        content: "Explore B.Tech subjects by branch and semester, then open their units and topics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrowseSubjectsPage,
});

function BrowseSubjectsPage() {
  const [branch, setBranch] = useState<string | null>(null);
  const [semester, setSemester] = useState<number | null>(null);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["browse-subjects", branch, semester],
    enabled: Boolean(branch && semester),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code, branch, semester")
        .eq("branch", branch!)
        .eq("semester", semester!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: topicCounts = {} } = useQuery({
    queryKey: ["browse-topic-counts", subjects.map((s) => s.id).join(",")],
    enabled: subjects.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, subject_id")
        .in(
          "subject_id",
          subjects.map((s) => s.id),
        );
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const t of data ?? []) counts[t.subject_id] = (counts[t.subject_id] ?? 0) + 1;
      return counts;
    },
  });

  return (
    <AppPage>
      <PageHeader
        title="Browse syllabus"
        subtitle="Pick a branch and semester to explore subjects"
        back="/subjects"
      />

      <section>
        <h2 className="mb-2 text-sm font-semibold">Branch</h2>
        <div className="flex flex-wrap gap-2">
          {BRANCHES.map((b) => (
            <button
              key={b.code}
              type="button"
              onClick={() => setBranch(b.code)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                branch === b.code
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {b.code}
            </button>
          ))}
        </div>
        {branch && (
          <p className="mt-2 text-xs text-muted-foreground">
            {BRANCHES.find((b) => b.code === branch)?.label}
          </p>
        )}
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">Semester</h2>
        <div className="grid grid-cols-4 gap-2">
          {SEMESTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSemester(s)}
              className={`rounded-xl border py-2 text-sm font-medium transition-colors ${
                semester === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground"
              }`}
            >
              Sem {s}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-heading text-base font-semibold">Subjects</h2>
        {!branch || !semester ? (
          <EmptyState
            icon={Compass}
            title="Choose a branch and semester"
            description="We'll list every subject in that semester with its topic count."
          />
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">Loading subjects…</p>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects here yet"
            description={`Nothing has been added for ${branch} Sem ${semester} so far.`}
          />
        ) : (
          <ul className="space-y-2">
            {subjects.map((s) => (
              <li key={s.id}>
                <Link
                  to="/subjects/$subjectId"
                  params={{ subjectId: s.id }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.code} · {topicCounts[s.id] ?? 0} topics
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button asChild variant="ghost" className="mt-6 w-full">
        <Link to="/subjects">Back to my subjects</Link>
      </Button>
    </AppPage>
  );
}
