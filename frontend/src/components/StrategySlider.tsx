import React from "react";
import { Slider } from "@/components/Slider";

type StrategySliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export default function StrategySlider({
  label,
  value,
  onChange,
}: StrategySliderProps) {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">{label}</div>
        <div className="relative w-[60%]">
          <div className="absolute inset-0 flex items-center">
            <div className="h-1.5 w-full bg-zinc-700 rounded-full"></div>
          </div>
          <Slider
            value={[value]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleValueChange}
            className="pt-1"
          />
        </div>
      </div>
    </div>
  );
}
