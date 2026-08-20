import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleButton } from "@/components/GoogleButton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — BtechBuddy" },
      {
        name: "description",
        content: "Log in to BtechBuddy to continue your B.Tech exam preparation.",
      },
      { property: "og:title", content: "Log In — BtechBuddy" },
      {
        property: "og:description",
        content: "Log in to BtechBuddy to continue your B.Tech exam preparation.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/home", replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary">
          <GraduationCap className="size-7 text-primary-foreground" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold">Welcome Back!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick up right where you left off.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-card"
          />
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs font-medium text-primary">
              Forgot Password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Logging in…" : "Log In"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton onSignedIn={() => navigate({ to: "/home", replace: true })} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-primary">
          Sign Up
        </Link>
      </p>
    </main>
  );
}
