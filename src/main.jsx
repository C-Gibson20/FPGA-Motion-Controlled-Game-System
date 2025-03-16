// Root.jsx

import React, { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Menu from "./pages/Menu/Menu.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";

function Root() {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'gameSelection', 'playing'
  const [selectedGame, setSelectedGame] = useState('');
  const [players, setPlayers] = useState([]);
  const [scores, setScores] = useState([]);
  const [wsInstance, setWsInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Centralized WebSocket setup function that sends the init message
  function setupWebSocket(initData) {
    const socket = new WebSocket("ws://13.61.26.147:8765");
    
    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      if (initData) {
        socket.send(JSON.stringify(initData));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 WS message received:", data);

        // Accept both types to update the players list
        if (data.type === "player_connected" || data.type === "react_player_connected") {
          console.log(`Player connected: ${data.name}`);
          setPlayers(prev => [...prev, data.name]);
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
      setIsConnected(false);
    };

    return socket;
  }

  // Called by the Menu component to initiate connection with the desired player configuration
  const handleInitiateConnection = (numPlayers, playerNames) => {
    const initMessage = {
      type: "init",
      numPlayers: numPlayers,
      names: playerNames,
    };
    const socket = setupWebSocket(initMessage);
    setWsInstance(socket);
  };

  // Handle game selection from the GameSel component
  const handleGameSelect = (selectedGameName) => {
    console.log("🎮 Game selected:", selectedGameName);
    setSelectedGame(selectedGameName);
    setGameState('playing');
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      console.log("📤 Sending game selection message to server");
      wsInstance.send(JSON.stringify({
        type: "game_selection",
        mode: selectedGameName,
      }));
    }
  };

  // Exit handler for the GameSel page (returns to the menu)
  const handleExit = () => {
    setGameState('menu');
    setPlayers([]);
    setIsConnected(false);
    if (wsInstance) {
      wsInstance.close();
      setWsInstance(null);
    }
  };

  // Exit handler for minigames (returns to game selection)
  const handleMinigameExit = () => {
    setGameState('gameSelection');
    // Optionally reset minigame-specific states if needed
  };

  return (
    <StrictMode>
      <div className="container">
        {gameState === 'menu' && (
          <Menu 
            onStart={() => setGameState('gameSelection')}
            onInitiateConnection={handleInitiateConnection}
            isConnected={isConnected}
            players={players}
          />
        )}
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
            onExit={handleMinigameExit}
          />
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
