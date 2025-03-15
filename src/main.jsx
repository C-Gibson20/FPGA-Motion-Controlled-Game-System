import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./pages/Menu/Menu.css";
import "./pages/RythmGame/RhythmGame.css";

import Menu from "./pages/Menu/Menu.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import Scoreboard from "./pages/RythmGame/Scoreboard.jsx";

// --- WebSocket Setup Function ---
function setupWebSocket({ onStartGame, setPlayers }) {
  const socket = new WebSocket("ws://13.61.26.147:8765");

  socket.onopen = () => {
    console.log("✅ WebSocket connected");

    // Send the 'init' message to inform the server about the FPGA connection.
    socket.send(
      JSON.stringify({
        type: "init",
        numPlayers: 1, // You can set the actual number of players based on the FPGA connections
        names: ["FPGA Player"], // Use a placeholder name, it could be adjusted based on the FPGA connection
      })
    );
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📩 WS message received:", data);

      if (data.type === "startGame") {
        onStartGame(data.mode);
      } else if (data.type === "player_connected") {
        // Handle player connected (you might get an update when the FPGA is recognized)
        console.log(`Player connected: ${data.name}`);
        setPlayers((prev) => [...prev, data.name]);
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

// --- Root Component ---
function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSel, setGameSel] = useState(null); // No dev shortcut: Start on the menu screen
  const [players, setPlayers] = useState([]); // Empty until fetched from WebSocket
  const [scores, setScores] = useState([]);
  const [wsInstance, setWsInstance] = useState(null);

  const handleStartGame = (mode) => {
    setGameSel(mode);
    setGameStarted(true);
  };

  // WebSocket setup once on mount
  useEffect(() => {
    const socket = setupWebSocket({
      onStartGame: handleStartGame,
      setPlayers,
    });

    setWsInstance(socket);

    return () => {
      socket.close();
    };
  }, []);

  // Global score updater
  const updateScore = (playerIndex, points) => {
    setScores((prevScores) => {
      const newScores = [...prevScores];
      newScores[playerIndex] = (prevScores[playerIndex] || 0) + points;
      console.log(`⬆️ Updated Player ${playerIndex + 1} score: ${newScores[playerIndex]}`);
      return newScores;
    });
  };

  const handleGameSelect = (selectedGame) => {
    console.log("🎮 Game selected:", selectedGame);
    setGameSel(selectedGame);
    setGameStarted(true);

    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(
        JSON.stringify({
          type: "game_selection",
          mode: selectedGame,
        })
      );
    }
  };

  const handleExit = () => {
    setGameStarted(false);
    setGameSel(null); // Reset to show the menu page
  };

  const showScoreboard = (gameSel && !gameStarted) || gameStarted;
  const isGameSelection = !gameStarted && gameSel;
  const isInGame = gameStarted;

  const scoreboardData = players.map((name, index) => ({
    username: name,
    score: scores[index] || 0,
    avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
  }));

  return (
    <StrictMode>
      <div className="container">
        {showScoreboard && <Scoreboard players={scoreboardData} />}

        {isGameSelection ? (
          <GameSel
            scores={scores}
            players={players}
            setGameSel={handleGameSelect}
            onExit={() => setGameSel(null)}
          />
        ) : isInGame ? (
          <RhythmGame
            gameSel={gameSel}
            players={players}
            scores={scores}
            ws={wsInstance}
            onScoreIncrement={updateScore}
            onExit={handleExit}
          />
        ) : (
          <Menu />
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
