// Root.jsx

import React, { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Menu from "./pages/Menu/Menu.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import Scoreboard from "./pages/RythmGame/Scoreboard.jsx";

function Root() {
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("menu"); // 'menu', 'gameSelection', 'playing'
  const [selectedGame, setSelectedGame] = useState("");
  const [scores, setScores] = useState([]);
  const [wsInstance, setWsInstance] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameVotes, setGameVotes] = useState({});
  
  const updateScore = (playerIndex, points) => {
    setScores((prevScores) => {
      const newScores = [...prevScores];
      newScores[playerIndex] = (prevScores[playerIndex] || 0) + points;
      return newScores;
    });
  };

  function setupWebSocket(initData) {
    const socket = new WebSocket("ws://13.61.26.147:8765");

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      if (initData) {
        socket.send(JSON.stringify(initData));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS message received:", data);

        if (data.type === "player_connected") {
          console.log(`Player connected: ${data.name}`);
          setPlayers((prev) => [
            ...prev,
            {
              id: data.player || prev.length + 1,
              name: data.name,
              address: data.address || "",
            },
          ]);
        } else if (data.type === "all_connected") {
          console.log("All players are connected!");
          setGameState("gameSelection");
        } else if (data.type === "game_selection_error") {
          alert(data.message);
        }
        
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    socket.onclose = () => {
      console.warn("WebSocket disconnected");
      setIsConnected(false);
    };

    return socket;
  }

  const handleInitiateConnection = (numPlayers, playerNames) => {
    const initMessage = {
      type: "init",
      numPlayers: numPlayers,
      names: playerNames,
    };
    const socket = setupWebSocket(initMessage);
    setWsInstance(socket);
  };

  const handleGameSelect = (selectedGameName) => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      console.log("Sending game selection message to server");
      wsInstance.send(
        JSON.stringify({
          type: "game_selection",
          player: players[0].id,
          mode: selectedGameName,
        })
      );
    }
    console.log("Game selected:", selectedGameName);
    setSelectedGame(selectedGameName);
    setGameState("playing");
    
  };

  const handleExit = () => {
    setGameState("menu");
    setPlayers([]);
    setIsConnected(false);
    if (wsInstance) {
      wsInstance.close();
      setWsInstance(null);
    }
  };

  const handleMinigameExit = () => {
    setGameState("gameSelection");
  };

  const showScoreboard = (gameState === "playing" || gameState === "gameSelection") && scores.length > 0;

  const scoreboardData = players.map((player, index) => ({
    username: player.name,
    score: scores[index] || 0,
    avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
  }));


  return (
    <StrictMode>
      <div className="container">
        {showScoreboard && <Scoreboard players={scoreboardData} />}

        {gameState === "menu" && (
          <Menu
            onStart={() => setGameState("gameSelection")}
            onInitiateConnection={handleInitiateConnection}
            isConnected={isConnected}
            players={players}
          />
        )}
        {gameState === "gameSelection" && (
          <GameSel players={players} setGameSel={handleGameSelect} onExit={handleExit} />
        )}
        {gameState === "playing" && (
          <RhythmGame
            gameSel={selectedGame}
            players={players}
            scores={scores}
            onScoreIncrement={updateScore}
            ws={wsInstance}
            onExit={handleMinigameExit}
          />
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
