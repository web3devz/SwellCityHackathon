// server/index.ts
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { OpenAI } from "openai";
import { config } from "dotenv";
import { transferAmount } from "./multibaas";
import { Hex } from "viem";


config();
const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const configuration = {
  apiKey: process.env.OPENAI_API_KEY,
};
const openai = new OpenAI(configuration);

type Hexagon = {
  q: number;
  r: number;
  owner: string | null;
  resources: number;
};

type Strategy = {
  opportunistic: number;
  aggressive: number;
  diplomatic: number;
  defensive: number;
};

type AllianceParams = {
  giveMax: number;
  getMin: number;
  enabled: boolean;
} | null;

type Player = {
  id: string;
  name: string;
  personality: string;
  strategy: Strategy;
  allianceParams: AllianceParams;
  ws: WebSocket;
  territories: number;
  resources: number;
  allies: string[];
  enemies: string[];
  memory: string[];
};

type GameRoom = {
  id: string;
  players: Player[];
  started: boolean;
  grid: Hexagon[];
  turn: number;
};

const rooms: Record<string, GameRoom> = {};

function generateHexGrid(size: number): Hexagon[] {
  const grid: Hexagon[] = [];
  for (let q = -size; q <= size; q++) {
    for (let r = -size; r <= size; r++) {
      if (Math.abs(q + r) <= size) {
        grid.push({
          q,
          r,
          owner: null,
          resources: Math.floor(Math.random() * 3), // Random resources between 0-2
        });
      }
    }
  }
  return grid;
}

