'use client';

import { memo, useState, useRef, useEffect } from 'react';

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
}

export const CustomDropdown = memo(function CustomDropdown({ options, value, onChange, className = '', labelPrefix = '' }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left font-poppins min-w-[160px] ${className}`}>
       <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold text-on-surface hover:border-primary focus:border-primary outline-none transition-all duration-200 cursor-pointer shadow-sm"
      >
        <span>
          {labelPrefix ? <span className="text-on-surface-variant/70 font-normal mr-1">{labelPrefix}</span> : null}
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <span className={`material-symbols-outlined text-sm text-on-surface-variant transition-transform duration-200 select-none ml-2 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

       {isOpen && (
        <div className="absolute right-0 mt-1.5 w-full bg-white border border-outline-variant/30 rounded-lg shadow-xl py-1 z-50 animate-[modalAppear_0.15s_ease-out] overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  opt.value === value
                    ? 'bg-primary/5 text-primary font-bold'
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
