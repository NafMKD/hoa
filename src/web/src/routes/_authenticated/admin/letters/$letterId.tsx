import { createFileRoute } from "@tanstack/react-router";
import { OutgoingLetterDetail } from "@/features/admin/letters/outgoing-letter-detail";

export const Route = createFileRoute("/_authenticated/admin/letters/$letterId")({
  component: OutgoingLetterDetail,
});
