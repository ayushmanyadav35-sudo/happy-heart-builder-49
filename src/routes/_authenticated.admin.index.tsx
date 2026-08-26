import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { withData } from "@/lib/server-fn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Layers,
  Plus,
  Upload,
  ClipboardList,
  Trash2,
  Users,
} from "lucide-react";
import {
  createSubject,
  createUnit,
  createTopic,
  createNote,
  createPyq,
  createTest,
  createTestQuestion,
  listSubjects,
  listUnits,
  listTopics,
  listTests,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { AppPage, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BRANCHES, UNIVERSITIES, NOTE_TYPES } from "@/lib/academics";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — BtechBuddy" },
      { name: "description", content: "Create and manage syllabus, notes, PYQs and tests." },
      { property: "og:title", content: "Admin Dashboard — BtechBuddy" },
      { property: "og:description", content: "Create and manage syllabus, notes, PYQs and tests." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <AppPage>
      <PageHeader title="Admin" subtitle="Manage content for BtechBuddy" />

      <Button asChild variant="outline" className="mb-4 w-full rounded-xl">
        <Link to="/admin/users">
          <Users className="size-4" /> Users &amp; roles
        </Link>
      </Button>



      <Tabs defaultValue="subjects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 rounded-xl">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="pyqs">PYQs</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <SubjectsTab />
        </TabsContent>
        <TabsContent value="units">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="notes">
          <NotesTab />
        </TabsContent>
        <TabsContent value="pyqs">
          <PyqsTab />
        </TabsContent>
        <TabsContent value="tests">
          <TestsTab />
        </TabsContent>
      </Tabs>
    </AppPage>
  );
}

