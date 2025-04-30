"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import StrategySlider from "@/components/StrategySlider";
import { Switch } from "@/components/Switch";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/Button";
import Image from "next/image";
import { Input } from "@/components/Input";
import PointsAllocator from "@/components/PointsAllocator";

type Strategy = {
  opportunistic: number;
  aggressive: number;
  diplomatic: number;
  defensive: number;
};

const TOTAL_POINTS = 100; // Define maximum total points

export default function StrategyForm() {
  const [strategy, setStrategy] = useState<Strategy>({
    opportunistic: 25, // Adjusted initial values to sum to 100
    aggressive: 25,
    diplomatic: 25,
    defensive: 25,
  });

  const [expanded, setExpanded] = useState(false);
  const [isAllianceChecked, setIsAllianceChecked] = useState(false);

  // Calculate total allocated points
  const getAllocatedPoints = (strat: Omit<Strategy, "alliance">) =>
    Object.values(strat).reduce((sum, value) => sum + value, 0);

  const handleSliderChange = (
    key: keyof Omit<Strategy, "alliance">,
    newValue: number
  ) => {
    setStrategy((prev) => {
      // Get current values of other sliders
      const otherValues = Object.entries(prev)
        .filter(([k]) => k !== key && k !== "alliance")
        .map(([_, v]) => v as number);

      const otherTotal = otherValues.reduce((sum, val) => sum + val, 0);
      const availablePoints = TOTAL_POINTS - otherTotal;

      // Calculate the new value, ensuring it doesn't exceed available points
      const adjustedValue = Math.min(newValue, availablePoints);

      return {
        ...prev,
        [key]: adjustedValue,
      };
    });
  };

  const handleAllianceToggle = (checked: boolean) => {
    setIsAllianceChecked(checked);
  };

  const handleRandomize = () => {
    // Generate random values that sum to exactly TOTAL_POINTS
    const values = [0, 0, 0, 0];
    let remaining = TOTAL_POINTS;

    // Distribute points to first three sliders
    for (let i = 0; i < 3; i++) {
      const max = remaining - (3 - i); // Ensure we leave enough points for remaining sliders
      const value = Math.floor(Math.random() * max) + 1; // Minimum 1 point per slider
      values[i] = value;
      remaining -= value;
    }

    // Last slider gets remaining points
    values[3] = remaining;

    // Normalize to ensure exact TOTAL_POINTS
    const currentTotal = values.reduce((sum, val) => sum + val, 0);
    if (currentTotal !== TOTAL_POINTS) {
      const diff = TOTAL_POINTS - currentTotal;
      values[3] += diff; // Adjust the last value to match TOTAL_POINTS
    }

    // Shuffle the values
    const shuffled = values.sort(() => Math.random() - 0.5);

    setStrategy({
      opportunistic: shuffled[0],
      aggressive: shuffled[1],
      diplomatic: shuffled[2],
      defensive: shuffled[3],
    });
  };

  // Store strategy and alliance params in localStorage when they change
  React.useEffect(() => {
    localStorage.setItem("strategy", JSON.stringify(strategy));
    localStorage.setItem(
      "allianceParams",
      JSON.stringify({
        giveMax: 0,
        getMin: 0,
        enabled: isAllianceChecked,
      })
    );
  }, [strategy, isAllianceChecked]);

  return (
    <div>
      <Card className="border-zinc-800 pt-2 pb-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-2 border-zinc-800">
          <CardTitle className="text-xl font-medium">
            Define Your AI agent's Strategy
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 text-zinc-400 hover:text-white"
            onClick={handleRandomize}
          >
            <Image src="/dices.svg" alt="Randomize" width={28} height={28} />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-6">
            <StrategySlider
              label="Opportunistic"
              value={strategy.opportunistic}
              onChange={(value) => handleSliderChange("opportunistic", value)}
            />

            <StrategySlider
              label="Aggressive"
              value={strategy.aggressive}
              onChange={(value) => handleSliderChange("aggressive", value)}
            />

            <StrategySlider
              label="Diplomatic"
              value={strategy.diplomatic}
              onChange={(value) => handleSliderChange("diplomatic", value)}
            />

            <StrategySlider
              label="Defensive"
              value={strategy.defensive}
              onChange={(value) => handleSliderChange("defensive", value)}
            />

            <div className="flex items-center justify-between pt-1 w-full">
              <div className="font-medium">Alliance</div>
              <div className="flex items-center gap-4 w-[70%]">
                <div className="flex items-center gap-2 w-full">
                  <div className="text-xs text-zinc-400">Give Max</div>
                  <Input className="w-[30%]" disabled={!isAllianceChecked} />
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">
                    <Image
                      src="/USDC.svg"
                      alt="USD Coin"
                      width={20}
                      height={20}
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <div className="text-xs text-zinc-400">Get Min</div>
                  <Input className="w-[30%]" disabled={!isAllianceChecked} />
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">
                    <Image
                      src="/USDC.svg"
                      alt="USD Coin"
                      width={20}
                      height={20}
                      className="object-cover"
                    />
                  </div>
                </div>
                <Switch
                  onCheckedChange={handleAllianceToggle}
                  className="data-[state=checked]:bg-zinc-200"
                />
              </div>
            </div>
          </div>
        </CardContent>

        <div
          className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          role="button"
          tabIndex={0}
        >
          <div className="text-sm font-medium">Preview as Text</div>
          <ChevronDownIcon
            size={20}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>

        {expanded && (
          <div className="px-6 py-3 border-t border-zinc-800">
            <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
              {JSON.stringify(strategy, null, 2)}
            </pre>
          </div>
        )}
        {/* Add Points Allocator */}
      </Card>
      <div className="pt-4">
        <PointsAllocator
          allocated={getAllocatedPoints(strategy)}
          total={TOTAL_POINTS}
        />
      </div>
    </div>
  );
}
