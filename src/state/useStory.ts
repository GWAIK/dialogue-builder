import { useContext } from "react";
import { StoryContext } from "./story-context.ts";

export function useStory() {
  const api = useContext(StoryContext);
  if (!api) throw new Error("StoryProvider missing");
  return api;
}