function SubjectsTab() {
  const queryClient = useQueryClient();
  const getSubjects = useServerFn(listSubjects);
  const createSubjectFn = useServerFn(createSubject);
  const { data: subjects = [] } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () => getSubjects(),
  });

  const [form, setForm] = useState({
    code: "",
    name: "",
    university: UNIVERSITIES[0]!,
    branch: "",
    semester: "",
  });

  const mutation = useMutation({
    mutationFn: withData(createSubjectFn),
    onSuccess: () => {
      toast.success("Subject created");
      setForm({ code: "", name: "", university: UNIVERSITIES[0]!, branch: "", semester: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-heading text-base font-semibold">Create Subject</h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              code: form.code,
              name: form.name,
              university: form.university,
              branch: form.branch,
              semester: Number(form.semester),
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="KCS101"
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Semester</Label>
              <Input
                value={form.semester}
                onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                placeholder="1"
                type="number"
                className="rounded-xl"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Subject name"
              className="rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>University</Label>
              <Select
                value={form.university}
                onValueChange={(v) => setForm((f) => ({ ...f, university: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIVERSITIES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Branch</Label>
              <Select value={form.branch} onValueChange={(v) => setForm((f) => ({ ...f, branch: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b.code} value={b.code}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="rounded-xl" disabled={mutation.isPending}>
            <Plus className="mr-2 size-4" />
            Create Subject
          </Button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-base font-semibold">Existing Subjects</h2>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subjects yet.</p>
        ) : (
          <ul className="space-y-2">
            {subjects.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {s.name} <span className="text-muted-foreground">({s.code})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.university} · {s.branch} · Sem {s.semester}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function UnitsTab() {
  const queryClient = useQueryClient();
  const getSubjects = useServerFn(listSubjects);
  const getUnits = useServerFn(listUnits);
  const getTopics = useServerFn(listTopics);
  const createUnitFn = useServerFn(createUnit);
  const createTopicFn = useServerFn(createTopic);

  const [subjectId, setSubjectId] = useState("");
  const [unitForm, setUnitForm] = useState({ number: "", title: "" });
  const [topicForm, setTopicForm] = useState({ title: "", priority: "medium", unitId: "" });

  const { data: subjects = [] } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () => getSubjects(),
  });
  const { data: units = [] } = useQuery({
    queryKey: ["admin-units", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getUnits({ data: { subject_id: subjectId } }),
  });
  const { data: topics = [] } = useQuery({
    queryKey: ["admin-topics", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getTopics({ data: { subject_id: subjectId } }),
  });

  const unitMutation = useMutation({
    mutationFn: withData(createUnitFn),
    onSuccess: () => {
      toast.success("Unit created");
      setUnitForm({ number: "", title: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-units", subjectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const topicMutation = useMutation({
    mutationFn: withData(createTopicFn),
    onSuccess: () => {
      toast.success("Topic created");
      setTopicForm({ title: "", priority: "medium", unitId: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-topics", subjectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Subject</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold">
          <Layers className="size-4" /> Create Unit
        </h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subjectId) return;
            unitMutation.mutate({
              subject_id: subjectId,
              number: Number(unitForm.number),
              title: unitForm.title,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Unit number"
              type="number"
              value={unitForm.number}
              onChange={(e) => setUnitForm((f) => ({ ...f, number: e.target.value }))}
              className="rounded-xl"
              required
            />
            <Input
              placeholder="Unit title"
              value={unitForm.title}
              onChange={(e) => setUnitForm((f) => ({ ...f, title: e.target.value }))}
              className="rounded-xl"
              required
            />
          </div>
          <Button type="submit" className="rounded-xl" disabled={!subjectId || unitMutation.isPending}>
            <Plus className="mr-2 size-4" />
            Add Unit
          </Button>
        </form>

        {units.length > 0 && (
          <ul className="mt-4 space-y-2">
            {units.map((u) => (
              <li key={u.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                Unit {u.number}: {u.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold">
          <BookOpen className="size-4" /> Create Topic
        </h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subjectId) return;
            topicMutation.mutate({
              subject_id: subjectId,
              unit_id: topicForm.unitId || undefined,
              title: topicForm.title,
              priority: topicForm.priority,
            });
          }}
        >
          <div className="space-y-1">
            <Label>Unit (optional)</Label>
            <Select
              value={topicForm.unitId}
              onValueChange={(v) => setTopicForm((f) => ({ ...f, unitId: v }))}
              disabled={units.length === 0}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    Unit {u.number}: {u.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Topic title"
            value={topicForm.title}
            onChange={(e) => setTopicForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-xl"
            required
          />
          <Select
            value={topicForm.priority}
            onValueChange={(v) => setTopicForm((f) => ({ ...f, priority: v }))}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            className="rounded-xl"
            disabled={!subjectId || topicMutation.isPending}
          >
            <Plus className="mr-2 size-4" />
            Add Topic
          </Button>
        </form>

        {topics.length > 0 && (
          <ul className="mt-4 space-y-2">
            {topics.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
              >
                <span>{t.title}</span>
                <span className="text-xs capitalize text-muted-foreground">{t.priority}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NotesTab() {
  const queryClient = useQueryClient();
  const getSubjects = useServerFn(listSubjects);
  const getUnits = useServerFn(listUnits);
  const getTopics = useServerFn(listTopics);
  const createNoteFn = useServerFn(createNote);

  const [subjectId, setSubjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [noteType, setNoteType] = useState("short_notes");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: subjects = [] } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () => getSubjects(),
  });
  const { data: units = [] } = useQuery({
    queryKey: ["admin-units", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getUnits({ data: { subject_id: subjectId } }),
  });
  const { data: topics = [] } = useQuery({
    queryKey: ["admin-topics", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getTopics({ data: { subject_id: subjectId } }),
  });

  const mutation = useMutation({
    mutationFn: withData(createNoteFn),
    onSuccess: () => {
      toast.success("Note created");
      setTitle("");
      setFile(null);
      setUnitId("");
      setTopicId("");
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !title) return;

    let fileUrl: string | undefined;
    if (file) {
      setUploading(true);
      const path = `${subjectId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("notes-pdfs").upload(path, file, {
        contentType: file.type,
      });
      setUploading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = supabase.storage.from("notes-pdfs").getPublicUrl(path);
      fileUrl = data.publicUrl;
    }

    mutation.mutate({
      subject_id: subjectId,
      unit_id: unitId || undefined,
      topic_id: topicId || undefined,
      title,
      note_type: noteType,
      file_url: fileUrl,
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold">
        <FileText className="size-4" /> Upload Note
      </h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Unit (optional)</Label>
            <Select value={unitId} onValueChange={setUnitId} disabled={!subjectId || units.length === 0}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    Unit {u.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Topic (optional)</Label>
            <Select
              value={topicId}
              onValueChange={setTopicId}
              disabled={!subjectId || topics.length === 0}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Note Type</Label>
          <Select value={noteType} onValueChange={setNoteType}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NOTE_TYPES.map((n) => (
                <SelectItem key={n.value} value={n.value}>
                  {n.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl"
          required
        />

        <div className="space-y-1">
          <Label>PDF File</Label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-xl"
          />
        </div>

        <Button
          type="submit"
          className="rounded-xl"
          disabled={!subjectId || !title || mutation.isPending || uploading}
        >
          <Upload className="mr-2 size-4" />
          {uploading ? "Uploading…" : mutation.isPending ? "Saving…" : "Upload Note"}
        </Button>
      </form>
    </div>
  );
}

function PyqsTab() {
  const queryClient = useQueryClient();
  const getSubjects = useServerFn(listSubjects);
  const getUnits = useServerFn(listUnits);
  const getTopics = useServerFn(listTopics);
  const createPyqFn = useServerFn(createPyq);

  const [subjectId, setSubjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [question, setQuestion] = useState("");
  const [marks, setMarks] = useState("10");
  const [years, setYears] = useState("");

  const { data: subjects = [] } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () => getSubjects(),
  });
  const { data: units = [] } = useQuery({
    queryKey: ["admin-units", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getUnits({ data: { subject_id: subjectId } }),
  });
  const { data: topics = [] } = useQuery({
    queryKey: ["admin-topics", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getTopics({ data: { subject_id: subjectId } }),
  });

  const mutation = useMutation({
    mutationFn: withData(createPyqFn),
    onSuccess: () => {
      toast.success("PYQ added");
      setQuestion("");
      setMarks("10");
      setYears("");
      queryClient.invalidateQueries({ queryKey: ["pyqs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold">
        <HelpCircle className="size-4" /> Add PYQ
      </h2>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!subjectId || !question) return;
          mutation.mutate({
            subject_id: subjectId,
            unit_id: unitId || undefined,
            topic_id: topicId || undefined,
            question,
            marks: Number(marks),
            years: years
              .split(",")
              .map((y) => Number(y.trim()))
              .filter(Boolean),
          });
        }}
      >
        <div className="space-y-1">
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select value={unitId} onValueChange={setUnitId} disabled={!subjectId || units.length === 0}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  Unit {u.number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={topicId}
            onValueChange={setTopicId}
            disabled={!subjectId || topics.length === 0}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          placeholder="Question text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-xl"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Marks"
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="rounded-xl"
          />
          <Input
            placeholder="Years (comma separated, e.g. 2022,2023)"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <Button type="submit" className="rounded-xl" disabled={!subjectId || !question || mutation.isPending}>
          <Plus className="mr-2 size-4" />
          Add PYQ
        </Button>
      </form>
    </div>
  );
}

function TestsTab() {
  const queryClient = useQueryClient();
  const getSubjects = useServerFn(listSubjects);
  const getUnits = useServerFn(listUnits);
  const getTopics = useServerFn(listTopics);
  const getTests = useServerFn(listTests);
  const createTestFn = useServerFn(createTest);
  const createQuestionFn = useServerFn(createTestQuestion);

  const [subjectId, setSubjectId] = useState("");
  const [testId, setTestId] = useState("");
  const [testForm, setTestForm] = useState({
    title: "",
    duration: "15",
    difficulty: "medium",
  });
  const [question, setQuestion] = useState({
    text: "",
    options: ["", ""],
    correctIndex: 0,
    explanation: "",
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () => getSubjects(),
  });
  const { data: units = [] } = useQuery({
    queryKey: ["admin-units", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getUnits({ data: { subject_id: subjectId } }),
  });
  const { data: topics = [] } = useQuery({
    queryKey: ["admin-topics", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getTopics({ data: { subject_id: subjectId } }),
  });
  const { data: tests = [] } = useQuery({
    queryKey: ["admin-tests", subjectId],
    enabled: Boolean(subjectId),
    queryFn: () => getTests({ data: { subject_id: subjectId } }),
  });

  const testMutation = useMutation({
    mutationFn: withData(createTestFn),
    onSuccess: () => {
      toast.success("Test created");
      setTestForm({ title: "", duration: "15", difficulty: "medium" });
      queryClient.invalidateQueries({ queryKey: ["admin-tests", subjectId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const questionMutation = useMutation({
    mutationFn: withData(createQuestionFn),
    onSuccess: () => {
      toast.success("Question added");
      setQuestion({ text: "", options: ["", ""], correctIndex: 0, explanation: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Subject</Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold">
          <ClipboardList className="size-4" /> Create Test
        </h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!subjectId) return;
            testMutation.mutate({
              subject_id: subjectId,
              title: testForm.title,
              duration_minutes: Number(testForm.duration),
              difficulty: testForm.difficulty,
            });
          }}
        >
          <Input
            placeholder="Test title"
            value={testForm.title}
            onChange={(e) => setTestForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-xl"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Duration (min)"
              type="number"
              value={testForm.duration}
              onChange={(e) => setTestForm((f) => ({ ...f, duration: e.target.value }))}
              className="rounded-xl"
              required
            />
            <Select
              value={testForm.difficulty}
              onValueChange={(v) => setTestForm((f) => ({ ...f, difficulty: v }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="rounded-xl"
            disabled={!subjectId || testMutation.isPending}
          >
            <Plus className="mr-2 size-4" />
            Create Test
          </Button>
        </form>

        {tests.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label>Select Test to Add Questions</Label>
            <Select value={testId} onValueChange={setTestId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                {tests.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-heading text-base font-semibold">Add Question</h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!testId || !question.text) return;
            questionMutation.mutate({
              test_id: testId,
              question: question.text,
              options: question.options.filter(Boolean),
              correct_index: question.correctIndex,
              explanation: question.explanation || undefined,
            });
          }}
        >
          <Textarea
            placeholder="Question"
            value={question.text}
            onChange={(e) => setQuestion((q) => ({ ...q, text: e.target.value }))}
            className="rounded-xl"
            required
          />

          <div className="space-y-2">
            {question.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Checkbox
                  checked={question.correctIndex === i}
                  onCheckedChange={() => setQuestion((q) => ({ ...q, correctIndex: i }))}
                />
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) =>
                    setQuestion((q) => ({
                      ...q,
                      options: q.options.map((o, j) => (j === i ? e.target.value : o)),
                    }))
                  }
                  className="rounded-xl"
                  required
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => setQuestion((q) => ({ ...q, options: [...q.options, ""] }))}
            >
              <Plus className="mr-1 size-4" /> Add Option
            </Button>
          </div>

          <Textarea
            placeholder="Explanation (optional)"
            value={question.explanation}
            onChange={(e) => setQuestion((q) => ({ ...q, explanation: e.target.value }))}
            className="rounded-xl"
          />

          <Button type="submit" className="rounded-xl" disabled={!testId || questionMutation.isPending}>
            <Plus className="mr-2 size-4" />
            Add Question
          </Button>
        </form>
      </section>
    </div>
  );
}
