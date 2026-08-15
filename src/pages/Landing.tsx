import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Clock,
  Cpu,
  Globe,
  PenLine,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Bot,
    title: "Your models, your data",
    body: "Chat with the LLM running on your own machine — LM Studio, Ollama, llama.cpp, vLLM, or any OpenAI-compatible endpoint. Nothing leaves your control.",
  },
  {
    icon: Globe,
    title: "Web research agent",
    body: "Ask a question and it searches the web, reads the sources, and returns a cited, summarized report you can actually trust.",
  },
  {
    icon: ShoppingCart,
    title: "Price comparison",
    body: "Drop in a product and get a clean comparison across retailers, with the best deal surfaced first.",
  },
  {
    icon: Ticket,
    title: "Coupon finder",
    body: "Hunt down promo codes and discounts for the store you're about to check out at.",
  },
  {
    icon: PenLine,
    title: "Post in your style",
    body: "Feed it your writing samples and it learns your voice — then drafts posts for X, LinkedIn, Facebook, Instagram, and Reddit.",
  },
  {
    icon: Briefcase,
    title: "Resume & job search",
    body: "Turn your raw experience into a polished resume, get an ATS-style review, and find live openings matched to your skills.",
  },
  {
    icon: Clock,
    title: "Background jobs",
    body: "Queue research, schedule posts, and let long tasks run in the background while you move on.",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect your local model",
    body: "Point the app at LM Studio, Ollama, or any local server. Pick a model and you're live in seconds.",
  },
  {
    n: "02",
    title: "Run a task",
    body: "Chat, research, compare prices, or draft a post. The assistant does the heavy lifting.",
  },
  {
    n: "03",
    title: "Review & publish",
    body: "Everything lands in a review step. Approve posts, save reports, and schedule what runs next.",
  },
];

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M6 18c0-6 4.5-9.5 10-9.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="19" cy="8.5" r="2.5" fill="currentColor" />
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-tight">LifeWithLLM</span>
    </span>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth?returnTo=/app">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/auth?returnTo=/app">
              <Button size="sm">
                Get started <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="grid-bg relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-20 text-center md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mx-auto gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              100% private — runs on your own models
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl"
          >
            Your private AI assistant,
            <span className="text-primary"> powered by you.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg"
          >
            Research the web, compare prices, find coupons, land your next job,
            and post in your own voice — all driven by the LLM on your MacBook.
            No cloud AI, no data leaving your machine.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/auth?returnTo=/app">
              <Button size="lg">
                Get started <ArrowRight />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">
                Explore features
              </Button>
            </a>
          </motion.div>

          {/* Terminal card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-xl border bg-card text-left shadow-2xl"
          >
            <div className="flex items-center gap-1.5 border-b px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                assistant — local model
              </span>
            </div>
            <div className="space-y-3 px-4 py-5 font-mono text-xs sm:text-sm">
              <p>
                <span className="text-primary">you</span>{" "}
                <span className="text-muted-foreground">→</span> find me the best
                deal on a standing desk
              </p>
              <p className="text-muted-foreground">
                <span className="text-primary">assistant</span>{" "}
                <span className="text-muted-foreground">→</span>{" "}
                <span className="animate-pulse-soft">▍searching 12 retailers…</span>
              </p>
              <p className="text-muted-foreground">
                <span className="text-primary">assistant</span>{" "}
                <span className="text-muted-foreground">→</span>{" "}
                <span className="text-foreground">
                  Best price: <span className="text-primary">$249</span> at
                  Costco — $80 below the next lowest. Full table ready.
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-background/50">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything a personal agent should do
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
            Built for the machine on your desk, not someone else's data center.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group rounded-xl border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Up and running in minutes
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="font-mono text-sm text-primary">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid-bg relative overflow-hidden rounded-2xl border p-10 text-center sm:p-16">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Put your own models to work
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Connect a local LLM and start researching, shopping, and posting —
              privately, on your terms.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/auth?returnTo=/app">
                <Button size="lg">
                  Get started <ArrowRight />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <div className="flex items-center gap-4">
            <Cpu className="h-4 w-4" />
            <span>Local-first · Private · Open</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
