import { createFileRoute } from "@tanstack/react-router";
import { CommunityPolls } from "@/features/admin/polls";

export const Route = createFileRoute("/_authenticated/admin/polls/")({
  component: CommunityPolls,
});
