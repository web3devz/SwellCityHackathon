"use client";

import React from "react";
import { useGame } from "@/hooks/useGameState";
import Leaderboard from "@/components/Leaderboard";
import ActivityFeed from "@/components/ActivityFeed";
import HeistMap from "@/components/HeistMap";
import TurnCounter from "@/components/TurnCounter";
import useDelegatorSmartAccount from "@/hooks/useDelegatorSmartAccout";
import GameOverDialog from "@/components/GameOverDialog";

export default function GameLayout() {
  const { isConnected, gameState, messageHistory, joinRoom } = useGame();
  const { smartAccount } = useDelegatorSmartAccount();
  const [showGameOver, setShowGameOver] = React.useState(false);

  // Join game when component mounts
  React.useEffect(() => {
    if (isConnected && smartAccount) {
      const name = smartAccount.address.slice(0, 4) + "..." + smartAccount.address.slice(-4);
      joinRoom(name, smartAccount.address, "aggressive");
    }
  }, [isConnected, smartAccount]);

  // Show game over dialog when game is complete
  React.useEffect(() => {
    if (gameState.isGameOver) {
      setShowGameOver(true);
    }
  }, [gameState.isGameOver]);

  // Handle escape key to dismiss dialog
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowGameOver(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4">
            <Leaderboard
              players={gameState.players}
              currentPlayerId={gameState.currentPlayer}
            />
            <ActivityFeed messages={messageHistory} />
          </div>

          <div className="md:col-span-2 bg-zinc-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-row items-center gap-4">
                <div className="top-2 right-2 w-3 h-3 bg-red-500 rounded-full flicker-animation" />
                <h2 className="text-xl font-bold">Live Map</h2>
              </div>
              {gameState && (
                <div className="text-sm">
                  <TurnCounter current={gameState.turn} total={10} />
                </div>
              )}
            </div>
            <HeistMap
              grid={gameState.grid}
              currentPlayer={gameState.currentPlayer}
            />
          </div>
        </div>
      </div>

      <GameOverDialog
        isOpen={showGameOver}
        players={gameState.players}
        onClose={() => setShowGameOver(false)}
      />
    </div>
  );
}
