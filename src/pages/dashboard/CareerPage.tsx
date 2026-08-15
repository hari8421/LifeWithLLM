import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  ClipboardCheck,
  FileText,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { chatCompletion } from "@/lib/llm";
import { useLLMSettings } from "@/hooks/useLLMSettings";
import { useRunJob } from "@/hooks/useRunJob";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Markdown } from "@/components/Markdown";
import { cn, timeAgo } from "@/lib/utils";

type Tab = "builder" | "review" | "search";
type Source = { title: string; url: string };

const tabs = [
  { id: "builder", label: "Resume builder", icon: FileText },
  { id: "review", label: "Resume review", icon: ClipboardCheck },
  { id: "search", label: "Job search", icon: Search },
] as const;

function buildResumePrompt(details: string, targetRole: string) {
  return (
    `You are an expert resume writer. Turn the candidate's raw details into a ` +
    `polished, professional resume in clean markdown.\n\n` +
    (targetRole ? `Target role: ${targetRole}\n\n` : "") +
    `Candidate details:\n${details}\n\n` +
    `Use this exact structure:\n` +
    `- A single header line with name and contact details (city, email, phone, links).\n` +
    `- "Summary": 2-3 sentences.\n` +
    `- "Experience": for each role, a heading with title, company and dates, followed by 3-5 bullets starting with strong action verbs and numbers where possible.\n` +
    `- "Skills": grouped and comma-separated.\n` +
    `- "Education": degree, school, year.\n\n` +
    `Use only information actually provided. Never invent employers, dates, titles, or degrees. ` +
    `Where a detail is missing, write "[add ...]" in that spot. Return only the markdown resume.`
  );
}

function reviewResumePrompt(resume: string, jobDescription: string) {
  return (
    `You are a senior recruiter and ATS (applicant tracking system) expert.\n\n` +
    `Resume:\n${resume}\n\n` +
    (jobDescription ? `Target job description:\n${jobDescription}\n\n` : "") +
    `Write a markdown review with these sections:\n` +
    `1. A line reading "Score: X/100" with one sentence of context.\n` +
    `2. "What's strong" — bullet list.\n` +
    `3. "What to fix" — bullet list with specific, actionable advice.\n` +
    `4. "Keywords to add" — ` +
    (jobDescription
      ? `exact words from the job description that are missing from the resume.`
      : `common resume keywords this profile should include.`) +
    `\n5. "Rewrite suggestions" — 2-3 rewritten bullets the candidate can paste straight in.\n\n` +
    `Be direct and concrete. Never invent facts about the candidate.`
  );
}

function summarizeJobsPrompt(query: string, location: string, texts: string[]) {
  const body = texts
    .map((t, i) => `[${i + 1}] ${t.slice(0, 2200)}`)
    .join("\n\n---\n\n");
  return (
    `Job search: ${query}${location ? ` in ${location}` : ""}\n\n` +
    `Live job listing excerpts gathered from the web:\n${body}\n\n` +
    `Compile a markdown report of the best matching openings. For each role include:\n` +
    `- A heading like "### Title — Company"\n` +
    `- Location and a one-line summary\n` +
    `- Salary if mentioned, otherwise "salary not listed"\n` +
    `- An apply link formatted as a markdown link: [Apply](url)\n\n` +
    `Skip duplicates and clearly irrelevant results. If an excerpt is not a real job listing, leave it out. ` +
    `End with a short "How to stand out" paragraph for this role. Keep it scannable.`
  );
}

