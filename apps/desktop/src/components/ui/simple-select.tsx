import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  id?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export function SimpleSelect({ value, options, onChange, className = "", id }: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        id={id}
        type="button"
        className="w-full h-full p-1 pl-2 pr-1 rounded border bg-zinc-800 text-white outline-none focus:ring-0 cursor-pointer flex items-center justify-between gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate whitespace-nowrap text-sm">{selectedOption?.label}</span>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full min-w-max right-0 mt-1 rounded-md border bg-zinc-800 text-white shadow-md outline-none">
          <ul className="py-1 max-h-60 overflow-auto">
            {options.map(option => (
              <li
                key={option.value}
                className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-zinc-700 focus:bg-zinc-700 ${
                  option.value === value ? "bg-zinc-700" : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
