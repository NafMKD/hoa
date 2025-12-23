import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown, Loader2 } from "lucide-react";
// Make sure to create this function or adjust the import
import { searchInvoices } from "../lib/invoices"; 
import type { Invoice } from "@/types/types";

interface InvoiceSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  status?: string[]; // e.g. "paid", "pending"
  customerId?: number; // Optional: if you want to filter invoices by customer
  disabledIds?: number[];
}

export function InvoiceSelect({ 
  value, 
  onChange, 
  error, 
  status, 
  disabledIds 
}: InvoiceSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  // Search when query changes (debounced)
  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setOptions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        // Assuming searchInvoices accepts (query, status, customerId)
        const response = await searchInvoices(query, status);
        setOptions(response.data);          
      } catch (err) {
        console.error("Failed to fetch invoices", err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, open, status]);

  // Update selected label when value or options change
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }
    
    // Check if the selected invoice is in the current options
    const found = options.find((inv) => inv.id === value);
    
    if (found) {
      // Assuming invoice has an 'invoice_number' field
      setSelectedLabel(found.invoice_number); 
    } else if (value && !selectedLabel) {
       // Optional: If value exists but isn't in search results, 
       // you might need a separate 'fetchInvoiceById' call here to set the label correctly
       // or pass a 'initialLabel' prop.
       setSelectedLabel(`Invoice #${value}`); 
    }
  }, [value, options, selectedLabel]);

  const handleSelect = (invoice: Invoice) => {
    onChange(invoice.id as number);
    setSelectedLabel(invoice.invoice_number);
    setOpen(false);
  };

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Or use invoice.currency if available
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedLabel || "Select invoice..."}
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="Search invoice number..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <CommandEmpty>
                  <span className="flex items-center gap-2 justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </span>
                </CommandEmpty>
              )}
              {!loading && (
                <>
                  <CommandEmpty>No invoices found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((invoice) => (
                      <CommandItem
                        key={invoice.id}
                        value={invoice.invoice_number} // Used for filtering by command
                        onSelect={() => {
                          if (!disabledIds?.includes(invoice.id as number)) handleSelect(invoice);
                        }}
                        disabled={disabledIds?.includes(invoice.id as number)}
                        className={disabledIds?.includes(invoice.id as number) ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                      >
                        <div className="flex w-full flex-col">
                          <div className="flex w-full justify-between items-center">
                            <span className="font-medium">{invoice.invoice_number}</span>
                            <span className="text-xs font-semibold">
                              {formatCurrency(invoice.final_amount_due as number)}
                            </span>
                          </div>
                          
                          {/* Optional: Show status or date */}
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{new Date(invoice.due_date as string).toLocaleDateString()}</span>
                            {invoice.status && (
                              <span className="capitalize">• {invoice.status}</span>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}