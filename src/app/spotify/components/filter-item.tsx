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
    <CommandItem className="flex flex-row justify-between">
      {children}

      <ToggleGroup type="single" defaultValue="">
        <ToggleGroupItem className="hover:bg-zinc-300" value="exclude"><BanIcon className="text-red-700" /></ToggleGroupItem>
        <ToggleGroupItem className="hover:bg-zinc-300" value="exclude"><CheckIcon className="text-green-600" /></ToggleGroupItem>
      </ToggleGroup>
    </CommandItem>
  );
}