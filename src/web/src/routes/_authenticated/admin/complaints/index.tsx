import { createFileRoute } from "@tanstack/react-router";
import { CommunityComplaints } from "@/features/admin/complaints";

export const Route = createFileRoute("/_authenticated/admin/complaints/")({
  component: CommunityComplaints,
});
