
import React, { useState, useRef } from 'react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
}

const CurrencyInput: React.FC<Props> = ({ value, onChange, className = '', id }) => {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  const handleFocus = () => {
    setFocused(true);
    // Show only digits when editing
    setRaw(value === 0 ? '' : String(Math.round(value * 100)));
  };

  const handleBlur = () => {
    setFocused(false);
    const parsed = parseInt(raw || '0', 10);
    onChange(parsed / 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const digits = e.target.value.replace(/\D/g, '');
    setRaw(digits);
    const parsed = parseInt(digits || '0', 10);
    onChange(parsed / 100);
  };

  const displayValue = focused
    ? raw === ''
      ? ''
      : (parseInt(raw, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    : formatted;

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    />
  );
};

export default CurrencyInput;
