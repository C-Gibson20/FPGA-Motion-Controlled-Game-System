import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./pages/Menu/Menu.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import "./pages/Menu/Menu.css";
import "./pages/RythmGame/RhythmGame.css";

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSel, setGameSel] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [wsInstance, setWsInstance] = useState(null);
  const [scores, setScores] = useState([]); // Global score state

  // When starting, initialize scores for each player.
  const handleStart = (selectedPlayers, ws) => {
    setPlayers(selectedPlayers);
    setWsInstance(ws);
    setScores(selectedPlayers.map(() => 0)); // Initialize scores for all players
    setGameSel(null);
    setShowPopup(true);
  };

  // Global score updater function.
  const updateScore = (playerIndex, points) => {
    setScores(prevScores => {
      const newScores = [...prevScores];
      newScores[playerIndex] += points;
      return newScores;
    });
  };

  return (
    <StrictMode>
      <div className="container">
        {!gameStarted && !showPopup ? (
          <Menu onStart={handleStart} />
        ) : !gameStarted && !gameSel ? (
          <GameSel
            scores={scores} // Pass scores to GameSel so they can be displayed
            players={players} // Pass player names too
            setGameSel={(selectedGame) => {
              setGameSel(selectedGame);
              setGameStarted(true); // Immediately start game when selected
            }}
            onExit={() => setShowPopup(true)}
          />
        ) : gameStarted ? (
          // Always render RhythmGame as the wrapper.
          <RhythmGame
            gameSel={gameSel}
            players={players}
            scores={scores} // Use the global scores here
            onScoreIncrement={updateScore} // Pass the updater
            ws={wsInstance}
            onExit={() => {
              setGameStarted(false);
              setGameSel(null);
            }}
          />
        ) : null}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
