import { createFileRoute } from "@tanstack/react-router";
import { HelpCenter } from "@/features/admin/help-center";
import { helpCenterQueryOptions } from "@/features/admin/help-center/lib/help-center";

export const Route = createFileRoute("/_authenticated/admin/help-center")({
  loader: ({ context }) => context.queryClient.ensureQueryData(helpCenterQueryOptions()),
  component: HelpCenter,
});
