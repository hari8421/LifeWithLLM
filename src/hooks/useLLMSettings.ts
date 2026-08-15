import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useLLMSettings() {
  return useQuery(api.settings.getSettings);
}
