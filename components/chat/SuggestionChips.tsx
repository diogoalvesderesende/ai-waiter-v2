"use client";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (s: string) => void;
}

export default function SuggestionChips({
  suggestions,
  onSelect,
}: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2.5 bg-white">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="rounded-full border border-brand-200 bg-brand-50/60 px-3.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 hover:border-brand-300 transition-all"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
