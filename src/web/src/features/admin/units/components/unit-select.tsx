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
import { searchUnits } from "../lib/units";
import type { Unit } from "@/types/types";

interface UnitSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  status?: string;
  disabledIds?: number[];
}

export function UnitSelect({
  value,
  onChange,
  error,
  status,
  disabledIds,
}: UnitSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Unit[]>([]);
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
        const units = await searchUnits(query, status);
        setOptions(units.data);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, open, status]);

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }
    const found = options.find((u) => u.id === value);
    if (found) {
      setSelectedLabel(found.name);
    }
  }, [value, options]);

  const handleSelect = (unit: Unit) => {
    onChange(unit.id as number);
    setSelectedLabel(unit.name);
    setOpen(false);
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
            {selectedLabel || "Search unit by name"}
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
              placeholder="Type to search units..."
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
                  <CommandEmpty>No units found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((unit) => {
                      const isDisabled = disabledIds?.includes(unit.id as number);
                      return (
                        <CommandItem
                          key={unit.id}
                          value={unit.name}
                          onSelect={() => {
                            if (!isDisabled) handleSelect(unit);
                          }}
                          disabled={isDisabled}
                          className={
                            isDisabled
                              ? "opacity-50 pointer-events-none"
                              : "cursor-pointer"
                          }
                        >
                          <div className="flex flex-col">
                            <span>{unit.name}</span>

                            {(unit.floor_name) && (
                              <span className="text-xs text-muted-foreground">
                                {unit.floor_name}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
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
