import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  PenLine,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  {
    to: "/app/chat",
    icon: Bot,
    eyebrow: "Private chat",
    title: "Ask your local model",
    body: "Think through an idea, draft an answer, or turn a rough thought into a plan.",
  },
  {
    to: "/app/research",
    icon: Globe2,
    eyebrow: "Research agent",
    title: "Investigate a question",
    body: "Search the web and turn fresh sources into a cited report.",
  },
  {
    to: "/app/shopping",
    icon: ShoppingCart,
    eyebrow: "Shopping scout",
    title: "Find the best deal",
    body: "Compare retailers or hunt for a coupon before you buy.",
  },
  {
    to: "/app/social",
    icon: PenLine,
    eyebrow: "Your voice",
    title: "Draft a social post",
    body: "Create a post that sounds like you, then review and schedule it.",
  },
  {
    to: "/app/career",
    icon: Briefcase,
    eyebrow: "Career tools",
    title: "Resume & job search",
    body: "Generate a polished resume, get an ATS review, and find live openings.",
  },
];

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export default function OverviewPage() {
  const settings = useQuery(api.settings.getSettings);
  const jobs = useQuery(api.jobs.listJobs) ?? [];
  const reports = useQuery(api.reports.listReports) ?? [];
  const posts = useQuery(api.social.listPosts) ?? [];

  const completedJobs = jobs.filter((job) => job.status === "done").length;
  const scheduledPosts = posts.filter((post) => post.status === "scheduled").length;
  const modelReady = Boolean(settings?.model);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <Badge variant={modelReady ? "success" : "warning"} className="gap-1.5">
              {modelReady ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Settings2 className="h-3 w-3" />
              )}
              {modelReady ? "Local model connected" : "Connect a local model"}
            </Badge>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Your private command center.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              One place to think, research, shop, and publish — with your own
              model doing the reasoning on your machine.
            </p>
          </div>
          <Link to={modelReady ? "/app/chat" : "/app/settings"}>
            <Button>
              {modelReady ? "Start a conversation" : "Set up your model"}
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Completed jobs", value: completedJobs, icon: CheckCircle2 },
          { label: "Saved reports", value: reports.length, icon: FileText },
          { label: "Scheduled posts", value: scheduledPosts, icon: Clock3 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Start here
            </p>
            <h2 className="mt-1 text-xl font-semibold">What do you want to do?</h2>
          </div>
          <Sparkles className="hidden h-5 w-5 text-primary sm:block" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-primary/[0.03]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-4 w-4" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {action.eyebrow}
              </p>
              <h3 className="mt-1 font-semibold">{action.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {action.body}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your latest work across the assistant.
            </p>
          </div>
          <Link to="/app/jobs">
            <Button variant="ghost" size="sm">
              View activity <ArrowRight />
            </Button>
          </Link>
        </div>
        {jobs.length === 0 ? (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-sm text-muted-foreground">
            <Search className="h-4 w-4 text-primary" />
            Your research runs and background tasks will appear here.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {jobs.slice(0, 4).map((job) => (
              <div key={job._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    job.status === "done"
                      ? "bg-emerald-400"
                      : job.status === "error"
                        ? "bg-red-400"
                        : "bg-amber-400"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.type} · {formatDate(job.createdAt)}
                  </p>
                </div>
                <Badge
                  variant={
                    job.status === "done"
                      ? "success"
                      : job.status === "error"
                        ? "danger"
                        : "warning"
                  }
                >
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
