'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  labelPrefix?: string;
  disabled?: boolean;
}

export const CustomDropdown = memo(function CustomDropdown({
  options,
  value,
  onChange,
  className = '',
  labelPrefix = '',
  disabled = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((val: string) => {
    onChange(val);
    setIsOpen(false);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        const index = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(index >= 0 ? index : 0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
      if (e.key === 'Escape') e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setHighlightedIndex((prev) => (prev + 1) % options.length);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      }
      e.preventDefault();
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-start font-tajawal min-w-[160px] ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex justify-between items-center bg-white border rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-sm ${
          disabled
            ? 'opacity-40 border-outline-variant bg-surface-container-low cursor-not-allowed text-on-surface-variant'
            : 'border-outline-variant text-on-surface hover:border-primary focus:border-primary cursor-pointer'
        }`}
      >
        <span className="flex-grow text-start truncate min-w-0 pr-1 flex items-center gap-1.5 font-tajawal">
          {labelPrefix ? <span className="text-on-surface-variant/70 font-normal shrink-0">{labelPrefix}</span> : null}
          <span className="truncate">{selectedOption ? selectedOption.label : 'Select...'}</span>
        </span>
        <span className={`material-symbols-outlined text-sm text-on-surface-variant transition-transform duration-200 select-none shrink-0 pl-1.5 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-full bg-white border border-outline-variant/30 rounded-lg shadow-xl py-1 z-50 animate-[modalAppear_0.15s_ease-out] overflow-hidden" role="listbox">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt, index) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-start px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  opt.value === value
                    ? 'bg-primary/5 text-primary font-bold'
                    : index === highlightedIndex
                      ? 'bg-surface-container text-primary font-bold'
                      : 'text-on-surface hover:bg-surface'
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && (
                  <span className="material-symbols-outlined text-sm text-primary select-none">
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

CustomDropdown.displayName = 'CustomDropdown';

