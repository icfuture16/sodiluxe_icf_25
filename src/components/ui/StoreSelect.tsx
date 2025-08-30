import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface StoreOption {
  id: string;
  label: string;
}

interface StoreSelectProps {
  options: StoreOption[];
  value?: StoreOption | null;
  onChange: (option: StoreOption | null) => void;
  placeholder?: string;
  className?: string;
}

export function StoreSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner une boutique",
  className = ""
}: StoreSelectProps) {
  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "empty") {
      onChange(null);
    } else {
      const selectedOption = options.find(option => option.id === selectedValue);
      onChange(selectedOption || null);
    }
  };

  return (
    <div className={className}>
      <Select value={value?.id || "empty"} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[160px] overflow-y-auto bg-white border border-gray-200 shadow-lg">
          <SelectItem value="empty">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}