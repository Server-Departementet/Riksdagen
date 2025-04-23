import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BanIcon, CheckIcon } from "lucide-react";

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