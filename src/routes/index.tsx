import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "BtechBuddy — Your Smart Exam Companion" },
      {
        name: "description",
        content:
          "Study what matters. AKTU notes, previous year questions, mock tests and day-by-day exam plans for B.Tech students.",
      },
      { property: "og:title", content: "BtechBuddy — Your Smart Exam Companion" },
      {
        property: "og:description",
        content:
          "Study what matters. AKTU notes, previous year questions, mock tests and day-by-day exam plans for B.Tech students.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate({ to: "/home", replace: true });
        return;
      }
      const seen = window.localStorage.getItem("btechbuddy_onboarded");
      navigate({ to: seen ? "/login" : "/onboarding", replace: true });
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-6 text-primary-foreground">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-primary-foreground/15 backdrop-blur">
        <GraduationCap className="size-10" />
      </div>
      <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight">BtechBuddy</h1>
      <p className="mt-1 text-sm text-primary-foreground/80">Your Smart Exam Companion</p>
      <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-primary-foreground/20">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary-foreground" />
      </div>
      <p className="absolute bottom-8 text-xs text-primary-foreground/60">v1.0.0</p>
    </main>
  );
}