function getHexNeighbors(hex: Hexagon): { q: number; r: number }[] {
  const neighbors = [
    { q: hex.q + 1, r: hex.r },
    { q: hex.q + 1, r: hex.r - 1 },
    { q: hex.q, r: hex.r - 1 },
    { q: hex.q - 1, r: hex.r },
    { q: hex.q - 1, r: hex.r + 1 },
    { q: hex.q, r: hex.r + 1 },
  ];

  // Filter out neighbors that would be outside the map bounds
  return neighbors.filter(
    (n) => Math.abs(n.q) <= 3 && Math.abs(n.r) <= 3 && Math.abs(n.q + n.r) <= 3
  );
}

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const msg = JSON.parse(message.toString());

    if (msg.type === "join") {
      let room = rooms[msg.roomId];
      if (!room) {
        console.log("Generating new room");
        room = {
          id: msg.roomId,
          players: [],
          started: false,
          grid: generateHexGrid(3), // 3 rings of hexagons
          turn: 0,
        };
        rooms[msg.roomId] = room;
      }

      if (room.players.length >= 4) {
        ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
        return;
      }

      // Parse strategy and alliance params with defaults
      const strategy: Strategy = msg.strategy || {
        opportunistic: 25,
        aggressive: 25,
        diplomatic: 25,
        defensive: 25,
      };

      const allianceParams: AllianceParams = msg.allianceParams || null;

      const player: Player = {
        id: msg.playerId,
        name: msg.name,
        personality: msg.personality,
        strategy,
        allianceParams,
        ws: ws as any,
        territories: 0,
        resources: 0,
        allies: [],
        enemies: [],
        memory: [],
      };
      room.players.push(player);

      // Set starting positions for players
      const startPositions = [
        { q: -2, r: 0 }, // Player 1 starts at top-left
        { q: 2, r: 0 }, // Player 2 starts at top-right
        { q: 0, r: -2 }, // Player 3 starts at bottom-left
        { q: 0, r: 2 }, // Player 4 starts at bottom-right
      ];

      const pos = startPositions[room.players.length - 1];
      const hex = room.grid.find((h) => h.q === pos.q && h.r === pos.r);
      if (hex) {
        hex.owner = msg.playerId;
        player.territories++;
        player.resources += hex.resources;
      }

      // Broadcast current state and waiting message
      const playersNeeded = 4 - room.players.length;
      broadcast(room, {
        message:
          playersNeeded > 0
            ? `Waiting for ${playersNeeded} more player${
                playersNeeded > 1 ? "s" : ""
              }...`
            : "All players joined! Starting game...",
      });

      // Start game only when 4 players have joined
      if (room.players.length === 4 && !room.started) {
        room.started = true;
        console.log(`\n=== GAME STARTING WITH 4 PLAYERS ===`);
        room.players.forEach((p, index) => {
          console.log(
            `${p.name} (${p.personality}) starting at position (${startPositions[index].q},${startPositions[index].r})`
          );
        });
        await new Promise((res) => setTimeout(res, 1000));
        runGameLoop(room);
      }
    } else if (msg.type === "alliance") {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === msg.playerId)
      );

      if (!room) return;

      const currentPlayer = room.players.find((p) => p.id === msg.playerId);
      const targetPlayer = room.players.find(
        (p) => p.id === msg.targetPlayerId
      );

      if (!currentPlayer || !targetPlayer) return;

      // Check if either player has alliance params disabled
      if (
        !currentPlayer.allianceParams?.enabled ||
        !targetPlayer.allianceParams?.enabled
      ) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Alliances are not enabled for one or both players",
          })
        );
        return;
      }

      // Check if alliance can be automatically formed based on proposer's giveMax and target's getMin
      if (
        currentPlayer.allianceParams.giveMax >=
        targetPlayer.allianceParams.getMin
      ) {
        // Add players to each other's allies list
        if (!currentPlayer.allies.includes(targetPlayer.id)) {
          currentPlayer.allies.push(targetPlayer.id);
          targetPlayer.allies.push(currentPlayer.id);
        }

        // Remove from enemies list if they were enemies
        const enemyIndex = currentPlayer.enemies.indexOf(targetPlayer.id);
        if (enemyIndex !== -1) {
          currentPlayer.enemies.splice(enemyIndex, 1);
          targetPlayer.enemies.splice(
            targetPlayer.enemies.indexOf(currentPlayer.id),
            1
          );
        }

        broadcast(room, {
          message: `${currentPlayer.name} and ${targetPlayer.name} formed an alliance`,
        });
      } else {
        broadcast(room, {
          message: `${currentPlayer.name} and ${targetPlayer.name} could not form an alliance - terms not acceptable`,
        });
      }
    } else if (msg.type === "action") {
      const room = Object.values(rooms).find((r) =>
        r.players.some((p) => p.id === msg.playerId)
      );

      if (!room) return;

      const currentPlayer = room.players[room.turn % room.players.length];
      if (currentPlayer.id !== msg.playerId) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Not your turn",
          })
        );
        return;
      }

      const hex = room.grid.find((h) => h.q === msg.hex.q && h.r === msg.hex.r);

      if (!hex) return;

      if (msg.action === "expand") {
        if (hex.owner) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Cannot expand to occupied territory",
            })
          );
          return;
        }

        const playerHexes = room.grid.filter((h) => h.owner === msg.playerId);
        const isAdjacent = playerHexes.some(
          (h) => Math.abs(h.q - hex.q) <= 1 && Math.abs(h.r - hex.r) <= 1
        );

        if (!isAdjacent) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Can only expand to adjacent territories",
            })
          );
          return;
        }

        hex.owner = msg.playerId;
        currentPlayer.territories++;
        currentPlayer.resources += hex.resources;
        broadcast(room, {
          message: `${currentPlayer.name} expanded their territory`,
        });
      } else if (msg.action === "attack") {
        if (!hex.owner || hex.owner === msg.playerId) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Cannot attack this territory",
            })
          );
          return;
        }

        const playerHexes = room.grid.filter((h) => h.owner === msg.playerId);
        const isAdjacent = playerHexes.some(
          (h) => Math.abs(h.q - hex.q) <= 1 && Math.abs(h.r - hex.r) <= 1
        );

        if (!isAdjacent) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Can only attack adjacent territories",
            })
          );
          return;
        }

        // 50% chance of success
        if (Math.random() > 0.5) {
          const enemy = room.players.find((p) => p.id === hex.owner);
          if (enemy) {
            // Remove territory from enemy's list
            enemy.territories--;
            enemy.resources -= hex.resources;

            // Add territory to attacker's list
            hex.owner = msg.playerId;
            currentPlayer.territories++;
            currentPlayer.resources += hex.resources;

            // Update relationships
            if (!currentPlayer.enemies.includes(enemy.id)) {
              currentPlayer.enemies.push(enemy.id);
              enemy.enemies.push(currentPlayer.id);
            }

            // Break any existing alliance
            const allyIndex = currentPlayer.allies.indexOf(enemy.id);
            if (allyIndex !== -1) {
              currentPlayer.allies.splice(allyIndex, 1);
              enemy.allies.splice(enemy.allies.indexOf(currentPlayer.id), 1);
            }

            // Update memory
            currentPlayer.memory.push(
              `Successfully attacked and captured (${hex.q}, ${hex.r}) from ${enemy.name}`
            );
            enemy.memory.push(
              `Lost territory at (${hex.q}, ${hex.r}) to ${currentPlayer.name}`
            );

            // Broadcast the territory change
            broadcast(room, {
              message: `${currentPlayer.name} captured territory from ${enemy.name} at (${hex.q}, ${hex.r})`,
              type: "update",
              grid: room.grid,
              players: room.players.map((p) => ({
                id: p.id,
                name: p.name,
                territories: p.territories,
                resources: p.resources,
                allies: p.allies,
                enemies: p.enemies,
              })),
            });
          }
        } else {
          currentPlayer.memory.push(`Failed to attack (${hex.q}, ${hex.r})`);
          broadcast(room, {
            message: `${currentPlayer.name}'s attack failed`,
            type: "update",
            grid: room.grid,
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              territories: p.territories,
              resources: p.resources,
              allies: p.allies,
              enemies: p.enemies,
            })),
          });
        }
      }

      // Move to next player's turn
      room.turn++;
      broadcast(room, {
        message: `It's now ${
          room.players[room.turn % room.players.length].name
        }'s turn`,
        type: "update",
        grid: room.grid,
        players: room.players.map((p) => ({
          id: p.id,
          name: p.name,
          territories: p.territories,
          resources: p.resources,
          allies: p.allies,
          enemies: p.enemies,
        })),
      });
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    // Find and clean up any rooms where this player was
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex((p) => p.ws);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        console.log(`Player ${player.name} disconnected from room ${roomId}`);

        // If game hasn't started, remove the player and their territory
        if (!room.started) {
          const startPositions = [
            { q: -2, r: 0 },
            { q: 2, r: 0 },
            { q: 0, r: -2 },
            { q: 0, r: 2 },
          ];
          const pos = startPositions[playerIndex];
          const hex = room.grid.find((h) => h.q === pos.q && h.r === pos.r);
          if (hex) {
            hex.owner = null;
            player.territories--;
            player.resources -= hex.resources;
          }
          room.players.splice(playerIndex, 1);

          // Notify remaining players
          broadcast(room, {
            type: "update",
            grid: room.grid,
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              personality: p.personality,
              territories: p.territories,
              resources: p.resources,
            })),
            turn: room.turn,
            message: `${player.name} left. Waiting for ${
              4 - room.players.length
            } more players...`,
          });
        } else {
          // If game is in progress, notify other players
          broadcast(room, {
            type: "update",
            grid: room.grid,
            message: `${player.name} disconnected but their territories remain in play.`,
          });
        }
      }
    }
  });
});

