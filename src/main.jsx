import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./Menu.jsx";
import ModifierPage from "./ModifierPage.jsx";
import RhythmGame from "./RhythmGame.jsx";
import ConnectionPopup from "./ConnectionPopup.jsx";
import "./Menu.css";
import "./RhythmGame.css";
import "./ModifierPage.css";

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [modifier, setModifier] = useState(null);
  const [modifierPage, setModifierPage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [bothPlayersConnected, setBothPlayersConnected] = useState(false);

  useEffect(() => {
    if (players.length === 2) {
      setShowPopup(true);
    }
  }, [players]);

  return (
    <StrictMode>
      <div className="container">
        {!gameStarted && !modifierPage && !showPopup ? (
          <Menu
            onStart={(selectedPlayers) => {
              setPlayers(selectedPlayers);
              if (selectedPlayers.length === 2) {
                setShowPopup(true);
              } else {
                setModifierPage(true);
              }
            }}
          />
        ) : !gameStarted && modifierPage ? (
          <ModifierPage
            onSelect={(selectedModifier) => {
              setModifier(selectedModifier);
              setGameStarted(true);
            }}
          />
        ) : gameStarted ? (
          <RhythmGame
            players={players}
            modifier={modifier}
            onExit={() => {
              setGameStarted(false);
              setModifierPage(false);
            }}
          />
        ) : null}

        {showPopup && (
          <ConnectionPopup
            onPlayersConnected={() => {
              setBothPlayersConnected(true);
            }}
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
