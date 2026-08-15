import { useQuery } from "convex/react";
import { Clock, History } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

function statusBadge(status: string) {
  switch (status) {
    case "done":
      return <Badge variant="success">Done</Badge>;
    case "running":
      return <Badge variant="warning">Running</Badge>;
    case "queued":
      return <Badge variant="secondary">Queued</Badge>;
    default:
      return <Badge variant="danger">Error</Badge>;
  }
}

export default function JobsPage() {
  const jobs = useQuery(api.jobs.listJobs) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Every research run, price scan, coupon hunt, and post action is
          tracked here.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
          <History className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No jobs yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Run a research query or schedule a post and it will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li
              key={j._id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm font-medium">{j.title}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {j.type} · {timeAgo(j.createdAt)}
                </p>
                {j.error && (
                  <p className="mt-1 text-xs text-red-400">{j.error}</p>
                )}
              </div>
              {statusBadge(j.status)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
