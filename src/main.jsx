import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./pages/Menu/Menu.jsx";
import ModifierPage from "./pages/ModifierPage/ModifierPage.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import "./pages/Menu/Menu.css";
import "./pages/RythmGame/RhythmGame.css";
import "./pages/ModifierPage/ModifierPage.css";
import SpikeBallGame from "./components/SpikeBall/SpikeBallGame.jsx";
import CoinGame from "./components/Coin/CoinGame.jsx";
import ArrowGame from "./components/Arrow/ArrowGame.jsx";

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSel, setGameSel] = useState(null);
  const [players, setPlayers] = useState([]);
  const [modifier, setModifier] = useState(null);
  const [modifierPage, setModifierPage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [wsInstance, setWsInstance] = useState(null);

  return (
    <StrictMode>
      <div className="container">
        {!gameStarted && !modifierPage && !showPopup ? (
          <Menu
            onStart={(selectedPlayers, ws) => {
              setPlayers(selectedPlayers);
              setWsInstance(ws);
              setGameSel(null);
              // For multiplayer, show the connection popup; otherwise, go directly to modifier.
              setShowPopup(true);
              setModifierPage(true);
            }}
          />
        ) : !gameStarted && !gameSel ? (
          <GameSel setGameSel={setGameSel} onExit={() => {
            setModifierPage(false)
            setShowPopup(false)
          }} />
        ) : !gameStarted && gameSel && modifierPage ? (
          <ModifierPage
            onSelect={(selectedModifier) => {
              setModifier(selectedModifier);
              setGameStarted(true);
            }}
          />
        ) : gameStarted ? (
          // Always render RhythmGame as the wrapper
          <RhythmGame
            gameSel={gameSel}
            players={players}
            modifier={modifier}
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
