import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useProfile } from "@/hooks/useAuth";
import { BRANCHES, UNIVERSITIES, YEARS, semestersForYear } from "@/lib/academics";
import { AppPage } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/setup-profile")({
  head: () => ({
    meta: [
      { title: "Set Up Your Profile — BtechBuddy" },
      {
        name: "description",
        content: "Tell BtechBuddy your university, branch and semester to personalise your syllabus.",
      },
      { property: "og:title", content: "Set Up Your Profile — BtechBuddy" },
      {
        property: "og:description",
        content: "Tell BtechBuddy your university, branch and semester to personalise your syllabus.",
      },
    ],
  }),
  component: SetupProfile,
});

function SetupProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useAuthUser();
  const { data: profile } = useProfile();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [university, setUniversity] = useState(profile?.university ?? UNIVERSITIES[0]!);
  const [branch, setBranch] = useState(profile?.branch ?? "");
  const [year, setYear] = useState<string>(profile?.year ? String(profile.year) : "");
  const [semester, setSemester] = useState<string>(
    profile?.semester ? String(profile.semester) : "",
  );
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!branch || !year || !semester) {
      toast.error("Please complete all fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || "Student",
        university,
        branch,
        year: Number(year),
        semester: Number(semester),
        onboarded: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved");
    navigate({ to: "/home", replace: true });
  }

  return (
    <AppPage withNav={false}>
      <div className="mx-auto max-w-md py-6">
        <h1 className="font-heading text-2xl font-bold">Set Up Your Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We use this to show the right syllabus, notes and papers.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="h-12 rounded-xl bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <Label>University</Label>
            <Select value={university} onValueChange={setUniversity}>
              <SelectTrigger className="h-12 rounded-xl bg-card">
                <SelectValue placeholder="Select university" />
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

          <div className="space-y-1.5">
            <Label>Branch</Label>
            <Select value={branch} onValueChange={setBranch}>
              <SelectTrigger className="h-12 rounded-xl bg-card">
                <SelectValue placeholder="Select branch" />
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Select
                value={year}
                onValueChange={(v) => {
                  setYear(v);
                  setSemester("");
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-card">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Year {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester} disabled={!year}>
                <SelectTrigger className="h-12 rounded-xl bg-card">
                  <SelectValue placeholder="Sem" />
                </SelectTrigger>
                <SelectContent>
                  {(year ? semestersForYear(Number(year)) : []).map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full rounded-xl" disabled={saving}>
            {saving ? "Saving…" : "Continue"}
          </Button>
        </form>
      </div>
    </AppPage>
  );
}
