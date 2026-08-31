import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface FilterOptionItem<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface MultiSelectFilterDropdownProps<T = string> {
  label: string;
  selected: T[];
  options: FilterOptionItem<T>[];
  onChange: (selected: T[]) => void;
}

export function MultiSelectFilterDropdown<T extends string>({
  label,
  selected,
  options,
  onChange,
}: MultiSelectFilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOption = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const hasSelection = selected.length > 0;

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
          hasSelection
            ? 'bg-[var(--workos-card-bg)] border-[var(--workos-text-primary)]/40 text-[var(--workos-text-primary)] font-medium shadow-xs'
            : 'bg-[var(--workos-input-bg)] border-[var(--workos-border)] text-[var(--workos-text-muted)] hover:text-[var(--workos-text-primary)] hover:border-[var(--workos-border-hover)]'
        }`}
      >
        <span>{label}</span>

        {hasSelection && (
          <span className="flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-mono font-semibold rounded bg-[var(--workos-text-primary)] text-[var(--workos-canvas)]">
            {selected.length}
          </span>
        )}

        <ChevronDown
          className={`w-3 h-3 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[var(--workos-text-primary)]' : 'opacity-60'
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-52 max-h-64 overflow-y-auto bg-[var(--workos-card-bg)] border border-[var(--workos-border)] rounded-xl shadow-xl z-40 py-1 text-xs workos-custom-scroll animate-fadeIn">
          {/* Header Action: Clear if selected */}
          {hasSelection && (
            <div className="flex items-center justify-between px-2.5 py-1 mb-1 border-b border-[var(--workos-border)] text-[10px] text-[var(--workos-text-muted)]">
              <span>{selected.length} ausgewählt</span>
              <button
                onClick={handleClear}
                className="hover:text-[var(--workos-text-primary)] transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <X className="w-2.5 h-2.5" />
                <span>Zurücksetzen</span>
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="flex flex-col">
            {options.map((opt) => {
              const isChecked = selected.includes(opt.value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleToggleOption(opt.value)}
                  className={`flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-[var(--workos-col-bg)] transition-colors cursor-pointer ${
                    isChecked ? 'text-[var(--workos-text-primary)] font-medium' : 'text-[var(--workos-text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Custom Minimal Checkbox */}
                    <div
                      className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
                        isChecked
                          ? 'bg-[var(--workos-text-primary)] border-[var(--workos-text-primary)] text-[var(--workos-canvas)]'
                          : 'border-[var(--workos-border)] bg-[var(--workos-input-bg)]'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                    </div>

                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {opt.count !== undefined && (
                    <span className="text-[10px] font-mono opacity-50 ml-1.5 shrink-0">
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