export default function CareerPage() {
  const settings = useLLMSettings();
  const runJob = useRunJob();
  const exaSearch = useAction(api.research.exaSearch);

  const saveResume = useMutation(api.career.saveResume);
  const deleteResume = useMutation(api.career.deleteResume);
  const resumes = useQuery(api.career.listResumes) ?? [];

  const saveJobSearch = useMutation(api.career.saveJobSearch);
  const deleteJobSearch = useMutation(api.career.deleteJobSearch);
  const searches = useQuery(api.career.listJobSearches) ?? [];

  const [tab, setTab] = useState<Tab>("builder");

  const [details, setDetails] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [resumeTitle, setResumeTitle] = useState("");
  const [resume, setResume] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<Id<"resumes"> | null>(null);
  const [building, setBuilding] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [jobQuery, setJobQuery] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [searchResult, setSearchResult] = useState<{
    content: string;
    sources: Source[];
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const llm = settings?.model
    ? {
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
      }
    : null;

  async function generateResume() {
    const text = details.trim();
    if (!text || building) return;
    if (!llm) {
      setBuilderError("Connect your local LLM in Settings first.");
      return;
    }
    setBuilderError(null);
    setBuilding(true);
    try {
      const content = await runJob("resume", "Generate resume", () =>
        chatCompletion(
          llm,
          [
            {
              role: "user",
              content: buildResumePrompt(text, targetRole.trim()),
            },
          ],
          { temperature: 0.5 }
        )
      );
      setResume(content);
      setEditingId(null);
      if (!resumeTitle.trim()) {
        setResumeTitle(
          targetRole.trim() ? `${targetRole.trim()} resume` : "My resume"
        );
      }
    } catch (e) {
      setBuilderError(
        e instanceof Error ? e.message : "Failed to generate resume."
      );
    } finally {
      setBuilding(false);
    }
  }

  async function handleSaveResume() {
    if (!resume) return;
    const title = resumeTitle.trim() || "Untitled resume";
    const id = await saveResume({
      id: editingId ?? undefined,
      title,
      content: resume,
    });
    setEditingId(id);
    setResumeTitle(title);
  }

  async function runReview() {
    const text = resumeText.trim();
    if (!text || reviewing) return;
    if (!llm) {
      setReviewError("Connect your local LLM in Settings first.");
      return;
    }
    setReviewError(null);
    setReview(null);
    setReviewing(true);
    try {
      const content = await runJob("review", "Review resume", () =>
        chatCompletion(
          llm,
          [
            {
              role: "user",
              content: reviewResumePrompt(text, jobDescription.trim()),
            },
          ],
          { temperature: 0.3 }
        )
      );
      setReview(content);
    } catch (e) {
      setReviewError(
        e instanceof Error ? e.message : "Failed to review resume."
      );
    } finally {
      setReviewing(false);
    }
  }

  async function runSearch() {
    const q = jobQuery.trim();
    if (!q || searching) return;
    if (!llm) {
      setSearchError("Connect your local LLM in Settings first.");
      return;
    }
    setSearchError(null);
    setSearchResult(null);
    setSearching(true);
    try {
      const output = await runJob("jobs", q, async () => {
        const search = await exaSearch({
          query: `${q} ${jobLocation.trim()} job openings apply`,
          numResults: 8,
          textLength: 3000,
        });
        const sources: Source[] = search.results.map((r) => ({
          title: r.title,
          url: r.url,
        }));
        const content = await chatCompletion(
          llm,
          [
            {
              role: "user",
              content: summarizeJobsPrompt(
                q,
                jobLocation.trim(),
                search.results.map((r) => r.text)
              ),
            },
          ],
          { temperature: 0.4 }
        );
        await saveJobSearch({
          query: q,
          location: jobLocation.trim(),
          content,
          sources,
        });
        return { content, sources };
      });
      setSearchResult(output);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Job search failed.");
    } finally {
      setSearching(false);
    }
  }

  function loadResume(r: {
    _id: Id<"resumes">;
    title: string;
    content: string;
  }) {
    setResume(r.content);
    setResumeTitle(r.title);
    setEditingId(r._id);
    setTab("builder");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Career</h1>
        <p className="text-sm text-muted-foreground">
          Build a standout resume, get an ATS-style review, and find live
          openings — all reasoned by your local model.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              tab === t.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "builder" && (
        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4 text-primary" /> Build your resume
            </h2>
            <div className="space-y-2">
              <Label htmlFor="target-role">
                Target role{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Your details</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Paste your raw career info — name, contact, work history, education, skills. The more detail, the better the resume."
                className="min-h-[140px]"
              />
            </div>
            {builderError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {builderError}
              </p>
            )}
            <Button
              onClick={() => void generateResume()}
              disabled={building || !details.trim()}
            >
              {building ? <Spinner /> : <Sparkles />} Generate resume
            </Button>
          </section>

          {resume && (
            <section className="space-y-4 rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">Your resume</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={resumeTitle}
                    onChange={(e) => setResumeTitle(e.target.value)}
                    placeholder="Resume name"
                    className="h-9 max-w-[220px]"
                  />
                  <Button onClick={() => void handleSaveResume()}>
                    {editingId ? "Update" : "Save"}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <Markdown content={resume} />
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-semibold">Saved resumes</h2>
            {resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved resumes yet. Generate one above and hit save.
              </p>
            ) : (
              <ul className="space-y-2">
                {resumes.map((r) => (
                  <li
                    key={r._id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() => loadResume(r)}
                    >
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {timeAgo(r.updatedAt)}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void deleteResume({ id: r._id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "review" && (
        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <ClipboardCheck className="h-4 w-4 text-primary" /> Review your
              resume
            </h2>
            <div className="space-y-2">
              <Label htmlFor="resume-text">Your resume</Label>
              <Textarea
                id="resume-text"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume text here…"
                className="min-h-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">
                Target job description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="job-desc"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste a job description to tailor the review…"
                className="min-h-[120px]"
              />
            </div>
            {reviewError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {reviewError}
              </p>
            )}
            <Button
              onClick={() => void runReview()}
              disabled={reviewing || !resumeText.trim()}
            >
              {reviewing ? <Spinner /> : <ClipboardCheck />} Review resume
            </Button>
          </section>

          {review && (
            <section className="rounded-xl border bg-card p-5">
              <Markdown content={review} />
            </section>
          )}
        </div>
      )}

      {tab === "search" && (
        <div className="space-y-4">
          <section className="space-y-4 rounded-xl border bg-card p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Search className="h-4 w-4 text-primary" /> Find your next role
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-query">Role or keywords</Label>
                <Input
                  id="job-query"
                  value={jobQuery}
                  onChange={(e) => setJobQuery(e.target.value)}
                  placeholder="e.g. Product Manager, AI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-location">
                  Location{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="job-location"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  placeholder="e.g. Remote, London"
                />
              </div>
            </div>
            {searchError && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {searchError}
              </p>
            )}
            <Button
              onClick={() => void runSearch()}
              disabled={searching || !jobQuery.trim()}
            >
              {searching ? <Spinner /> : <Search />} Search jobs
            </Button>
          </section>

          {searchResult && (
            <section className="rounded-xl border bg-card p-5">
              <Markdown content={searchResult.content} />
              {searchResult.sources.length > 0 && (
                <div className="mt-5 border-t pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Sources
                  </p>
                  <ul className="space-y-1">
                    {searchResult.sources.map((s, i) => (
                      <li key={i} className="text-sm">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-semibold">Recent searches</h2>
            {searches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No saved searches yet. Run your first search above.
              </p>
            ) : (
              <ul className="space-y-2">
                {searches.map((s) => (
                  <li
                    key={s._id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left"
                      onClick={() =>
                        setSearchResult({
                          content: s.content,
                          sources: s.sources,
                        })
                      }
                    >
                      <p className="truncate text-sm font-medium">
                        {s.query}
                        {s.location ? ` · ${s.location}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(s.createdAt)}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void deleteJobSearch({ id: s._id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