function printMap(room: GameRoom) {
  console.log("\nCurrent Map:");
  room.grid.forEach((hex) => {
    console.log(`(${hex.q}, ${hex.r}): ${hex.owner || "."}`);
  });
}

function broadcast(room: GameRoom, data: any) {
  // Create a visual representation of the map
  const mapView = room.grid.map((hex) => hex.owner || ".").join(" ");

  // Add map visualization to the broadcast data
  const enrichedData = {
    type: data.type || "update",
    grid: room.grid,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      personality: p.personality,
      territories: p.territories,
      resources: p.resources,
      allies: p.allies,
      enemies: p.enemies,
      strategy: p.strategy,
      allianceParams: p.allianceParams,
    })),
    turn: room.turn,
    message: data.message || "",
    currentPlayer: room.players[room.turn % room.players.length]?.name || "",
    playerCount: room.players.length,
    started: room.started,
  };

  // Send update to all players
  room.players.forEach((p) => {
    try {
      p.ws.send(JSON.stringify(enrichedData));
    } catch (error) {
      console.error(`Error sending update to player ${p.name}:`, error);
    }
  });

  // Print the map to server console
  printMap(room);
  if (data.message) {
    console.log(data.message);
  }
}

async function runGameLoop(room: GameRoom) {
  room.turn = 0;
  const MAX_TURNS = 10;

  // Print initial state
  console.log("\n=== INITIAL STATE ===");
  printMap(room);

  // Broadcast initial state
  broadcast(room, { message: "Game started!" });

  while (room.turn < MAX_TURNS && room.players.length > 0) {
    room.turn++;
    console.log(`\n=== TURN ${room.turn} ===`);

    for (const player of room.players) {
      if (!player.ws) continue; // Skip disconnected players

      const gameState = createStateDescription(room, player);
      const prompt = buildPrompt(gameState, player);
      console.log(player.strategy);
      try {
        const res = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are an AI controlling the faction '${player.name}' with the Strategy Profile:
              - Opportunistic: ${player.strategy.opportunistic}% (Higher values favor expansion and resource gathering)
              - Aggressive: ${player.strategy.aggressive}% (Higher values favor attacking and conquest)
              - Diplomatic: ${player.strategy.diplomatic}% (Higher values favor alliances and cooperation)
              - Defensive: ${player.strategy.defensive}% (Higher values favor territory protection)

              Make strategic choices.`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        });

        const decision =
          res.choices[0].message?.content?.trim().toLowerCase() || "hold";
        console.log(`[${player.name}] Decision:`, decision);

        processDecision(room, player, decision);

        // Broadcast state after each player's turn
        broadcast(room, {
          message: `${player.name} made their move: ${decision}`,
          type: "update",
        });

        await new Promise((res) => setTimeout(res, 2000));
      } catch (error) {
        console.error(`Error processing turn for ${player.name}:`, error);
        broadcast(room, {
          message: `Error processing ${player.name}'s turn`,
          type: "error",
        });
      }
    }
  }

  // Calculate final results
  const finalResults = calculateFinalResults(room);

  // Print final results to console
  console.log("\n=== FINAL RESULTS ===");
  console.log("Final Map State:");
  printMap(room);

  console.log("\nFinal Standings:");
  finalResults.standings.forEach((standing, index) => {
    console.log(`${index + 1}. ${standing.name} (${standing.personality})`);
    console.log(`   Territories: ${standing.territories}`);
    console.log(`   Control: ${standing.controlPercentage}%`);
    console.log(`   Allies: ${standing.allies.join(", ") || "None"}`);
    console.log(`   Enemies: ${standing.enemies.join(", ") || "None"}`);
  });

  console.log(
    `\n🏆 Winner: ${finalResults.winner.name} (${finalResults.winner.personality})`
  );
  console.log(
    `Controlled ${finalResults.winner.controlPercentage}% of the map`
  );

  const winner = finalResults.winner;
  const hash = await transferAmount(BigInt(2), winner.playerId as Hex);
  // Broadcast final results to all players
  broadcast(room, {
    type: "update",
    grid: room.grid,
    finalResults: finalResults,
    message: `🏆 Game Over! Winner: ${finalResults.winner.name} with ${finalResults.winner.controlPercentage}% control 
    \n2 USDC has been transferred to ${winner.name}: ${hash}`,
  });

  broadcast(room, {
    type: "end",
    grid: room.grid,
    finalResults: finalResults,
    message: `🏆 Game Over! Winner: ${finalResults.winner.name} with ${finalResults.winner.controlPercentage}% control 
    \n2 USDC has been transferred to ${winner.name}: ${hash}`,
  });

  // Clean up the room
  console.log(`\nCleaning up room ${room.id}...`);

  // Close all WebSocket connections
  room.players.forEach((player) => {
    try {
      player.ws.close();
    } catch (error) {
      console.error(
        `Error closing connection for player ${player.name}:`,
        error
      );
    }
  });

  // Remove the room from the rooms object
  delete rooms[room.id];
  console.log(`Room ${room.id} has been cleaned up.`);
}

