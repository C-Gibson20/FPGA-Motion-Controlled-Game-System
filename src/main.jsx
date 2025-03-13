import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./pages/Menu/Menu.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import "./pages/Menu/Menu.css";
import "./pages/RythmGame/RhythmGame.css";
import SpikeBallGame from "./components/SpikeBall/SpikeBallGame.jsx";
import CoinGame from "./components/Coin/CoinGame.jsx";
import ArrowGame from "./components/Arrow/ArrowGame.jsx";

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSel, setGameSel] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [wsInstance, setWsInstance] = useState(null);

  return (
    <StrictMode>
      <div className="container">
        {!gameStarted && !showPopup ? (
          <Menu
            onStart={(selectedPlayers, ws) => {
              setPlayers(selectedPlayers);
              setWsInstance(ws);
              setGameSel(null);
              // For multiplayer, show the connection popup; otherwise, go directly to gamesel.
              setShowPopup(true);
            }}
          />
        ) : !gameStarted && !gameSel ? (
          <GameSel
            setGameSel={(selectedGame) => {
              setGameSel(selectedGame);
              setGameStarted(true); // Immediately start game when selected
            }}
            onExit={() => setShowMenu(true)}
          />
        ) : gameStarted ? (
          // Always render RhythmGame as the wrapper
          <RhythmGame
            gameSel={gameSel}
            players={players}
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
