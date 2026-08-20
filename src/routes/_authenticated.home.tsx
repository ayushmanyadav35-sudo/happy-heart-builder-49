import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { BookOpen, CalendarClock, Flame, ClipboardList, RefreshCw } from "lucide-react";
import { AppPage, EmptyState } from "@/components/AppShell";
import { ProgressRing } from "@/components/ProgressRing";
import { useProfile } from "@/hooks/useAuth";
import { useAllTopics, useMySubjects, useTopicProgress, readiness } from "@/lib/queries";
import { daysUntil, greeting } from "@/lib/academics";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — BtechBuddy" },
      {
        name: "description",
        content: "Your exam countdown, readiness score and what to study today.",
      },
      { property: "og:title", content: "Dashboard — BtechBuddy" },
      {
        property: "og:description",
        content: "Your exam countdown, readiness score and what to study today.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subjects = [] } = useMySubjects();
  const { data: topics = [] } = useAllTopics();
  const { data: progress = [] } = useTopicProgress();

  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarded) {
      navigate({ to: "/setup-profile", replace: true });
    }
  }, [profile, profileLoading, navigate]);

  const mySubjectIds = useMemo(() => subjects.map((s) => s.subject_id), [subjects]);
  const myTopics = useMemo(
    () => topics.filter((t) => mySubjectIds.includes(t.subject_id)),
    [topics, mySubjectIds],
  );
  const overall = readiness(
    myTopics.map((t) => t.id),
    progress,
  );

  const nextExam = subjects.find((s) => s.exam_date && (daysUntil(s.exam_date) ?? -1) >= 0);
  const countdown = daysUntil(nextExam?.exam_date);

  const doneIds = new Set(progress.filter((p) => p.status === "completed").map((p) => p.topic_id));
  const focus = myTopics
    .filter((t) => !doneIds.has(t.id))
    .sort((a, b) => rank(a.priority) - rank(b.priority))
    .slice(0, 3);

  return (
    <AppPage>
      <header className="mb-5">
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {profile?.full_name || "Student"} 👋
        </h1>
        {profile?.branch && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {profile.branch} · Semester {profile.semester ?? "—"}
          </p>
        )}
      </header>

      <section className="rounded-2xl bg-primary px-5 py-5 text-primary-foreground">
        <div className="flex items-center gap-5">
          <div className="rounded-full bg-primary-foreground/10 p-1">
            <ProgressRing value={overall} size={88} label="ready" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-primary-foreground/70">
              Exam Readiness
            </p>
            <p className="mt-1 font-heading text-lg font-semibold">
              {countdown === null
                ? "No exam date set"
                : countdown === 0
                  ? "Exam is today!"
                  : `${countdown} days to go`}
            </p>
            <p className="truncate text-sm text-primary-foreground/80">
              {nextExam ? nextExam.subject.name : "Add subjects to start tracking"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <QuickAction to="/subjects" icon={BookOpen} label="Subjects" />
        <QuickAction to="/tests" icon={ClipboardList} label="Tests" />
        <QuickAction to="/revision" icon={RefreshCw} label="Revision" />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="size-4 text-accent" />
          <h2 className="font-heading text-base font-semibold">Study This Today</h2>
        </div>
        {focus.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Nothing queued yet"
            description="Add subjects to your semester and we'll build your daily focus list."
            action={
              <Button asChild className="rounded-xl">
                <Link to="/subjects">Browse subjects</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {focus.map((t) => (
              <li key={t.id}>
                <Link
                  to="/subjects/$subjectId"
                  params={{ subjectId: t.subject_id }}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium">{t.title}</span>
                  <span className="ml-3 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
                    {t.priority}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-heading text-base font-semibold">Your Subjects</h2>
        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects added"
            description="Pick the subjects you're studying this semester."
            action={
              <Button asChild className="rounded-xl">
                <Link to="/subjects">Add subjects</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {subjects.map((s) => {
              const ids = myTopics.filter((t) => t.subject_id === s.subject_id).map((t) => t.id);
              const score = readiness(ids, progress);
              const d = daysUntil(s.exam_date);
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
                        {s.subject.code}
                        {d !== null && ` · ${d >= 0 ? `${d} days left` : "past"}`}
                      </p>
                    </div>
                    <ProgressRing value={score} size={44} stroke={5} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppPage>
  );
}

function rank(priority: string) {
  return priority === "high" ? 0 : priority === "medium" ? 1 : 2;
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: "/subjects" | "/tests" | "/revision";
  icon: typeof BookOpen;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-xs font-medium"
    >
      <Icon className="size-5 text-primary" />
      {label}
    </Link>
  );
}
