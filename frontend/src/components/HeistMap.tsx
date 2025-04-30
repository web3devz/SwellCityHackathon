"use client";

import React, { useEffect } from "react";
import { Hexagon as HexagonType } from "@/hooks/useGameState";
  
type Hexagon = {
  q: number;
  r: number;
  owner: string | null;
  resources: number;
};

interface HeistMapProps {
  grid: HexagonType[];
  currentPlayer: string;
}

export default function HeistMap({ grid, currentPlayer }: HeistMapProps) {
  const hexSize = 30;
  const hexWidth = Math.sqrt(3) * hexSize;
  const hexHeight = 2 * hexSize;

  // Debug log to check incoming data
  useEffect(() => {
    console.log("HeistMap received update:", { grid, currentPlayer });
  }, [grid, currentPlayer]);

  const getHexPosition = (q: number, r: number) => {
    // Honeycomb layout positioning
    const x = hexWidth * (q + r/2);
    const y = r * (hexHeight * 3/4);
    return { x, y };
  };

  const getPlayerPattern = (playerName: string | null) => {
    if (!playerName) return "#1f2937"; // Dark gray for unowned
    
    const pfpUrl = `https://api.cloudnouns.com/v1/pfp?background=n&body=none&text=${encodeURIComponent(
      playerName
    )}&accessory=none`;
    
    return pfpUrl;
  };

  const renderHexagon = (hex: Hexagon) => {
    const { x, y } = getHexPosition(hex.q, hex.r);
    const points = [
      [0, -hexSize],
      [hexWidth / 2, -hexSize / 2],
      [hexWidth / 2, hexSize / 2],
      [0, hexSize],
      [-hexWidth / 2, hexSize / 2],
      [-hexWidth / 2, -hexSize / 2],
    ].map(([px, py]) => `${x + px},${y + py}`).join(" ");

    const isCurrentPlayer = currentPlayer === hex.owner;
    const isAdjacent = grid.some(h => 
      h.owner === currentPlayer && 
      Math.abs(h.q - hex.q) <= 1 && 
      Math.abs(h.r - hex.r) <= 1
    );

    return (
      <g 
        key={`${hex.q},${hex.r}`}
        className="transition-all"
      >
        {hex.owner && (
          <defs>
            <pattern
              id={`pattern-${hex.q}-${hex.r}-${hex.owner}`}
              patternUnits="userSpaceOnUse"
              width={hexWidth}
              height={hexHeight}
              x={x - hexWidth/2}
              y={y - hexHeight/2}
            >
              <image
                href={getPlayerPattern(hex.owner)}
                x={hexWidth * 0.2}
                y={hexHeight * 0.2}
                width={hexWidth * 0.6}
                height={hexHeight * 0.6}
                preserveAspectRatio="xMidYMid meet"
              />
            </pattern>
          </defs>
        )}
        <polygon
          points={points}
          fill={hex.owner ? `url(#pattern-${hex.q}-${hex.r}-${hex.owner})` : "#1f2937"}
          stroke="white"
          strokeWidth="1.5"
          opacity={isCurrentPlayer || isAdjacent ? 1 : 0.9}
        />
      </g>
    );
  };

  // Create background grid in honeycomb shape
  const renderBackgroundGrid = () => {
    const backgroundHexes: JSX.Element[] = [];
    
    // Define the honeycomb pattern coordinates
    const pattern: Array<{q: number, r: number}> = [
      // Center row
      {q: 0, r: 0},
      {q: 1, r: 0},
      {q: 2, r: 0},
      {q: -1, r: 0},
      {q: -2, r: 0},
      // Top row
      {q: -1, r: -1},
      {q: 0, r: -1},
      {q: 1, r: -1},
      // Bottom row
      {q: -1, r: 1},
      {q: 0, r: 1},
      {q: 1, r: 1},
      // Top corners
      {q: 0, r: -2},
      // Bottom corners
      {q: 0, r: 2}
    ];

    pattern.forEach(({q, r}) => {
      const { x, y } = getHexPosition(q, r);
      const points = [
        [0, -hexSize],
        [hexWidth / 2, -hexSize / 2],
        [hexWidth / 2, hexSize / 2],
        [0, hexSize],
        [-hexWidth / 2, hexSize / 2],
        [-hexWidth / 2, -hexSize / 2],
      ].map(([px, py]) => `${x + px},${y + py}`).join(" ");

      backgroundHexes.push(
        <polygon
          key={`bg-${q}-${r}`}
          points={points}
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity="0.15"
        />
      );
    });

    return backgroundHexes;
  };

  return (
    <div className="relative w-full h-[600px] border border-zinc-800 rounded-lg overflow-hidden bg-black">
      <svg
        width="100%"
        height="100%"
        viewBox="-250 -200 500 400"
        preserveAspectRatio="xMidYMid meet"
      >
        {renderBackgroundGrid()}
        {grid.map(renderHexagon)}
      </svg>
    </div>
  );
}
