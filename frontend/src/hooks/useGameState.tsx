"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface Hexagon {
  q: number;
  r: number;
  owner: string | null;
  resources: number;
}

export interface Strategy {
  opportunistic: number;
  aggressive: number;
  diplomatic: number;
  defensive: number;
}

export interface AllianceParams {
  giveMax: number;
  getMin: number;
  enabled: boolean;
}

export interface Player {
  id: string;
  name: string;
  personality: string;
  strategy: Strategy;
  allianceParams: AllianceParams | null;
  territories: number;
  resources: number;
  color: string;
}

export interface GameState {
  grid: Hexagon[];
  players: Player[];
  turn: number;
  message: string;
  currentPlayer: string;
  playerCount: number;
  started: boolean;
  isGameOver: boolean;
}

export const useGame = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    players: [],
    turn: 0,
    message: "",
    currentPlayer: "",
    playerCount: 0,
    started: false,
    isGameOver: false,
  });
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const generatePlayerColor = useCallback((playerId: string) => {
    const colors = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#96CEB4", // Green
      "#FFEEAD", // Yellow
      "#9B59B6", // Purple
      "#E67E22", // Orange
    ];
    return colors[
      Math.abs(
        playerId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      ) % colors.length
    ];
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        if (data.type === "update") {
          if (data.grid && Array.isArray(data.grid)) {
            const formattedGrid = data.grid.map((hex: any) => ({
              q: Number(hex.q),
              r: Number(hex.r),
              owner: hex.owner,
              resources: Number(hex.resources) || 0,
            }));

            const formattedPlayers = data.players.map((player: any) => ({
              id: player.id,
              name: player.name,
              personality: player.personality,
              strategy: player.strategy || {
                opportunistic: 25,
                aggressive: 25,
                diplomatic: 25,
                defensive: 25,
              },
              allianceParams: player.allianceParams || null,
              territories: Number(player.territories) || 0,
              resources: Number(player.resources) || 0,
              color: generatePlayerColor(player.id),
            }));

            setGameState({
              grid: formattedGrid,
              players: formattedPlayers,
              turn: Number(data.turn) || 0,
              message: data.message || "",
              currentPlayer: data.currentPlayer || "",
              playerCount: Number(data.playerCount) || 0,
              started: Boolean(data.started),
              isGameOver: Boolean(data.isGameOver),
            });

            if (data.message) {
              setMessageHistory((prev) => [...prev, data.message]);
            }
          }
        } else if (data.type === "error") {
          console.error("Server error:", data.message);
          setMessageHistory((prev) => [...prev, `Error: ${data.message}`]);
          setError(data.message);
        } else if (data.type === "alliance_proposal") {
          setMessageHistory((prev) => [
            ...prev,
            `Alliance proposal from ${data.from}: Give ${data.giveAmount}, Get ${data.getAmount}`,
          ]);
        } else if (data.type === "end") {
          setGameState(prev => ({
            ...prev,
            isGameOver: true,
          }));
          setMessageHistory((prev) => [...prev, "Game Over!"]);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
        setMessageHistory((prev) => [...prev, "Error parsing server message"]);
        setError("Error parsing server message");
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setMessageHistory((prev) => [...prev, "WebSocket connection error"]);
      setError("WebSocket connection error");
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setMessageHistory((prev) => [...prev, "Connection to server closed"]);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [generatePlayerColor]);

  const joinRoom = useCallback((name: string, playerId: string, personality: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Get strategy and alliance params from localStorage
      const storedStrategy = localStorage.getItem("strategy");
      const storedAllianceParams = localStorage.getItem("allianceParams");
      console.log("storedStrategy", storedStrategy);
      console.log("storedAllianceParams", storedAllianceParams);
      const strategy = storedStrategy
        ? JSON.parse(storedStrategy)
        : {
            opportunistic: Math.floor(Math.random() * 25),
            aggressive: Math.floor(Math.random() * 25),
            diplomatic: Math.floor(Math.random() * 25),
            defensive: Math.floor(Math.random() * 25),
          };

      const allianceParams = storedAllianceParams
        ? JSON.parse(storedAllianceParams)
        : null;

      wsRef.current.send(
        JSON.stringify({
          type: "join",
          roomId: "default",
          playerId,
          name,
          personality,
          strategy,
          allianceParams,
        })
      );
    }
  }, []);

  return {
    isConnected,
    gameState,
    messageHistory,
    error,
    joinRoom,
  };
};
