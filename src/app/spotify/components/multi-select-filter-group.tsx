import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";

export function IncludeExcludeItem({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-row justify-between items-center">
      {children}

      <ToggleGroup type="single">
        <ToggleGroupItem value="exclude" className="text-red-600 hover:text-red-600 hover:bg-zinc-300 data-[state=on]:bg-red-700 data-[state=on]:text-zinc-50"><BanIcon className="text-inherit" /></ToggleGroupItem>
        <ToggleGroupItem value="include" className="text-green-600 hover:text-green-600 hover:bg-zinc-300 data-[state=on]:bg-green-600 data-[state=on]:text-zinc-50"><CheckIcon className="text-inherit" /></ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export function MultiSelectFilterGroup({
  items,
  emptyText = "",
  className = "",
}: {
  items: string[],
  emptyText?: string,
  className?: string,
}) {
  return (
    <div className={`flex flex-col justify-start items-center gap-y-3 ${className}`}>
      <Popover>
        {/* Trigger */}
        <PopoverTrigger asChild>
          <Button role="combobox" variant={"outline"} type="button">
            Filtrera användare
            <ChevronsUpDownIcon />
          </Button>
        </PopoverTrigger>
        {/* Select */}
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Användarnamn" />
            <CommandList>
              <CommandEmpty className="my-4 mb-2 w-full text-center opacity-90">{emptyText}</CommandEmpty>
              {items.map((item, i) => (
                <CommandItem key={`${encodeURIComponent(item)}-${i}-user-filter`}>
                  <IncludeExcludeItem>{item}</IncludeExcludeItem>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {/* Selected users */}
      <ul id="selected-users-table">
        {/* Non selected */}
        <span className="hidden only:block w-full text-sm text-center opacity-80">Visar alla</span>
      </ul>
    </div>
  );
}