function calculateFinalResults(room: GameRoom) {
  const totalHexes = room.grid.length;

  // Calculate alliance territories
  const allianceTerritories = new Map<string, number>();
  room.players.forEach((player) => {
    const allianceKey =
      player.allies.length > 0
        ? [...player.allies, player.id].sort().join("-")
        : player.id;

    const currentTerritories = allianceTerritories.get(allianceKey) || 0;
    allianceTerritories.set(
      allianceKey,
      currentTerritories + player.territories
    );
  });

  const standings = room.players.map((player) => {
    const allianceKey =
      player.allies.length > 0
        ? [...player.allies, player.id].sort().join("-")
        : player.id;

    const allianceTotalTerritories =
      allianceTerritories.get(allianceKey) || player.territories;
    const controlPercentage = Math.round(
      (allianceTotalTerritories / totalHexes) * 100
    );

    return {
      name: player.name,
      personality: player.personality,
      territories: player.territories,
      allianceTerritories: allianceTotalTerritories,
      resources: player.resources,
      controlPercentage,
      allies: player.allies,
      enemies: player.enemies,
      playerId: player.id,
    };
  });

  standings.sort((a, b) => b.allianceTerritories - a.allianceTerritories);
  const winner = standings[0];

  return { standings, winner };
}

function createStateDescription(room: GameRoom, player: Player): string {
  const territories = countTerritories(room, player);
  const { neutralNeighbors, enemyNeighbors } = scanNeighbors(room, player);

  return `
Current Turn: ${room.turn}
Your Faction: ${player.name}
Personality: ${player.personality}
Controlled Territories: ${territories}
Allies: ${player.allies.join(", ") || "None"}
Enemies: ${player.enemies.join(", ") || "None"}
Adjacent Neutral Positions: ${neutralNeighbors.join(", ")}
Adjacent Enemy Positions: ${enemyNeighbors.join(", ")}
Recent Actions:
${
  player.memory
    .slice(-3)
    .map((m) => `- ${m}`)
    .join("\n") || "- No recent actions."
}

Current Grid State:
${room.grid.map((hex) => hex.owner || ".").join(" ")}
`;
}

