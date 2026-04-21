import { queryOptions } from "@tanstack/react-query";

export type HelpCenterCategory =
  | "Main"
  | "Users & Properties"
  | "Financials"
  | "Community"
  | "System";

export type HelpCenterModule = {
  id: string;
  title: string;
  category: HelpCenterCategory;
  route: string;
  summary: string;
  keywords: string[];
  tasks: string[];
  steps: Array<{
    title: string;
    detail: string;
  }>;
  relatedModuleIds: string[];
};

export type HelpCenterFlow = {
  id: string;
  title: string;
  summary: string;
  audience: string;
  moduleIds: string[];
  steps: Array<{
    title: string;
    moduleId: string;
    detail: string;
  }>;
};

export type HelpCenterContent = {
  categories: HelpCenterCategory[];
  modules: HelpCenterModule[];
  flows: HelpCenterFlow[];
};

const HELP_CENTER_CATEGORIES: HelpCenterCategory[] = [
  "Main",
  "Users & Properties",
  "Financials",
  "Community",
  "System",
];

const HELP_CENTER_MODULES: HelpCenterModule[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    category: "Main",
    route: "/admin",
    summary:
      "Use the dashboard to see what needs attention first: collections, complaints, polls, and community activity.",
    keywords: ["overview", "summary", "stats", "activity", "home"],
    tasks: [
      "Check the latest business snapshot",
      "Spot open items quickly",
      "Open detailed sections from one place",
    ],
    steps: [
      {
        title: "Start your day here",
        detail:
          "Open the dashboard first to understand what changed since your last visit.",
      },
      {
        title: "Review the key tabs",
        detail:
          "Use Overview, Financials, Community, and Operations to focus on the area you need.",
      },
      {
        title: "Drill into the module you need",
        detail:
          "If something needs action, follow the shortcut from the dashboard and continue in the source module.",
      },
    ],
    relatedModuleIds: ["reports", "payments", "complaints", "polls"],
  },
  {
    id: "users",
    title: "Users",
    category: "Users & Properties",
    route: "/admin/users",
    summary:
      "Create and manage resident, owner, tenant, representative, and staff records.",
    keywords: ["residents", "owners", "tenants", "profiles", "staff"],
    tasks: [
      "Register a new person",
      "Update contact details or status",
      "View units, leases, and related records",
    ],
    steps: [
      {
        title: "Add the person record",
        detail:
          "Create the user first so the rest of the system can reference the same person everywhere.",
      },
      {
        title: "Set the right role and status",
        detail:
          "Choose the role that matches how the person interacts with the property or the office.",
      },
      {
        title: "Use the profile as the source of truth",
        detail:
          "Once created, the same user can be linked to units, invoices, payments, complaints, letters, and more.",
      },
    ],
    relatedModuleIds: ["units", "complaints", "payments", "letters"],
  },
  {
    id: "buildings",
    title: "Buildings",
    category: "Users & Properties",
    route: "/admin/buildings",
    summary:
      "Set up the building list that the rest of the property structure depends on.",
    keywords: ["property", "site", "tower", "block", "setup"],
    tasks: [
      "Create a building record",
      "Review building details",
      "Prepare the structure before adding units",
    ],
    steps: [
      {
        title: "Create the building first",
        detail:
          "Buildings should exist before units are added so each unit can be placed correctly.",
      },
      {
        title: "Confirm the building information",
        detail:
          "Check the name, address, and floor details so later records stay organized.",
      },
      {
        title: "Move on to units",
        detail:
          "After a building is ready, continue in Units to create the actual spaces inside it.",
      },
    ],
    relatedModuleIds: ["units"],
  },
  {
    id: "units",
    title: "Units",
    category: "Users & Properties",
    route: "/admin/units",
    summary:
      "Manage the actual homes or spaces, including ownership, leasing, invoices, and stickers.",
    keywords: ["apartment", "villa", "shop", "ownership", "lease"],
    tasks: [
      "Create and edit units",
      "Assign owners and leases",
      "Open unit-level invoices and history",
    ],
    steps: [
      {
        title: "Create the unit under a building",
        detail:
          "Each unit should belong to the right building and have the correct type and status.",
      },
      {
        title: "Link people to the unit",
        detail:
          "Assign owners or create a lease so the unit can be billed and managed correctly.",
      },
      {
        title: "Use the detail view for day-to-day work",
        detail:
          "The unit detail page brings together owners, leases, invoices, and other related actions.",
      },
    ],
    relatedModuleIds: ["users", "buildings", "invoices", "vehicles"],
  },
  {
    id: "employees",
    title: "Employees",
    category: "Users & Properties",
    route: "/admin/employees",
    summary:
      "Maintain direct staff records used by payroll and workforce tracking.",
    keywords: ["staff", "salary", "employee", "direct payroll"],
    tasks: [
      "Add direct employees",
      "Maintain payroll-ready records",
      "Review salary-related information",
    ],
    steps: [
      {
        title: "Add the employee profile",
        detail:
          "Create the staff record with the payroll information your office needs.",
      },
      {
        title: "Keep employment details current",
        detail:
          "Update role, salary, and work information whenever it changes.",
      },
      {
        title: "Generate payroll later",
        detail:
          "Once employee records are ready, move into Payroll to generate and review salary runs.",
      },
    ],
    relatedModuleIds: ["payroll-rules", "payroll", "reports"],
  },
  {
    id: "agencies",
    title: "Agencies",
    category: "Users & Properties",
    route: "/admin/agencies",
    summary:
      "Track third-party staffing agencies and the placements they provide.",
    keywords: ["outsourced", "agency", "placement", "contract staff"],
    tasks: [
      "Add agency records",
      "Maintain placements and worker counts",
      "Prepare agency payroll and reporting",
    ],
    steps: [
      {
        title: "Register the agency",
        detail:
          "Create the agency first so monthly payments and placements can be linked correctly.",
      },
      {
        title: "Record placements",
        detail:
          "Add the agency workers or placements that belong to the contract.",
      },
      {
        title: "Use payroll and reports afterward",
        detail:
          "Once the setup is complete, the agency information flows into payroll and financial reports.",
      },
    ],
    relatedModuleIds: ["payroll", "reports"],
  },
  {
    id: "payroll-rules",
    title: "Payroll Rules",
    category: "Users & Properties",
    route: "/admin/payroll-rules",
    summary:
      "Configure the rule set that payroll calculations depend on, such as tax and payroll settings.",
    keywords: ["rules", "tax", "settings", "salary calculation"],
    tasks: [
      "Review payroll settings",
      "Update calculation rules",
      "Keep payroll logic consistent",
    ],
    steps: [
      {
        title: "Check the current rule set",
        detail:
          "Open Payroll Rules before a payroll cycle if salary logic or taxes may have changed.",
      },
      {
        title: "Update only when policy changes",
        detail:
          "Rules should be stable, so change them carefully and only when the business process changes.",
      },
      {
        title: "Generate payroll after rules are ready",
        detail:
          "Once the rule set is correct, Payroll can calculate amounts using the latest settings.",
      },
    ],
    relatedModuleIds: ["employees", "payroll", "reports"],
  },
  {
    id: "fees",
    title: "Fees",
    category: "Financials",
    route: "/admin/financials/fees",
    summary:
      "Define the charges the community collects, including recurring and one-time fees.",
    keywords: ["dues", "charges", "billing setup", "recurring fee"],
    tasks: [
      "Create a fee",
      "Set category and amount",
      "Prepare invoice generation",
    ],
    steps: [
      {
        title: "Define the fee first",
        detail:
          "Set up the charge name, amount, and rules before trying to invoice anyone.",
      },
      {
        title: "Check the fee status",
        detail:
          "Only active fees should be used for fresh invoice generation.",
      },
      {
        title: "Generate or issue invoices next",
        detail:
          "After a fee is ready, use Invoices to create the actual bills residents must pay.",
      },
    ],
    relatedModuleIds: ["invoices", "payments", "reports"],
  },
  {
    id: "invoices",
    title: "Invoices",
    category: "Financials",
    route: "/admin/financials/invoices",
    summary:
      "Issue, review, and track bills for units and people until they are settled.",
    keywords: ["bill", "charge", "due date", "outstanding"],
    tasks: [
      "Create invoices",
      "Review paid, partial, and overdue balances",
      "Apply penalties where needed",
    ],
    steps: [
      {
        title: "Create the invoice",
        detail:
          "Choose the source fee or billing reason, then issue the invoice to the correct unit or user.",
      },
      {
        title: "Monitor the status",
        detail:
          "Use the list and detail pages to see whether each invoice is issued, partial, paid, or overdue.",
      },
      {
        title: "Continue in Payments when money arrives",
        detail:
          "Invoices become useful when they are linked to real payments, so move into Payments next.",
      },
    ],
    relatedModuleIds: ["fees", "payments", "reconciliation", "reports"],
  },
  {
    id: "payments",
    title: "Payments",
    category: "Financials",
    route: "/admin/financials/payments",
    summary:
      "Record money received, confirm it, and connect it to the invoice it settles.",
    keywords: ["collection", "receipt", "payment confirmation", "money in"],
    tasks: [
      "Create a payment record",
      "Confirm or fail incoming payments",
      "Review receipts and references",
    ],
    steps: [
      {
        title: "Enter the payment against an invoice",
        detail:
          "Record the amount, method, and reference so the system knows what the payment belongs to.",
      },
      {
        title: "Review the payment status",
        detail:
          "Use pending, confirmed, failed, and refunded states to reflect what actually happened.",
      },
      {
        title: "Reconcile bank activity if needed",
        detail:
          "When payment references need matching against imported bank lines, continue in Payment Reconciliation.",
      },
    ],
    relatedModuleIds: ["invoices", "reconciliation", "reports"],
  },
  {
    id: "reconciliation",
    title: "Payment Reconciliation",
    category: "Financials",
    route: "/admin/financials/reconciliation",
    summary:
      "Match imported bank statement lines with system payments and resolve exceptions.",
    keywords: ["bank statement", "matching", "reference", "exceptions"],
    tasks: [
      "Upload bank statements",
      "Review automatic matches",
      "Resolve escalations and unmatched items",
    ],
    steps: [
      {
        title: "Upload a statement batch",
        detail:
          "Import the bank file so the system can compare incoming lines against stored payments.",
      },
      {
        title: "Review match quality",
        detail:
          "Check the batches to see which transactions matched and which ones need attention.",
      },
      {
        title: "Resolve escalations",
        detail:
          "For anything unclear, link the correct payment manually and leave notes for auditability.",
      },
    ],
    relatedModuleIds: ["payments", "invoices", "reports"],
  },
  {
    id: "expenses",
    title: "Expenses",
    category: "Financials",
    route: "/admin/financials/expenses",
    summary:
      "Track vendor spending, categories, and outgoing costs that affect the community budget.",
    keywords: ["vendor", "cost", "spending", "outgoing money"],
    tasks: [
      "Record expenses",
      "Manage vendors and categories",
      "Keep financial reporting accurate",
    ],
    steps: [
      {
        title: "Choose the correct category",
        detail:
          "Use the right expense category so reporting later is easy to understand.",
      },
      {
        title: "Add the amount and date",
        detail:
          "Record the expense with the right amount, invoice number, vendor, and expense date.",
      },
      {
        title: "Use reports to review trends",
        detail:
          "When expenses are recorded consistently, Reports can summarize them clearly by category and period.",
      },
    ],
    relatedModuleIds: ["reports"],
  },
  {
    id: "payroll",
    title: "Payroll",
    category: "Financials",
    route: "/admin/financials/payroll",
    summary:
      "Generate, review, approve, and mark payroll as paid for direct staff and agency work.",
    keywords: ["salary run", "payout", "approval", "agency payroll"],
    tasks: [
      "Generate payroll",
      "Review calculations",
      "Approve and mark payouts as paid",
    ],
    steps: [
      {
        title: "Prepare the source data",
        detail:
          "Make sure Employees, Agencies, and Payroll Rules are already correct before generating a run.",
      },
      {
        title: "Generate and review the payroll",
        detail:
          "Use the payroll tabs to create the run, then inspect taxes, deductions, and totals carefully.",
      },
      {
        title: "Approve and complete the cycle",
        detail:
          "After review, approve the run and mark payments as paid when the real transfer is complete.",
      },
    ],
    relatedModuleIds: ["employees", "agencies", "payroll-rules", "reports"],
  },
  {
    id: "reports",
    title: "Reports",
    category: "Financials",
    route: "/admin/financials/reports",
    summary:
      "Read financial summaries for income, expenses, payroll, and profit-and-loss over a period.",
    keywords: ["analytics", "summary", "pnl", "export", "finance"],
    tasks: [
      "Compare periods",
      "Check totals by building or category",
      "Export CSV for sharing",
    ],
    steps: [
      {
        title: "Pick the date range",
        detail:
          "Start by choosing the period you want to understand or share.",
      },
      {
        title: "Open the report tab you need",
        detail:
          "Use the available report tabs to focus on income, expenses, payroll, or full profit-and-loss.",
      },
      {
        title: "Export when needed",
        detail:
          "If someone needs the numbers outside the app, use the export action and share the CSV.",
      },
    ],
    relatedModuleIds: ["fees", "invoices", "payments", "expenses", "payroll"],
  },
  {
    id: "vehicles",
    title: "Vehicles",
    category: "Community",
    route: "/admin/vehicles",
    summary:
      "Register vehicles, issue stickers, and manage replacements or loss events.",
    keywords: ["parking", "car", "sticker", "vehicle registration"],
    tasks: [
      "Create vehicle records",
      "Issue and replace stickers",
      "Review unit and document links",
    ],
    steps: [
      {
        title: "Register the vehicle",
        detail:
          "Create the vehicle under the correct unit so its access record stays tied to the right property.",
      },
      {
        title: "Issue the sticker",
        detail:
          "Use the vehicle detail page to issue or replace stickers and keep status history accurate.",
      },
      {
        title: "Handle losses and returns clearly",
        detail:
          "If a sticker is lost or returned, update the record so gate and audit workflows stay clean.",
      },
    ],
    relatedModuleIds: ["units", "fees", "invoices"],
  },
  {
    id: "polls",
    title: "Community Poll",
    category: "Community",
    route: "/admin/polls",
    summary:
      "Create community votes, choose who can participate, open voting, and review results.",
    keywords: ["vote", "election", "survey", "community decision"],
    tasks: [
      "Draft a poll",
      "Choose the eligible audience",
      "Open, close, and review results",
    ],
    steps: [
      {
        title: "Draft the question and options",
        detail:
          "Start with a clear title, schedule, and at least two answer options.",
      },
      {
        title: "Set the voting scope",
        detail:
          "Choose whether everyone, selected buildings, or selected units may vote.",
      },
      {
        title: "Open and close the poll deliberately",
        detail:
          "Only open it when the setup is final, then review the final counts in the results view.",
      },
    ],
    relatedModuleIds: ["dashboard"],
  },
  {
    id: "complaints",
    title: "Complaints",
    category: "Community",
    route: "/admin/complaints",
    summary:
      "Track resident issues from submission through resolution, including priority and status.",
    keywords: ["issue", "ticket", "resident problem", "service request"],
    tasks: [
      "Create or review complaints",
      "Track status and priority",
      "Close the loop when resolved",
    ],
    steps: [
      {
        title: "Capture the issue clearly",
        detail:
          "Use the complaint subject, description, category, and attachments so the case is easy to understand.",
      },
      {
        title: "Move it through the right status",
        detail:
          "Update the status from open to in progress and then to resolved or closed as work happens.",
      },
      {
        title: "Use follow-up communication when needed",
        detail:
          "If the resident needs a formal response, continue into Letters and send the right document.",
      },
    ],
    relatedModuleIds: ["letters", "templates", "dashboard"],
  },
  {
    id: "templates",
    title: "Document Templates",
    category: "System",
    route: "/admin/templates",
    summary:
      "Maintain reusable document layouts that power official letters and generated paperwork.",
    keywords: ["template", "document", "placeholder", "letter design"],
    tasks: [
      "Create a template",
      "Manage placeholders",
      "Keep document wording consistent",
    ],
    steps: [
      {
        title: "Create the reusable document",
        detail:
          "Write the structure once so the office can generate the same type of document repeatedly.",
      },
      {
        title: "Define the placeholders carefully",
        detail:
          "Make sure each placeholder matches the values the system can actually provide later.",
      },
      {
        title: "Generate letters from the template",
        detail:
          "After the template is ready, move into Letters to produce and send actual documents.",
      },
    ],
    relatedModuleIds: ["letters"],
  },
  {
    id: "letters",
    title: "Letters",
    category: "System",
    route: "/admin/letters",
    summary:
      "Generate, review, and store outgoing letters that use your approved templates.",
    keywords: ["official notice", "outgoing letter", "document issue"],
    tasks: [
      "Create a letter from a template",
      "Review generated output",
      "Keep a record of official communication",
    ],
    steps: [
      {
        title: "Choose the right template",
        detail:
          "Select the document type that matches the message you want to send.",
      },
      {
        title: "Fill the record context",
        detail:
          "Use the correct person, unit, or subject details so the final document is accurate.",
      },
      {
        title: "Store and share the final letter",
        detail:
          "Once generated, keep it as the office record of what was formally communicated.",
      },
    ],
    relatedModuleIds: ["templates", "complaints", "users"],
  },
];

