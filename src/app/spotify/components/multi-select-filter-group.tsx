import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDownIcon } from "lucide-react";
import { IncludeExcludeItem } from "./include-exclude-group";

export function MultiSelectFilterGroup({
  buttonText = "Välj",
  searchPlaceholder = "Sök...",
  items,
  allowExclude = true,
  noResult = "Inga resultat",
  listEmpty = "Tom",
  className = "",
}: {
  buttonText?: string,
  searchPlaceholder?: string,
  items: string[],
  noResult?: string,
  allowExclude?: boolean,
  listEmpty?: string,
  className?: string,
}) {

  return (
    <div className={`flex flex-col justify-start items-center gap-y-3 ${className}`}>
      <Popover>
        {/* Trigger */}
        <PopoverTrigger asChild>
          <Button role="combobox" variant={"outline"} type="button">
            {buttonText}
            <ChevronsUpDownIcon />
          </Button>
        </PopoverTrigger>
        {/* Select */}
        <PopoverContent>
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty className="my-4 mb-2 w-full text-center opacity-90">{noResult}</CommandEmpty>
              {items.map((item, i) => (
                <CommandItem key={`${encodeURIComponent(item)}-${i}-user-filter`}>
                  <IncludeExcludeItem allowExclude={allowExclude}>{item}</IncludeExcludeItem>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {/* Selected users */}
      <ul id="selected-users-table">
        {/* Non selected */}
        <span className="hidden only:block w-full text-sm text-center opacity-80">{listEmpty}</span>
      </ul>
    </div>
  );
}