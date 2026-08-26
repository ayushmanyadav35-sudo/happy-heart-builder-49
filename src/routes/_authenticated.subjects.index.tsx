import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { BookOpen, Plus, Check, Compass } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppPage, EmptyState, PageHeader } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useAuthUser, useProfile } from "@/hooks/useAuth";
import { useAllTopics, useMySubjects, useTopicProgress, readiness } from "@/lib/queries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/subjects/")({
  head: () => ({
    meta: [
      { title: "My Subjects — BtechBuddy" },
      {
        name: "description",
        content: "Track readiness across every subject in your current semester.",
      },
      { property: "og:title", content: "My Subjects — BtechBuddy" },
      {
        property: "og:description",
        content: "Track readiness across every subject in your current semester.",
      },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { data: user } = useAuthUser();
  const { data: profile } = useProfile();
  const { data: mine = [] } = useMySubjects();
  const { data: topics = [] } = useAllTopics();
  const { data: progress = [] } = useTopicProgress();
  const queryClient = useQueryClient();

  const { data: available = [] } = useQuery({
    queryKey: ["available-subjects", profile?.branch, profile?.semester],
    enabled: Boolean(profile?.branch && profile?.semester),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code, branch, semester, icon")
        .eq("branch", profile!.branch!)
        .eq("semester", profile!.semester!)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addSubject = useMutation({
    mutationFn: async (subjectId: string) => {
      const { error } = await supabase
        .from("user_subjects")
        .insert({ user_id: user!.id, subject_id: subjectId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-subjects"] });
      toast.success("Subject added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mineIds = new Set(mine.map((s) => s.subject_id));
  const notAdded = available.filter((s) => !mineIds.has(s.id));

  return (
    <AppPage>
      <PageHeader title="My Subjects" subtitle="Semester syllabus and readiness" />

      <Button asChild variant="outline" className="mb-4 w-full rounded-xl">
        <Link to="/subjects/browse">
          <Compass className="size-4" /> Browse all branches &amp; semesters
        </Link>
      </Button>



      {mine.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add subjects from your semester list below to start tracking progress."
        />
      ) : (
        <ul className="space-y-2">
          {mine.map((s) => {
            const ids = topics.filter((t) => t.subject_id === s.subject_id).map((t) => t.id);
            return (
              <li key={s.id}>
                <Link
                  to="/subjects/$subjectId"
                  params={{ subjectId: s.subject_id }}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.subject.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.subject.code} · {ids.length} topics
                    </p>
                  </div>
                  <ProgressRing value={readiness(ids, progress)} size={44} stroke={5} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-base font-semibold">Add from your semester</h2>
        {!profile?.branch || !profile?.semester ? (
          <EmptyState
            icon={BookOpen}
            title="Complete your profile"
            description="Set your branch and semester so we can show the right subjects."
            action={
              <Button asChild className="rounded-xl">
                <Link to="/setup-profile">Set up profile</Link>
              </Button>
            }
          />
        ) : notAdded.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            All available subjects for {profile.branch} Sem {profile.semester} are added.
          </p>
        ) : (
          <ul className="space-y-2">
            {notAdded.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.code}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  disabled={addSubject.isPending}
                  onClick={() => addSubject.mutate(s.id)}
                >
                  {addSubject.isPending ? <Check className="size-4" /> : <Plus className="size-4" />}
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppPage>
  );
}
