import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStatusColor } from "@/features/admin/invoices/lib/invoices";
import type { Invoice } from "@/types/types";
import { Link } from "@tanstack/react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InvoiceListProps {
  invoices: Invoice[];
  invoicesCount: number;
}

export function InvoiceList({ invoices, invoicesCount }: InvoiceListProps) {

  const sortedInvoices = [...invoices].sort((a, b) => {
    const aIsPriority = a.source?.is_recurring;
    const bIsPriority = b.source?.is_recurring;

    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;

    if (aIsPriority && bIsPriority) {
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    }
    return 0;
  });


  return (
    <div className="rounded-lg border bg-muted/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/60">
        <p className="text-sm font-medium">
          Invoice history
          <span className="ml-2 text-xs text-muted-foreground">
            ({invoicesCount} total)
          </span>
        </p>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <Table>
          <TableHeader className="bg-muted/40 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[4%]">#</TableHead>
              <TableHead className="w-[35%]">Fee Name</TableHead>
              <TableHead className="w-[18%]">Invoice #</TableHead>
              <TableHead className="w-[18%]">Invoice type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInvoices.map((invoice: Invoice, index: number) => {
              const invoiceUrl = `/admin/financials/invoices/${invoice.id}`;
              const feeUrl = `/admin/financials/fees/${invoice.source_id}`;
              const isRecurring = invoice.source?.is_recurring;
              const firstInvoiceMonth = (
                invoice.metadata?.invoice_snapshot as {
                  invoice_months?: string[];
                } | undefined
              )?.invoice_months?.[0];
              
              const content = (
                <Link
                  to={feeUrl}
                  className="underline hover:text-primary flex items-center gap-5"
                  target="_blank"
                >
                  {invoice.source?.name}

                  <Badge
                    variant="outline"
                    className={getStatusColor(invoice.status)}
                  >
                    {invoice.status}
                  </Badge>
                </Link>
              );

              return (
                <TableRow key={invoice.id} className="hover:bg-muted/40">
                  <TableCell>{index + 1}</TableCell>

                  <TableCell className="font-medium">
                    {isRecurring && firstInvoiceMonth ? (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center">
                              {content}
                            </span>
                          </TooltipTrigger>

                          <TooltipContent side="bottom" align="end">
                            <span>{firstInvoiceMonth}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      content
                    )}
                  </TableCell>

                  <TableCell>
                    <Link
                      to={invoiceUrl}
                      className="underline hover:text-primary"
                      target="_blank"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </TableCell>

                  <TableCell>{invoice.invoice_type}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
