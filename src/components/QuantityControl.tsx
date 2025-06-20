import React from "react";

interface QuantityControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

const QuantityControl: React.FC<QuantityControlProps> = ({
  value,
  onChange,
  min = 0,
  max,
  className = ""
}) => {
  const handleDecrease = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (typeof max === "number" && value >= max) return;
    onChange(value + 1);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < min) val = min;
    if (typeof max === "number" && val > max) val = max;
    onChange(val);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={value <= min}
        className="w-8 h-8 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        aria-label="Kurangi"
      >
        -
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInput}
        className="w-12 text-center rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-1 px-2 text-base font-medium"
        aria-label="Jumlah"
      />
      <button
        type="button"
        onClick={handleIncrease}
        disabled={typeof max === "number" && value >= max}
        className="w-8 h-8 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        aria-label="Tambah"
      >
        +
      </button>
    </div>
  );
};

export default QuantityControl; 