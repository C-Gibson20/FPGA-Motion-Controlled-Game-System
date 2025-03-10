import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./Menu.jsx";
import ModifierPage from "./ModifierPage.jsx";
import RhythmGame from "./RhythmGame.jsx";
import Minigame2 from "./Minigame2.jsx";
import ConnectionPopup from "./ConnectionPopup.jsx";
import CoinGame  from "./CoinGame.jsx";
import "./Menu.css";
import "./RhythmGame.css";
import "./ModifierPage.css";

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [modifier, setModifier] = useState(null);
  const [modifierPage, setModifierPage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [wsInstance, setWsInstance] = useState(null);

  return (
    <StrictMode>
      {/* <CoinGame/> */}
      <Minigame2  
            players={players}
            modifier={modifier}
            ws={wsInstance}  // pass the same ws instance
            onExit={() => {
              setGameStarted(false);
              setModifierPage(false);
            }}
          />

          {/* <RhythmGame
            players={players}
            modifier={modifier}
            ws={wsInstance}  // pass the same ws instance
            onExit={() => {
              setGameStarted(false);
              setModifierPage(false);
            }}
          /> */}
      {/* <div className="container">
        {!gameStarted && !modifierPage && !showPopup ? (
          <Menu
            onStart={(selectedPlayers, ws) => {
              setPlayers(selectedPlayers);
              setWsInstance(ws);
              // For example, if 2 players are connected, show popup.
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
            ws={wsInstance}  // pass the same ws instance
            onExit={() => {
              setGameStarted(false);
              setModifierPage(false);
            }}
          />
        ) : null}

        {showPopup && (
          <ConnectionPopup
            onPlayersConnected={() => {
              // ...
            }}
            onClose={() => {
              setShowPopup(false);
              setModifierPage(true);
            }}
          />
        )}
      </div> */}
    </StrictMode>
  );
}


createRoot(document.getElementById("root")).render(<Root />);
