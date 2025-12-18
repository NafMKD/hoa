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
import { searchUsers } from "../lib/users";
import type { User } from "@/types/types";

interface UserSelectProps {
  value?: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  role?: string;
  status?: string;
  disabledIds?: number[];
}

export function UserSelect({ value, onChange, error, role, status, disabledIds }: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<User[]>([]);
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
        const users = await searchUsers(query, role, status);
        setOptions(users.data);          
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, open, role, status]);

  // Update selected label when value or options change
  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }
    const found = options.find((u) => u.id === value);
    if (found) {
      setSelectedLabel(found.full_name);
    }
  }, [value, options]);

  const handleSelect = (user: User) => {
    onChange(user.id as number);
    setSelectedLabel(user.full_name);
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
            {selectedLabel || "Search user by name"}
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
              placeholder="Type to search users..."
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
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.full_name}
                        onSelect={() => {
                          if (!disabledIds?.includes(user.id as number)) handleSelect(user);
                        }}
                        disabled={disabledIds?.includes(user.id as number)}
                        className={disabledIds?.includes(user.id as number) ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                      >
                        <div className="flex flex-col">
                          <span>{user.full_name}</span>
                          {user.phone && (
                            <span className="text-xs text-muted-foreground">
                              {user.phone}
                            </span>
                          )}
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
