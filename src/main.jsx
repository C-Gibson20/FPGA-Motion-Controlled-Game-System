import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./pages/Menu/Menu.jsx";
import ModifierPage from "./pages/ModifierPage/ModifierPage.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import ConnectionPopup from "./pages/ConnexionPopup/ConnectionPopup.jsx";
import "./pages/Menu/Menu.css";
import "./pages/RythmGame/RhythmGame.css";
import "./pages/ModifierPage/ModifierPage.css";

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
              if (selectedPlayers.length === 2) {
                setShowPopup(true);
              } else {
                setModifierPage(true);
              }
            }}
          />
        ) : !gameStarted && !gameSel ? (
          <GameSel setGameSel={setGameSel} />
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
              setModifierPage(false);
            }}
          />
        ) : null}

        {showPopup && (
          <ConnectionPopup
            onPlayersConnected={() => {}}
            onClose={() => {
              setShowPopup(false);
              setModifierPage(true);
            }}
          />
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
