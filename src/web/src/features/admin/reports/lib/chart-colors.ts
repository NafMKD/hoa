/**
 * Theme chart tokens (`index.css` — light & `.dark`). Use these in SVG `fill` / `stroke`
 * instead of `hsl(var(--primary))` when `--primary` is already a hex value.
 */
export const REPORT_CHART_FILLS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export function reportChartFill(index: number): string {
  return REPORT_CHART_FILLS[index % REPORT_CHART_FILLS.length];
}
