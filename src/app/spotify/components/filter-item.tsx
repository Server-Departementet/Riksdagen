import { CommandItem } from "@/components/ui/command"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon, CheckIcon } from "lucide-react";

// Extend command item
type FilterItemInterface = React.ComponentPropsWithoutRef<typeof CommandItem>;

export function FilterCommandItem({
  children,
  ...props
}: FilterItemInterface) {
  return (
    <CommandItem className="flex flex-row justify-between" {...props}>
      {children}

      <ToggleGroup type="single">
        <ToggleGroupItem value="exclude" className="text-red-600 hover:bg-zinc-300 data-[state=on]:bg-red-700 data-[state=on]:text-zinc-50"><BanIcon className="text-inherit" /></ToggleGroupItem>
        <ToggleGroupItem value="include" className="text-green-600 hover:bg-zinc-300 data-[state=on]:bg-green-600 data-[state=on]:text-zinc-50"><CheckIcon className="text-inherit" /></ToggleGroupItem>
      </ToggleGroup>
    </CommandItem>
  );
}