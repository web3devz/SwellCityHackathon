import React from "react";

type TurnCounterProps = {
  current: number;
  total: number;
};

export default function TurnCounter({ current, total }: TurnCounterProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg font-medium">
        Turns: {current} of {total}
      </span>
    </div>
  );
}