function buildPrompt(stateDesc: string, player: Player): string {
  const aggressiveThreshold = 50; // Threshold for aggressive behavior
  const isAggressive = player.strategy.aggressive > aggressiveThreshold;
  
  return `You are controlling the faction '${
    player.name
  }' with the following characteristics:

Strategy Profile:
- Opportunistic: ${
    player.strategy.opportunistic
  }% (Higher values favor expansion and resource gathering)
- Aggressive: ${
    player.strategy.aggressive
  }% (Higher values favor attacking and conquest)
- Diplomatic: ${
    player.strategy.diplomatic
  }% (Higher values favor alliances and cooperation)
- Defensive: ${
    player.strategy.defensive
  }% (Higher values favor territory protection)

Alliance Parameters:
- Alliance Enabled: ${player.allianceParams?.enabled ? "Yes" : "No"}
- Maximum Resources to Give: ${player.allianceParams?.giveMax || 0}
- Minimum Resources to Receive: ${player.allianceParams?.getMin || 0}

Current State:
${stateDesc}

Strategic Guidelines:
1. Your strategy profile influences your decision-making:
   - With ${
     player.strategy.opportunistic
   }% opportunistic strategy, you should focus on:
     * Expanding to unclaimed territories
     * Gathering resources
     * Taking advantage of opportunities
     * Forming alliances
   
   - With ${
     player.strategy.aggressive
   }% aggressive strategy, you should focus on:
     * ${isAggressive ? 'PRIORITIZE ATTACKING ENEMY TERRITORIES - Your aggressive strategy is high, so you should focus on conquest and weakening opponents' : 'Attacking enemy territories when opportunities arise'}
     * ${isAggressive ? 'Take calculated risks to expand your territory through force' : 'Take calculated risks'}
     * ${isAggressive ? 'Target weaker opponents and expand aggressively' : 'Consider attacking when you have an advantage'}
     * ${isAggressive ? 'Break alliances if it means gaining more territory' : 'Maintain strategic alliances'}
   
   - With ${
     player.strategy.diplomatic
   }% diplomatic strategy, you should focus on:
     * Forming alliances
     * Trading resources
     * Maintaining good relations
   
   - With ${player.strategy.defensive}% defensive strategy, you should focus on:
     * Protecting your territories
     * Building strong borders
     * Being cautious in expansion
     * Forming alliances

2. Alliance Formation:
   - Alliances are automatically formed when both parties' terms are met
   - Your giveMax (${
     player.allianceParams?.giveMax || 0
   }) must be >= other player's getMin
   - Your getMin (${
     player.allianceParams?.getMin || 0
   }) must be <= other player's giveMax
   - Consider your alliance parameters when proposing alliances
   - ${isAggressive ? 'As an aggressive player, consider breaking alliances if it benefits your expansion' : 'Maintain alliances that benefit your strategy'}

3. Territory Control:
   - ${isAggressive ? 'PRIORITIZE ATTACKING ENEMY TERRITORIES - Your aggressive strategy demands conquest' : 'Expand to unclaimed territories when possible'}
   - ${isAggressive ? 'Attack enemy territories aggressively, especially if they are weaker' : 'Attack enemy territories based on your aggressive strategy'}
   - Protect your territories based on your defensive strategy
   - ${isAggressive ? 'Focus on weakening opponents through constant attacks' : 'Balance expansion with defense'}

4. Resource Management:
   - Gather resources based on your opportunistic strategy
   - Share resources with allies based on your diplomatic strategy
   - Consider your alliance parameters when trading resources
   - ${isAggressive ? 'Use resources to fuel your aggressive expansion' : 'Manage resources strategically'}

Possible Actions:
1. Expand: Take unclaimed territory
2. Attack: Attack enemy territory (only if adjacent and not an ally)
3. Ally: Propose alliance with another faction
4. Trade: Exchange resources with another faction
5. Hold: Maintain current position

Your decision should reflect your strategy profile and alliance parameters. Consider:
- Your current resources and territory
- Available expansion opportunities
- Potential alliance partners
- Your strategic priorities based on your profile
- Alliance forming to win the game
- Enemy positions and strength
- Your strategic priorities based on your profile
${isAggressive ? '- As an aggressive player, prioritize attacking and weakening opponents' : ''}

Make your decision:`;
}

