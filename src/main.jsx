// Root.jsx

import React, { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Menu from "./pages/Menu/Menu.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import Scoreboard from "./pages/RythmGame/Scoreboard.jsx";

// --- Root Component ---
function Root() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'gameSelection', 'playing'
  const [selectedGame, setSelectedGame] = useState('');
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState([]);
  const [wsInstance, setWsInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket setup function
  function setupWebSocket() {
    const socket = new WebSocket("ws://13.61.26.147:8765");
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      socket.send(
        JSON.stringify({
          type: "init",
          numPlayers: 1,
          names: ["FPGA Player"],
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 WS message received:", data);

        if (data.type === "player_connected") {
          console.log(`Player connected: ${data.name}`);
          setPlayers((prev) => [...prev, data.name]);
        } else if (data.type === "all_connected") {
          console.log("All players are connected!");
          setIsConnected(true);
          setGameState('gameSelection');
        }
      } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err);
      }
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket disconnected");
    };

    return socket;
  }

  // Function to handle game selection from GameSel page
  const handleGameSelect = (selectedGameName) => {
    console.log("🎮 Game selected:", selectedGameName);
    setSelectedGame(selectedGameName);
    setGameState('playing');
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(
        JSON.stringify({
          type: "game_selection",
          mode: selectedGameName,
        })
      );
    }
  };

  // Exit handler for GameSel page (returns to the menu)
  const handleExit = () => {
    setGameState('menu');
    setPlayers([]);
    setIsConnected(false);
  };

  // NEW: Exit handler for minigames (returns to the game selection page)
  const handleMinigameExit = () => {
    setGameState('gameSelection');
    // Optionally reset minigame-specific states if needed
  };

  useEffect(() => {
    const socket = setupWebSocket();
    setWsInstance(socket);

    return () => {
      socket.close();
    };
  }, []);

  return (
    <StrictMode>
      <div className="container">
        {gameState === 'menu' && <Menu onStart={() => setGameState('gameSelection')} />}
        {gameState === 'gameSelection' && (
          <GameSel
            players={players}
            setGameSel={handleGameSelect}
            onExit={handleExit}
          />
        )}
        {gameState === 'playing' && (
          <RhythmGame
            gameSel={selectedGame}
            players={players}
            scores={scores}
            ws={wsInstance}
            onExit={handleMinigameExit} // Use the new minigame exit handler here
          />
        )}
      </div>
    </StrictMode>
  );
}



createRoot(document.getElementById("root")).render(<Root />);
