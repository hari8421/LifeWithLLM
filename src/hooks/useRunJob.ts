import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useRunJob() {
  const createJob = useMutation(api.jobs.createJob);
  const finishJob = useMutation(api.jobs.finishJob);

  async function run<T>(
    type: string,
    title: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const id = await createJob({ type, title });
    try {
      const result = await fn();
      await finishJob({ id, status: "done", summary: title });
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Job failed";
      await finishJob({ id, status: "error", error: msg });
      throw e;
    }
  }

  return run;
}
