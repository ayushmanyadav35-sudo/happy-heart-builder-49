import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/GoogleButton";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Your Account — BtechBuddy" },
      {
        name: "description",
        content:
          "Create a free BtechBuddy account and get a personalised B.Tech exam preparation plan.",
      },
      { property: "og:title", content: "Create Your Account — BtechBuddy" },
      {
        property: "og:description",
        content:
          "Create a free BtechBuddy account and get a personalised B.Tech exam preparation plan.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Check your inbox to confirm your email, then log in.");
      navigate({ to: "/login" });
      return;
    }
    navigate({ to: "/setup-profile", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary">
          <GraduationCap className="size-7 text-primary-foreground" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold">Create Your Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start preparing smarter today.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ayushman Yadav"
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Creating account…" : "Sign Up"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onSignedIn={() => navigate({ to: "/setup-profile", replace: true })} />

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary">
          Log In
        </Link>
      </p>
    </main>
  );
}
