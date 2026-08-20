import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppPage, EmptyState, PageHeader } from "@/components/AppShell";
import { useAuthUser } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tests/$testId")({
  head: () => ({
    meta: [
      { title: "Take Test — BtechBuddy" },
      { name: "description", content: "Attempt a timed mock test and see your score instantly." },
      { property: "og:title", content: "Take Test — BtechBuddy" },
      {
        property: "og:description",
        content: "Attempt a timed mock test and see your score instantly.",
      },
    ],
  }),
  component: TestRunner,
});

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
};

function TestRunner() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("id, title, duration_minutes, difficulty")
        .eq("id", testId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["test-questions", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_questions")
        .select("id, question, options, correct_index, explanation")
        .eq("test_id", testId)
        .order("position");
      if (error) throw error;
      return (data ?? []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as string[]) : [],
      })) as Question[];
    },
  });

  const score = questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.correct_index ? 1 : 0),
    0,
  );

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("test_results").insert({
        user_id: user!.id,
        test_id: testId,
        score,
        total: questions.length,
        answers,
      });
      if (error) throw error;
    },
    onSuccess: () => setSubmitted(true),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppPage>
      <PageHeader
        title={test?.title ?? "Test"}
        subtitle={
          submitted
            ? `Scored ${score}/${questions.length}`
            : `${questions.length} questions · ${test?.duration_minutes ?? 0} min`
        }
        back="/tests"
      />

      {questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No questions yet"
          description="This test doesn't have any questions added yet."
        />
      ) : (
        <>
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li key={q.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium">
                  {i + 1}. {q.question}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oi) => {
                    const chosen = answers[q.id] === oi;
                    const correct = submitted && oi === q.correct_index;
                    const wrong = submitted && chosen && oi !== q.correct_index;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={submitted}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          correct
                            ? "border-success bg-success/10"
                            : wrong
                              ? "border-destructive bg-destructive/10"
                              : chosen
                                ? "border-primary bg-primary/5"
                                : "border-border",
                        )}
                      >
                        {correct && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                        {wrong && <XCircle className="size-4 shrink-0 text-destructive" />}
                        <span className="min-w-0">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {q.explanation}
                  </p>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-6">
            {submitted ? (
              <Button
                className="w-full rounded-xl"
                size="lg"
                onClick={() => navigate({ to: "/tests" })}
              >
                Back to Tests
              </Button>
            ) : (
              <Button
                className="w-full rounded-xl"
                size="lg"
                disabled={submit.isPending || Object.keys(answers).length !== questions.length}
                onClick={() => submit.mutate()}
              >
                {submit.isPending ? "Submitting…" : "Submit Test"}
              </Button>
            )}
          </div>
        </>
      )}
    </AppPage>
  );
}
