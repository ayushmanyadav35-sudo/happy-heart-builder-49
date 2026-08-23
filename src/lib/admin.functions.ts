import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function requireAdmin(context: {
  supabase: { rpc: (...args: unknown[]) => Promise<{ data: boolean | null; error: Error | null }> };
  userId: string;
}) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!isAdmin) throw new Error("Forbidden: admin only");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    return { admin: true };
  });

export const createSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      code: string;
      name: string;
      university: string;
      branch: string;
      semester: number;
      icon?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("subjects").insert({
      code: data.code,
      name: data.name,
      university: data.university,
      branch: data.branch,
      semester: data.semester,
      icon: data.icon,
    });
    if (error) throw error;
    return { ok: true };
  });

export const createUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { subject_id: string; number: number; title: string }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("units").insert({
      subject_id: data.subject_id,
      number: data.number,
      title: data.title,
    });
    if (error) throw error;
    return { ok: true };
  });

export const createTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      subject_id: string;
      unit_id?: string;
      title: string;
      priority?: string;
      exam_categories?: string[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("topics").insert({
      subject_id: data.subject_id,
      unit_id: data.unit_id ?? null,
      title: data.title,
      priority: data.priority ?? "medium",
      exam_categories: data.exam_categories ?? [],
    });
    if (error) throw error;
    return { ok: true };
  });

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      subject_id: string;
      unit_id?: string;
      topic_id?: string;
      title: string;
      note_type: string;
      file_url?: string;
      is_premium?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("notes").insert({
      subject_id: data.subject_id,
      unit_id: data.unit_id ?? null,
      topic_id: data.topic_id ?? null,
      title: data.title,
      note_type: data.note_type,
      file_url: data.file_url ?? null,
      is_premium: data.is_premium ?? false,
    });
    if (error) throw error;
    return { ok: true };
  });

export const createPyq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      subject_id: string;
      unit_id?: string;
      topic_id?: string;
      question: string;
      marks?: number;
      exam_type?: string;
      question_type?: string;
      years?: number[];
      frequency?: number;
      model_answer?: string;
      is_premium?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("pyqs").insert({
      subject_id: data.subject_id,
      unit_id: data.unit_id ?? null,
      topic_id: data.topic_id ?? null,
      question: data.question,
      marks: data.marks ?? 10,
      exam_type: data.exam_type ?? "End Sem",
      question_type: data.question_type ?? "long",
      years: data.years ?? [],
      frequency: data.frequency ?? 1,
      model_answer: data.model_answer ?? null,
      is_premium: data.is_premium ?? false,
    });
    if (error) throw error;
    return { ok: true };
  });

export const createTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      subject_id: string;
      unit_id?: string;
      topic_id?: string;
      title: string;
      test_type?: string;
      duration_minutes?: number;
      difficulty?: string;
      is_premium?: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("tests").insert({
      subject_id: data.subject_id,
      unit_id: data.unit_id ?? null,
      topic_id: data.topic_id ?? null,
      title: data.title,
      test_type: data.test_type ?? "mcq",
      duration_minutes: data.duration_minutes ?? 15,
      difficulty: data.difficulty ?? "medium",
      is_premium: data.is_premium ?? false,
    });
    if (error) throw error;
    return { ok: true };
  });

export const createTestQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      test_id: string;
      topic_id?: string;
      question: string;
      options: string[];
      correct_index: number;
      explanation?: string;
      position?: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("test_questions").insert({
      test_id: data.test_id,
      topic_id: data.topic_id ?? null,
      question: data.question,
      options: data.options,
      correct_index: data.correct_index,
      explanation: data.explanation ?? null,
      position: data.position ?? 1,
    });
    if (error) throw error;
    return { ok: true };
  });

export const listSubjects = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );
    const { data, error } = await supabasePublic
      .from("subjects")
      .select("id, code, name, university, branch, semester")
      .order("name");
    if (error) throw error;
    return (data ?? []) as {
      id: string;
      code: string;
      name: string;
      university: string;
      branch: string;
      semester: number;
    }[];
  });

export const listUnits = createServerFn({ method: "GET" })
  .inputValidator((input: { subject_id: string }) => input)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );
    const { data: rows, error } = await supabasePublic
      .from("units")
      .select("id, number, title, subject_id")
      .eq("subject_id", data.subject_id)
      .order("number");
    if (error) throw error;
    return (rows ?? []) as {
      id: string;
      number: number;
      title: string;
      subject_id: string;
    }[];
  });

export const listTopics = createServerFn({ method: "GET" })
  .inputValidator((input: { subject_id: string }) => input)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );
    const { data: rows, error } = await supabasePublic
      .from("topics")
      .select("id, title, priority, unit_id, subject_id")
      .eq("subject_id", data.subject_id)
      .order("title");
    if (error) throw error;
    return (rows ?? []) as {
      id: string;
      title: string;
      priority: string;
      unit_id: string | null;
      subject_id: string;
    }[];
  });

export const listTests = createServerFn({ method: "GET" })
  .inputValidator((input: { subject_id: string }) => input)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabasePublic = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { persistSession: false } },
    );
    const { data: rows, error } = await supabasePublic
      .from("tests")
      .select("id, title, test_type, duration_minutes, difficulty, subject_id")
      .eq("subject_id", data.subject_id)
      .order("title");
    if (error) throw error;
    return (rows ?? []) as {
      id: string;
      title: string;
      test_type: string;
      duration_minutes: number;
      difficulty: string;
      subject_id: string;
    }[];
  });
