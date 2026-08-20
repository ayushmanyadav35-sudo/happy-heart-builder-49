import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { FileText, HelpCircle, Layers } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppPage, EmptyState, PageHeader } from "@/components/AppShell";
import { ProgressRing, PriorityBadge } from "@/components/ProgressRing";
import { useAuthUser } from "@/hooks/useAuth";
import { useSubjectTopics, useTopicProgress, readiness } from "@/lib/queries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/subjects/$subjectId")({
  head: () => ({
    meta: [
      { title: "Subject Details — BtechBuddy" },
      {
        name: "description",
        content: "Unit-wise topics, notes and previous year questions for this subject.",
      },
      { property: "og:title", content: "Subject Details — BtechBuddy" },
      {
        property: "og:description",
        content: "Unit-wise topics, notes and previous year questions for this subject.",
      },
    ],
  }),
  component: SubjectDetail,
});

function SubjectDetail() {
  const { subjectId } = Route.useParams();
  const { data: user } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: subject } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code, branch, semester")
        .eq("id", subjectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("id, number, title")
        .eq("subject_id", subjectId)
        .order("number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: topics = [] } = useSubjectTopics(subjectId);
  const { data: progress = [] } = useTopicProgress();

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, note_type, file_url, is_premium, unit_id")
        .eq("subject_id", subjectId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pyqs = [] } = useQuery({
    queryKey: ["pyqs", subjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pyqs")
        .select("id, question, marks, years, frequency, question_type, unit_id")
        .eq("subject_id", subjectId)
        .order("frequency", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const statusMap = new Map(progress.map((p) => [p.topic_id, p.status]));

  const toggle = useMutation({
    mutationFn: async ({ topicId, done }: { topicId: string; done: boolean }) => {
      const { error } = await supabase.from("topic_progress").upsert(
        {
          user_id: user!.id,
          topic_id: topicId,
          status: done ? "completed" : "not_started",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["topic-progress"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const score = readiness(
    topics.map((t) => t.id),
    progress,
  );

  return (
    <AppPage>
      <PageHeader
        title={subject?.name ?? "Subject"}
        subtitle={subject?.code ?? ""}
        back="/subjects"
        right={<ProgressRing value={score} size={48} stroke={6} />}
      />

      <Tabs defaultValue="topics">
        <TabsList className="grid w-full grid-cols-3 rounded-xl">
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="pyqs">PYQs</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="mt-4 space-y-5">
          {topics.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No topics yet"
              description="Syllabus content for this subject hasn't been added yet."
            />
          ) : (
            groupByUnit(units, topics).map((group) => (
              <div key={group.id}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((t) => {
                    const done = statusMap.get(t.id) === "completed";
                    return (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <Checkbox
                          checked={done}
                          onCheckedChange={(v) =>
                            toggle.mutate({ topicId: t.id, done: Boolean(v) })
                          }
                        />
                        <span
                          className={
                            done
                              ? "min-w-0 flex-1 truncate text-sm text-muted-foreground line-through"
                              : "min-w-0 flex-1 truncate text-sm font-medium"
                          }
                        >
                          {t.title}
                        </span>
                        <PriorityBadge priority={t.priority} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          {notes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description="Notes for this subject will appear here once uploaded."
            />
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <FileText className="size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {n.note_type.replace("_", " ")}
                    </p>
                  </div>
                  {n.file_url && (
                    <a
                      href={n.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary"
                    >
                      Open
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="pyqs" className="mt-4">
          {pyqs.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No previous year questions"
              description="PYQs for this subject will appear here once added."
            />
          ) : (
            <ul className="space-y-2">
              {pyqs.map((q) => (
                <li key={q.id} className="rounded-xl border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium">{q.question}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {q.marks} marks · asked {q.frequency}×
                    {q.years.length > 0 && ` · ${q.years.join(", ")}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}

type Topic = { id: string; title: string; priority: string; unit_id: string | null };

function groupByUnit(
  units: { id: string; number: number; title: string }[],
  topics: Topic[],
) {
  const groups = units.map((u) => ({
    id: u.id,
    label: `Unit ${u.number} · ${u.title}`,
    items: topics.filter((t) => t.unit_id === u.id),
  }));
  const orphans = topics.filter((t) => !t.unit_id || !units.some((u) => u.id === t.unit_id));
  if (orphans.length > 0) {
    groups.push({ id: "other", label: "Other topics", items: orphans });
  }
  return groups.filter((g) => g.items.length > 0);
}
