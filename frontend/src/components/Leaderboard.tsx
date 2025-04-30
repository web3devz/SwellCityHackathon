"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Player } from "@/hooks/useGameState";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccout";

interface LeaderboardProps {
  players: Player[];
  currentPlayerId: string;
}

export default function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);
  const { smartAccount } = useDelegatorSmartAccount();

  useEffect(() => {
    // Sort players by territories (descending)
    const sorted = [...players].sort((a, b) => b.territories - a.territories);
    setSortedPlayers(sorted);
  }, [players]);

  return (
    <div className="bg-zinc-900 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-zinc-500">#{index + 1}</span>
              <Image
                src={`https://api.cloudnouns.com/v1/pfp?background=n&body=none&text=${encodeURIComponent(
                  player.id
                )}&accessory=none`}
                alt="Player Icon"
                width={32}
                height={32}
                className="rounded-full"
                unoptimized
              />
              <span className="font-medium">
                {player.name}
                {player.id === smartAccount?.address && (
                  <span className="text-zinc-500 ml-2">You</span>
                )}
              </span>
            </div>
            <span>{player.territories} pts</span>
          </div>
        ))}
        {sortedPlayers.length === 0 && (
          <div className="text-sm text-zinc-500 text-center py-4">
            No players yet
          </div>
        )}
      </div>
    </div>
  );
}
