"use client";

import { Check, ChevronsUpDown, Inbox, Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue as useDebounce } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

type SelectAsyncProps<T, TResponse = T[]> = {
  fetcher: (query: string) => Promise<TResponse>;
  onValueChange: (value: string | undefined) => void;
  value?: string;
  placeholder?: string;
  itemToValue: (item: T) => string;
  itemToLabel: (item: T) => string;
  itemToKey?: (item: T) => string;
  responseToItems?: (response: TResponse) => T[];
};

function SelectAsync<T, TResponse>({
  fetcher,
  onValueChange,
  value,
  placeholder,
  itemToValue,
  itemToLabel,
  itemToKey,
  responseToItems,
}: SelectAsyncProps<T, TResponse>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<T[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 200);

  React.useEffect(() => {
    async function fetchItems() {
      if (debouncedQuery.length < 2) {
        setItems([]);
        return;
      }
      setIsLoading(true);
      const response = await fetcher(debouncedQuery);
      const newItems = responseToItems ? responseToItems(response) : (response as T[]);
      setItems(newItems);
      setIsLoading(false);
    }
    void fetchItems();
  }, [debouncedQuery, fetcher, responseToItems]);

  const selectedItem = items.find((item) => itemToValue(item) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between">
          {selectedItem ? itemToLabel(selectedItem) : (placeholder ?? "Select")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command filter={() => 1}>
          <CommandInput placeholder="Search..." value={query} onValueChange={setQuery} />
          <CommandList>
            {isLoading && (
              <div className="flex justify-center p-2">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            <CommandEmpty className="w-full">
              <div className="flex flex-col items-center justify-center p-4">
                <Inbox className="h-12 w-12 text-gray-400" />
              </div>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const itemValue = itemToValue(item);
                const itemLabel = itemToLabel(item);
                const key = itemToKey ? itemToKey(item) : itemValue;

                return (
                  <CommandItem
                    key={key}
                    value={itemValue}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? undefined : currentValue);
                      setOpen(false);
                    }}>
                    <Check className={cn("mr-2 h-4 w-4", value === itemValue ? "opacity-100" : "opacity-0")} />
                    {itemLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { SelectAsync };
