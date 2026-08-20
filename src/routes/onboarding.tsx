import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Library, Target, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to BtechBuddy" },
      {
        name: "description",
        content: "See how BtechBuddy turns scattered B.Tech resources into one focused exam plan.",
      },
      { property: "og:title", content: "Welcome to BtechBuddy" },
      {
        property: "og:description",
        content: "See how BtechBuddy turns scattered B.Tech resources into one focused exam plan.",
      },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  {
    icon: Sparkles,
    title: "Smart Exam Prep",
    body: "Study what actually matters. We rank topics by how often they appear in your exams.",
  },
  {
    icon: Library,
    title: "All in One Place",
    body: "Notes, previous year questions and mock tests — no more hunting across Telegram and YouTube.",
  },
  {
    icon: Target,
    title: "Know What to Study Today",
    body: "Tell us how many days are left. We build the day-by-day plan around it.",
  },
  {
    icon: Rocket,
    title: "Your Exam Buddy Awaits",
    body: "Track readiness per subject and walk into the exam hall knowing you're prepared.",
  },
];

function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = SLIDES[index]!;
  const Icon = slide.icon;
  const last = index === SLIDES.length - 1;

  function finish() {
    window.localStorage.setItem("btechbuddy_onboarded", "1");
    navigate({ to: "/signup" });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-8">
      <div className="flex justify-end">
        <button onClick={finish} className="text-sm font-medium text-muted-foreground">
          Skip
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-primary/10">
          <Icon className="size-11 text-primary" />
        </div>
        <h2 className="mt-8 font-heading text-2xl font-bold text-foreground">{slide.title}</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{slide.body}</p>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex justify-center gap-2">
          {SLIDES.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-primary" : "w-1.5 bg-border",
              )}
            />
          ))}
        </div>
        <Button
          size="lg"
          className="w-full rounded-xl"
          onClick={() => (last ? finish() : setIndex(index + 1))}
        >
          {last ? "Get Started" : "Next"}
        </Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Log In
          </Link>
        </p>
      </div>
    </main>
  );
}
