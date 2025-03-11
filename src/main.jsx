import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./pages/Menu/Menu.jsx";
import ModifierPage from "./pages/ModifierPage/ModifierPage.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import SpikeBallGame from "./components/SpikeBall/SpikeBallGame.jsx";
import ConnectionPopup from "./pages/ConnexionPopup/ConnectionPopup.jsx";
import CoinGame from "./components/Coin/CoinGame.jsx";
import "./pages/Menu/Menu.css";
import "./pages/RythmGame/RhythmGame.css";
import "./pages/ModifierPage/ModifierPage.css";
import Arrow from "./components/Arrow/arrow.jsx";
import ArrowGame from "./components/Arrow/ArrowGame.jsx";

const Games = {
  'Spike Ball': SpikeBallGame,
  'Coin Beat': RhythmGame
};

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSel, setGameSel] = useState(null);
  const [players, setPlayers] = useState([]);
  const [modifier, setModifier] = useState(null);
  const [modifierPage, setModifierPage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [wsInstance, setWsInstance] = useState(null);

  const SelectedGame = Games[gameSel];

  return (
    <StrictMode>
      <ArrowGame />
      {/* { <div className="container">
        {!gameStarted && !modifierPage && !showPopup ? (
          <Menu
            onStart={(selectedPlayers, ws) => {
              setPlayers(selectedPlayers);
              setWsInstance(ws);
              setGameSel(null);
              // For example, if 2 players are connected, show popup.
              if (selectedPlayers.length === 2) {
                setShowPopup(true);
              } else {
                setModifierPage(true);
              }
            }}
          />
        ) : !gameStarted && !gameSel ?
          <GameSel
            setGameSel={setGameSel}
          />
         : !gameStarted && gameSel && modifierPage ? (
          <ModifierPage
            onSelect={(selectedModifier) => {
              setModifier(selectedModifier);
              setGameStarted(true);
            }}
          />
        ) : gameStarted ? (
          <SelectedGame
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
      </div>} */}
    </StrictMode>
  );
}


createRoot(document.getElementById("root")).render(<Root />);
