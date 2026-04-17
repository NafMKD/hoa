import { createFileRoute } from "@tanstack/react-router";
import { CommunityOutgoingLetters } from "@/features/admin/letters";

export const Route = createFileRoute("/_authenticated/admin/letters/")({
  component: CommunityOutgoingLetters,
});