const HELP_CENTER_FLOWS: HelpCenterFlow[] = [
  {
    id: "property-setup",
    title: "Set up a new property structure",
    summary:
      "Use this when a new building or block is entering the system for the first time.",
    audience: "Property admins",
    moduleIds: ["buildings", "units", "users", "vehicles"],
    steps: [
      {
        title: "Create the building",
        moduleId: "buildings",
        detail:
          "Start with the building record so the location exists before anything else is linked to it.",
      },
      {
        title: "Add the units",
        moduleId: "units",
        detail:
          "Create the homes or spaces under that building with the correct type and status.",
      },
      {
        title: "Register the people",
        moduleId: "users",
        detail:
          "Add owners, tenants, or representatives so the unit can be linked to real people.",
      },
      {
        title: "Add optional vehicle access",
        moduleId: "vehicles",
        detail:
          "If the resident has a vehicle, register it and issue a sticker after the unit is ready.",
      },
    ],
  },
  {
    id: "resident-onboarding",
    title: "Onboard an owner or tenant",
    summary:
      "Follow this path when a person is joining the community and needs to be fully set up.",
    audience: "Front office and property admins",
    moduleIds: ["users", "units", "letters"],
    steps: [
      {
        title: "Create the user profile",
        moduleId: "users",
        detail:
          "Add the person first so all later records can point to the same profile.",
      },
      {
        title: "Assign ownership or a lease",
        moduleId: "units",
        detail:
          "Use the unit workflow to connect the person to the right property record.",
      },
      {
        title: "Send a formal document if needed",
        moduleId: "letters",
        detail:
          "If the onboarding process needs an official letter, generate it after the profile and unit link are done.",
      },
    ],
  },
  {
    id: "billing-collection",
    title: "Bill and collect community dues",
    summary:
      "This is the normal flow for collecting fees from residents and keeping the books clean.",
    audience: "Finance and admin teams",
    moduleIds: ["fees", "invoices", "payments", "reconciliation", "reports"],
    steps: [
      {
        title: "Define the charge",
        moduleId: "fees",
        detail:
          "Set up the fee so the billing rule is clear before invoices are created.",
      },
      {
        title: "Issue the invoice",
        moduleId: "invoices",
        detail:
          "Create the actual bill for the correct unit or person.",
      },
      {
        title: "Record the payment",
        moduleId: "payments",
        detail:
          "When money comes in, save the transaction and confirm it after review.",
      },
      {
        title: "Match it to the bank",
        moduleId: "reconciliation",
        detail:
          "Upload bank activity and resolve anything that did not match automatically.",
      },
      {
        title: "Review the results",
        moduleId: "reports",
        detail:
          "Open Reports to confirm the income picture for the selected period.",
      },
    ],
  },
  {
    id: "payroll-cycle",
    title: "Run a payroll cycle",
    summary:
      "Use this for direct staff and agency-related payroll work from setup to payout.",
    audience: "HR, finance, and admin teams",
    moduleIds: ["employees", "agencies", "payroll-rules", "payroll", "reports"],
    steps: [
      {
        title: "Prepare people and agency data",
        moduleId: "employees",
        detail:
          "Make sure staff records are complete and current before the payroll period begins.",
      },
      {
        title: "Review agency placements if used",
        moduleId: "agencies",
        detail:
          "Check outsourced workforce information so payroll totals reflect real placements.",
      },
      {
        title: "Verify payroll rules",
        moduleId: "payroll-rules",
        detail:
          "Confirm salary logic, taxes, and payroll settings before generating the run.",
      },
      {
        title: "Generate and approve payroll",
        moduleId: "payroll",
        detail:
          "Create the payroll run, review it carefully, then approve and mark payouts as paid.",
      },
      {
        title: "Check financial reporting",
        moduleId: "reports",
        detail:
          "Use the financial reports to see how payroll affected the wider numbers.",
      },
    ],
  },
  {
    id: "complaint-resolution",
    title: "Handle a resident complaint",
    summary:
      "Follow this flow when a resident issue needs tracking, follow-up, and a final closure.",
    audience: "Front office and operations teams",
    moduleIds: ["complaints", "letters", "dashboard"],
    steps: [
      {
        title: "Log the complaint",
        moduleId: "complaints",
        detail:
          "Capture the issue with the right category, priority, and supporting detail.",
      },
      {
        title: "Work it through the statuses",
        moduleId: "complaints",
        detail:
          "Update the case as the work moves from open to in progress and finally to resolved or closed.",
      },
      {
        title: "Send formal follow-up if required",
        moduleId: "letters",
        detail:
          "If the outcome needs an official communication, generate and store the letter.",
      },
      {
        title: "Use the dashboard to monitor the queue",
        moduleId: "dashboard",
        detail:
          "Return to the dashboard to make sure open complaints are reducing over time.",
      },
    ],
  },
  {
    id: "community-vote",
    title: "Launch and close a community vote",
    summary:
      "Use this when the community needs a formal choice recorded in the system.",
    audience: "Community admins and management",
    moduleIds: ["polls", "dashboard"],
    steps: [
      {
        title: "Draft the poll",
        moduleId: "polls",
        detail:
          "Create the question, answer options, schedule, and voter scope first.",
      },
      {
        title: "Open the poll when ready",
        moduleId: "polls",
        detail:
          "Only open the poll once the details are final and the voting window is correct.",
      },
      {
        title: "Close and review results",
        moduleId: "polls",
        detail:
          "End voting when the window is complete, then inspect the final counts.",
      },
      {
        title: "Watch high-level community activity",
        moduleId: "dashboard",
        detail:
          "Use the dashboard to keep polls visible alongside other operational work.",
      },
    ],
  },
  {
    id: "official-letters",
    title: "Create and send an official letter",
    summary:
      "Use this when the office needs a formal document with consistent wording.",
    audience: "Admin and communications teams",
    moduleIds: ["templates", "letters", "users"],
    steps: [
      {
        title: "Maintain the template",
        moduleId: "templates",
        detail:
          "Make sure the reusable template and its placeholders are ready before generating letters.",
      },
      {
        title: "Generate the outgoing letter",
        moduleId: "letters",
        detail:
          "Choose the template, fill in the context, and create the final document.",
      },
      {
        title: "Confirm the recipient context",
        moduleId: "users",
        detail:
          "If the letter is user-specific, double-check the profile and contact details before sending.",
      },
    ],
  },
];

export const HELP_CENTER_CONTENT: HelpCenterContent = {
  categories: HELP_CENTER_CATEGORIES,
  modules: HELP_CENTER_MODULES,
  flows: HELP_CENTER_FLOWS,
};

export function helpCenterQueryOptions() {
  return queryOptions({
    queryKey: ["help-center", "content"],
    queryFn: async () => HELP_CENTER_CONTENT,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
