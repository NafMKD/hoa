import { Main } from "@/components/layout/main";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  Briefcase,
  Building,
  Car,
  FileArchive,
  FileSignature,
  FileText,
  HelpCircle,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquareWarning,
  Receipt,
  Search,
  Users,
  UserCheck,
  Vote,
  Wallet,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  helpCenterQueryOptions,
  type HelpCenterCategory,
  type HelpCenterFlow,
  type HelpCenterModule,
} from "./lib/help-center";
import { cn } from "@/lib/utils";
import { useDeferredValue, useMemo, useState } from "react";

const moduleIcons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: Users,
  buildings: Building,
  units: Home,
  employees: UserCheck,
  agencies: Briefcase,
  "payroll-rules": FileSignature,
  fees: BadgeDollarSign,
  invoices: FileText,
  payments: Receipt,
  reconciliation: Workflow,
  expenses: Wallet,
  payroll: FileSignature,
  reports: BadgeDollarSign,
  vehicles: Car,
  polls: Vote,
  complaints: MessageSquareWarning,
  templates: FileArchive,
  letters: Inbox,
};

const categoryStyles: Record<
  HelpCenterCategory,
  {
    hero: string;
    pill: string;
    ring: string;
  }
> = {
  Main: {
    hero: "from-[#fff6db] via-white to-[#eef6ff]",
    pill: "border-[#e8c96b]/60 bg-[#fff7dd] text-[#7a5a00]",
    ring: "ring-[#e8c96b]/40",
  },
  "Users & Properties": {
    hero: "from-[#eef6ff] via-white to-[#f4fbff]",
    pill: "border-[#93c5fd]/60 bg-[#eff6ff] text-[#1d4ed8]",
    ring: "ring-[#93c5fd]/40",
  },
  Financials: {
    hero: "from-[#ecfdf5] via-white to-[#f6fffb]",
    pill: "border-[#6ee7b7]/60 bg-[#ecfdf5] text-[#047857]",
    ring: "ring-[#6ee7b7]/40",
  },
  Community: {
    hero: "from-[#fff1f2] via-white to-[#fff7f7]",
    pill: "border-[#fda4af]/60 bg-[#fff1f2] text-[#be123c]",
    ring: "ring-[#fda4af]/40",
  },
  System: {
    hero: "from-[#f5f3ff] via-white to-[#fbfaff]",
    pill: "border-[#c4b5fd]/60 bg-[#f5f3ff] text-[#6d28d9]",
    ring: "ring-[#c4b5fd]/40",
  },
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function matchesModule(module: HelpCenterModule, searchTerm: string) {
  if (!searchTerm) return true;

  const haystack = [
    module.title,
    module.summary,
    module.category,
    ...module.keywords,
    ...module.tasks,
    ...module.steps.flatMap((step) => [step.title, step.detail]),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchTerm);
}

function matchesFlow(flow: HelpCenterFlow, searchTerm: string, modules: HelpCenterModule[]) {
  if (!searchTerm) return true;

  const relatedModuleTitles = flow.moduleIds
    .map((moduleId) => modules.find((module) => module.id === moduleId)?.title ?? "")
    .join(" ");

  const haystack = [
    flow.title,
    flow.summary,
    flow.audience,
    relatedModuleTitles,
    ...flow.steps.flatMap((step) => [step.title, step.detail, step.moduleId]),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchTerm);
}

function ModuleCard({
  module,
  relatedModules,
}: {
  module: HelpCenterModule;
  relatedModules: HelpCenterModule[];
}) {
  const Icon = moduleIcons[module.id] ?? HelpCircle;
  const style = categoryStyles[module.category];

  return (
    <Card
      id={module.id}
      className={cn(
        "overflow-hidden rounded-3xl border shadow-sm ring-1",
        style.ring
      )}
    >
      <CardHeader className={cn("gap-4 bg-gradient-to-br", style.hero)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-3 shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg tracking-tight">{module.title}</CardTitle>
                <Badge variant="outline" className={style.pill}>
                  {module.category}
                </Badge>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">{module.summary}</p>
            </div>
          </div>

          <a
            href={module.route}
            className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition hover:bg-muted"
          >
            Open module
          </a>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div>
          <p className="mb-3 text-sm font-medium tracking-tight">What you usually do here</p>
          <div className="flex flex-wrap gap-2">
            {module.tasks.map((task) => (
              <Badge key={task} variant="secondary" className="rounded-full px-3 py-1">
                {task}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 lg:grid-cols-3">
          {module.steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border bg-muted/20 p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="font-medium tracking-tight">{step.title}</p>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{step.detail}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium tracking-tight">Related modules</p>
          <div className="flex flex-wrap gap-2">
            {relatedModules.map((related) => (
              <button
                key={related.id}
                type="button"
                onClick={() =>
                  document.getElementById(related.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }
                className="rounded-full border bg-background px-3 py-1.5 text-sm transition hover:bg-muted"
              >
                {related.title}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FlowCard({
  flow,
  modulesById,
}: {
  flow: HelpCenterFlow;
  modulesById: Map<string, HelpCenterModule>;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border shadow-sm">
      <CardHeader className="space-y-3 bg-gradient-to-br from-[#fff9e8] via-white to-[#eef7ff]">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-[#d4af37]/50 bg-[#fff4cf] text-[#7a5a00]">
            Guided flow
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {flow.audience}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl tracking-tight">{flow.title}</CardTitle>
          <p className="max-w-3xl text-sm text-muted-foreground">{flow.summary}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="grid gap-4 xl:grid-cols-4">
          {flow.steps.map((step, index) => {
            const module = modulesById.get(step.moduleId);
            const Icon = module ? moduleIcons[module.id] ?? HelpCircle : HelpCircle;

            return (
              <div key={`${flow.id}-${step.title}`} className="relative">
                {index < flow.steps.length - 1 ? (
                  <div className="absolute left-1/2 top-full hidden h-6 w-px -translate-x-1/2 bg-border xl:left-auto xl:right-[-0.75rem] xl:top-1/2 xl:block xl:h-px xl:w-6 xl:-translate-y-1/2 xl:translate-x-0" />
                ) : null}

                <div className="h-full rounded-2xl border bg-background p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted/30 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium tracking-tight">{step.title}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {module?.title ?? step.moduleId}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function HelpCenter() {
  const { data } = useQuery(helpCenterQueryOptions());
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCenterCategory | "All">("All");
  const deferredSearchValue = useDeferredValue(searchValue);

  const content = data!;
  const normalizedSearch = normalizeText(deferredSearchValue);

  const modulesById = useMemo(
    () => new Map(content.modules.map((module) => [module.id, module])),
    [content.modules]
  );

  const filteredModules = useMemo(() => {
    return content.modules.filter((module) => {
      const categoryMatches =
        activeCategory === "All" ? true : module.category === activeCategory;
      return categoryMatches && matchesModule(module, normalizedSearch);
    });
  }, [activeCategory, content.modules, normalizedSearch]);

  const filteredFlows = useMemo(() => {
    return content.flows.filter((flow) => matchesFlow(flow, normalizedSearch, content.modules));
  }, [content.flows, content.modules, normalizedSearch]);

  const modulesByCategory = useMemo(() => {
    return content.categories
      .map((category) => ({
        category,
        modules: filteredModules.filter((module) => module.category === category),
      }))
      .filter((group) => group.modules.length > 0);
  }, [content.categories, filteredModules]);

  const totalResults = filteredModules.length + filteredFlows.length;

  return (
    <Main>
      <div className="space-y-8">
        <Card className="overflow-hidden rounded-[2rem] border shadow-sm">
          <CardContent className="relative p-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(45,212,191,0.14),transparent_24%)]" />
            <div className="relative grid gap-6 p-6 md:p-8 xl:grid-cols-[1.5fr_1fr] xl:items-end">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-[#d4af37]/50 bg-[#fff5d1] text-[#7a5a00]">
                    Help Center
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                    Learn every module and the easiest way to get work done.
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                    This guide explains what each system area is for, how the modules connect,
                    and the practical steps a user should follow. Search by task, module name,
                    or workflow and jump straight to the part you need.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">System modules</p>
                    <p className="mt-2 text-2xl font-semibold">{content.modules.length}</p>
                  </div>
                  <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Guided flows</p>
                    <p className="mt-2 text-2xl font-semibold">{content.flows.length}</p>
                  </div>
                  <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                    <p className="text-sm text-muted-foreground">Search scope</p>
                    <p className="mt-2 text-2xl font-semibold">Tasks + modules</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border bg-background/90 p-5 shadow-sm backdrop-blur">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium tracking-tight">Search the Help Center</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try things like "collect payments", "create a lease", or "send a letter".
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Search by module, task, or workflow"
                      className="h-12 rounded-2xl pl-10"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {filteredModules.length} modules
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {filteredFlows.length} flows
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-3 py-1">
                      {totalResults} results
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl tracking-tight">
              How the system fits together
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Most work in the system follows a simple pattern: set things up, operate daily,
              handle money, and communicate clearly.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-4">
              {[
                {
                  title: "1. Set up records",
                  detail: "Create buildings, units, people, employees, or agencies first.",
                  modules: "",
                },
                {
                  title: "2. Run operations",
                  detail: "Manage ownership, leases, vehicles, complaints, and polls as work happens.",
                  modules: "",
                },
                {
                  title: "3. Process money",
                  detail: "Define fees, issue invoices, capture payments, reconcile, and review payroll.",
                  modules: "",
                },
                {
                  title: "4. Communicate and review",
                  detail: "Send letters, keep templates ready, and check reports or dashboard trends.",
                  modules: "",
                },
              ].map((stage, index) => (
                <div key={stage.title} className="relative rounded-2xl border bg-muted/10 p-5 shadow-sm">
                  {index < 3 ? (
                    <div className="absolute right-[-0.75rem] top-1/2 hidden -translate-y-1/2 lg:block">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ) : null}
                  <p className="font-medium tracking-tight">{stage.title}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{stage.detail}</p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {stage.modules}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Browse by module group</h2>
              <p className="text-sm text-muted-foreground">
                Filter the module library and jump directly to the area you want to learn.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeCategory === "All" ? "default" : "outline"}
                onClick={() => setActiveCategory("All")}
                className="rounded-full"
              >
                All modules
              </Button>
              {content.categories.map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="w-full whitespace-nowrap rounded-2xl border bg-background">
            <div className="flex gap-2 p-3">
              {content.modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() =>
                    document.getElementById(module.id)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                  className="rounded-full border px-3 py-1.5 text-sm transition hover:bg-muted"
                >
                  {module.title}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Guided flows</h2>
            <p className="text-sm text-muted-foreground">
              Follow these when you want to know the right order of steps across several modules.
            </p>
          </div>

          {filteredFlows.length === 0 ? (
            <Card className="rounded-3xl border border-dashed shadow-sm">
              <CardContent className="flex min-h-[220px] items-center justify-center p-8 text-center">
                <div className="max-w-md space-y-2">
                  <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="font-medium tracking-tight">No guided flows matched your search.</p>
                  <p className="text-sm text-muted-foreground">
                    Try a broader search like "payments", "payroll", or "complaint".
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredFlows.map((flow) => (
                <FlowCard key={flow.id} flow={flow} modulesById={modulesById} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">Module library</h2>
            <p className="text-sm text-muted-foreground">
              Each card explains what the module is for, what users normally do in it, and the
              easiest way to work through it.
            </p>
          </div>

          {modulesByCategory.length === 0 ? (
            <Card className="rounded-3xl border border-dashed shadow-sm">
              <CardContent className="flex min-h-[220px] items-center justify-center p-8 text-center">
                <div className="max-w-md space-y-2">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="font-medium tracking-tight">No modules matched your search.</p>
                  <p className="text-sm text-muted-foreground">
                    Try another phrase or clear the category filter to see more results.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            modulesByCategory.map((group) => (
              <div key={group.category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={categoryStyles[group.category].pill}>
                    {group.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {group.modules.length} module{group.modules.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="space-y-4">
                  {group.modules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      relatedModules={module.relatedModuleIds
                        .map((relatedId) => modulesById.get(relatedId))
                        .filter((value): value is HelpCenterModule => Boolean(value))}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </Main>
  );
}
