import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuth";

export type MySubject = {
  id: string;
  subject_id: string;
  exam_date: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
    branch: string;
    semester: number;
    icon: string | null;
  };
};

export function useMySubjects() {
  const { data: user } = useAuthUser();
  return useQuery({
    queryKey: ["my-subjects", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_subjects")
        .select("id, subject_id, exam_date, subject:subjects(id, name, code, branch, semester, icon)")
        .order("exam_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as MySubject[];
    },
  });
}

export function useTopicProgress() {
  const { data: user } = useAuthUser();
  return useQuery({
    queryKey: ["topic-progress", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topic_progress")
        .select("topic_id, status, updated_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubjectTopics(subjectId?: string) {
  return useQuery({
    queryKey: ["topics", subjectId],
    enabled: Boolean(subjectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, title, priority, unit_id, subject_id, exam_categories")
        .eq("subject_id", subjectId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllTopics() {
  return useQuery({
    queryKey: ["all-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, title, priority, subject_id, unit_id, exam_categories");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** completed = 1, in_progress = 0.5 */
export function readiness(
  topicIds: string[],
  progress: { topic_id: string; status: string }[],
) {
  if (topicIds.length === 0) return 0;
  const map = new Map(progress.map((p) => [p.topic_id, p.status]));
  let score = 0;
  for (const id of topicIds) {
    const s = map.get(id);
    if (s === "completed") score += 1;
    else if (s === "in_progress") score += 0.5;
  }
  return Math.round((score / topicIds.length) * 100);
}
