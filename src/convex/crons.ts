import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("publish scheduled posts", { minutes: 1 }, internal.jobs.publishScheduled);

export default crons;