function processDecision(room: GameRoom, player: Player, decision: string) {
  // Update enemy relationships before processing decision
  scanNeighbors(room, player);

  const playerHexes = room.grid.filter((h) => h.owner === player.id);
  console.log(`[${player.name}] Processing decision: ${decision}`);

  if (decision.includes("expand")) {
    // Find a neutral hex adjacent to player's territory
    for (const hex of playerHexes) {
      const neighbors = getHexNeighbors(hex);
      for (const neighbor of neighbors) {
        const targetHex = room.grid.find(
          (h) => h.q === neighbor.q && h.r === neighbor.r
        );
        if (targetHex && !targetHex.owner) {
          targetHex.owner = player.id;
          player.territories++;
          player.resources += targetHex.resources;
          player.memory.push(`Expanded to (${targetHex.q}, ${targetHex.r})`);
          console.log(
            `${player.name} expands into (${targetHex.q}, ${targetHex.r})`
          );

          broadcast(room, {
            type: "update",
            grid: room.grid,
            players: room.players.map((p) => ({
              id: p.id,
              name: p.name,
              territories: p.territories,
              resources: p.resources,
              allies: p.allies,
              enemies: p.enemies,
            })),
            message: `${player.name} expanded their territory`,
          });
          return;
        }
      }
    }
    player.memory.push("Failed to expand - no valid adjacent targets");
  } else if (decision.includes("attack")) {
    console.log(`[${player.name}] Attempting attack...`);
    // Find an enemy hex adjacent to player's territory
    for (const hex of playerHexes) {
      const neighbors = getHexNeighbors(hex);
      for (const neighbor of neighbors) {
        const targetHex = room.grid.find(
          (h) => h.q === neighbor.q && h.r === neighbor.r
        );
        if (targetHex && targetHex.owner && targetHex.owner !== player.id) {
          console.log(
            `[${player.name}] Found target hex at (${targetHex.q}, ${targetHex.r}) owned by ${targetHex.owner}`
          );

          // Check if target is an ally
          const targetPlayer = room.players.find(
            (p) => p.id === targetHex.owner
          );
          if (targetPlayer && player.allies.includes(targetPlayer.id)) {
            console.log(
              `[${player.name}] Cannot attack ally ${targetPlayer.name}`
            );
            player.memory.push(
              `Cannot attack ally ${targetPlayer.name}'s territory`
            );
            return;
          }

          const enemy = room.players.find((p) => p.id === targetHex.owner);
          if (enemy) {
            console.log(
              `[${player.name}] Attack successful against ${enemy.name}`
            );

            // Remove territory from enemy's list
            enemy.territories--;
            enemy.resources -= targetHex.resources;

            // Add territory to attacker's list
            targetHex.owner = player.id;
            player.territories++;
            player.resources += targetHex.resources;

            // Update relationships
            if (!player.enemies.includes(enemy.id)) {
              player.enemies.push(enemy.id);
              enemy.enemies.push(player.id);
            }

            // Break any existing alliance
            const allyIndex = player.allies.indexOf(enemy.id);
            if (allyIndex !== -1) {
              player.allies.splice(allyIndex, 1);
              enemy.allies.splice(enemy.allies.indexOf(player.id), 1);
            }

            // Update memory
            player.memory.push(
              `Successfully attacked and captured (${targetHex.q}, ${targetHex.r}) from ${enemy.name}`
            );
            enemy.memory.push(
              `Lost territory at (${targetHex.q}, ${targetHex.r}) to ${player.name}`
            );

            // Broadcast the territory change
            broadcast(room, {
              message: `${player.name} captured territory from ${enemy.name} at (${targetHex.q}, ${targetHex.r})`,
              type: "update",
              grid: room.grid,
              players: room.players.map((p) => ({
                id: p.id,
                name: p.name,
                territories: p.territories,
                resources: p.resources,
                allies: p.allies,
                enemies: p.enemies,
              })),
            });
            return;
          }
        }
      }
    }
    console.log(`[${player.name}] No valid adjacent attack targets found`);
    player.memory.push("Failed to attack - no valid adjacent targets");
  } else if (decision.includes("ally")) {
    // Find a player to ally with
    const targetName = decision.match(/ally with (\w+)/i)?.[1];
    if (targetName) {
      const potentialAlly = room.players.find(
        (p) =>
          p.name.toLowerCase() === targetName.toLowerCase() &&
          p.id !== player.id
      );

      if (potentialAlly) {
        // Check if either player already has an ally
        if (player.allies.length > 0) {
          player.memory.push(`Cannot form alliance - you already have an ally`);
          return;
        }
        if (potentialAlly.allies.length > 0) {
          player.memory.push(
            `Cannot form alliance - ${potentialAlly.name} already has an ally`
          );
          return;
        }

        // Check if alliance is possible based on parameters
        if (
          player.allianceParams?.enabled &&
          potentialAlly.allianceParams?.enabled
        ) {
          if (
            player.allianceParams.giveMax >=
              potentialAlly.allianceParams.getMin &&
            potentialAlly.allianceParams.giveMax >= player.allianceParams.getMin
          ) {
            // Add players to each other's allies list
            player.allies.push(potentialAlly.id);
            potentialAlly.allies.push(player.id);

            // Remove from enemies list if they were enemies
            const enemyIndex = player.enemies.indexOf(potentialAlly.id);
            if (enemyIndex !== -1) {
              player.enemies.splice(enemyIndex, 1);
              potentialAlly.enemies.splice(
                potentialAlly.enemies.indexOf(player.id),
                1
              );
            }

            player.memory.push(`Formed alliance with ${potentialAlly.name}`);
            potentialAlly.memory.push(`Formed alliance with ${player.name}`);

            broadcast(room, {
              message: `${player.name} and ${potentialAlly.name} formed an alliance`,
              type: "update",
              grid: room.grid,
              players: room.players.map((p) => ({
                id: p.id,
                name: p.name,
                territories: p.territories,
                resources: p.resources,
                allies: p.allies,
                enemies: p.enemies,
              })),
            });
            return;
          } else {
            player.memory.push(
              `Could not form alliance with ${potentialAlly.name} - terms not acceptable`
            );
            return;
          }
        } else {
          player.memory.push(
            `Could not form alliance - alliances are disabled for one or both players`
          );
          return;
        }
      }
    }
    player.memory.push("Failed to form alliance - invalid target");
  } else if (decision.includes("peace")) {
    // Find a player to make peace with
    const targetCoords = decision.match(/\d+,\d+/);
    if (targetCoords) {
      const [q, r] = targetCoords[0].split(",").map(Number);
      const targetHex = room.grid.find((h) => h.q === q && h.r === r);
      if (targetHex && targetHex.owner && targetHex.owner !== player.id) {
        const targetPlayer = room.players.find((p) => p.id === targetHex.owner);
        if (targetPlayer) {
          const enemyIndex = player.enemies.indexOf(targetPlayer.id);
          if (enemyIndex !== -1) {
            player.enemies.splice(enemyIndex, 1);
            targetPlayer.enemies.splice(
              targetPlayer.enemies.indexOf(player.id),
              1
            );
            player.memory.push(`Made peace with ${targetPlayer.name}`);
            targetPlayer.memory.push(`Made peace with ${player.name}`);
            return;
          }
        }
      }
    }
    player.memory.push("Failed to make peace - invalid target");
  } else if (decision.includes("trade")) {
    // Find a player to trade with
    const targetCoords = decision.match(/\d+,\d+/);
    if (targetCoords) {
      const [q, r] = targetCoords[0].split(",").map(Number);
      const targetHex = room.grid.find((h) => h.q === q && h.r === r);
      if (targetHex && targetHex.owner && targetHex.owner !== player.id) {
        const targetPlayer = room.players.find((p) => p.id === targetHex.owner);
        if (targetPlayer) {
          player.memory.push(`Traded with ${targetPlayer.name}`);
          targetPlayer.memory.push(`Traded with ${player.name}`);
          return;
        }
      }
    }
    player.memory.push("Failed to trade - invalid target");
  } else {
    // Hold action
    player.memory.push("Held position");
  }
}

