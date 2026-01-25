"use client";

import { useState, useMemo } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MultiSelectFilterProps {
  title: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxDisplayed?: number;
  className?: string;
}

export function MultiSelectFilter({
  title,
  options,
  selected,
  onChange,
  placeholder = "Search...",
  maxDisplayed = 2,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const displayText = useMemo(() => {
    if (selected.length === 0) return title;
    if (selected.length <= maxDisplayed) {
      return selected.join(", ");
    }
    return `${selected.slice(0, maxDisplayed).join(", ")} +${selected.length - maxDisplayed}`;
  }, [selected, title, maxDisplayed]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between bg-zinc-800 border-zinc-700 hover:bg-zinc-700 min-w-[120px]",
            selected.length > 0 && "border-primary/50",
            className
          )}
        >
          <span className="truncate text-sm">
            {selected.length > 0 ? displayText : title}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1 text-xs bg-primary/20 hover:bg-primary/30 cursor-pointer"
                onClick={handleClear}
              >
                {selected.length}
                <X className="h-3 w-3 ml-0.5" />
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="p-2 border-b border-zinc-700">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>

        {/* Select All / Clear All */}
        <div className="flex gap-2 px-2 py-1.5 border-b border-zinc-700">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => onChange([...options])}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex-1"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>

        {/* Options */}
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-zinc-800",
                    selected.includes(option) && "bg-zinc-800/50"
                  )}
                  onClick={() => handleToggle(option)}
                >
                  <Checkbox
                    checked={selected.includes(option)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm truncate">{option}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Simpler single-value filter for sorting
interface SortFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function SortFilter({ value, onChange, options, className }: SortFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
            className
          )}
        >
          <span className="truncate text-sm">
            {options.find((o) => o.value === value)?.label || "Sort by..."}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-1" align="start">
        {options.map((option) => (
          <div
            key={option.value}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-zinc-800",
              value === option.value && "bg-zinc-800"
            )}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            <div
              className={cn(
                "flex h-4 w-4 items-center justify-center",
                value === option.value ? "text-primary" : "opacity-0"
              )}
            >
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm">{option.label}</span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