function countTerritories(room: GameRoom, player: Player): number {
  return room.grid.filter((h) => h.owner === player.name).length;
}

function scanNeighbors(
  room: GameRoom,
  player: Player
): {
  neutralNeighbors: string[];
  enemyNeighbors: string[];
} {
  const neutral = new Set<string>();
  const enemy = new Set<string>();

  // Get all hexes owned by the player
  const playerHexes = room.grid.filter((h) => h.owner === player.id);

  for (const hex of playerHexes) {
    // Get only adjacent hexes
    const neighbors = getHexNeighbors(hex);
    for (const neighbor of neighbors) {
      const targetHex = room.grid.find(
        (h) => h.q === neighbor.q && h.r === neighbor.r
      );
      if (targetHex) {
        if (!targetHex.owner) {
          neutral.add(`(${neighbor.q}, ${neighbor.r})`);
        } else if (targetHex.owner !== player.id) {
          const adjacentPlayer = room.players.find(
            (p) => p.id === targetHex.owner
          );
          if (adjacentPlayer && !player.allies.includes(adjacentPlayer.id)) {
            enemy.add(`(${neighbor.q}, ${neighbor.r})`);
          }
        }
      }
    }
  }

  return {
    neutralNeighbors: Array.from(neutral),
    enemyNeighbors: Array.from(enemy),
  };
}

httpServer.listen(4000, () => console.log("Server listening on port 4000"));
