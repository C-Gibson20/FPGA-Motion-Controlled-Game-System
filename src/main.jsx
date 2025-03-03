import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./Menu.jsx";
import ModifierPage from "./ModifierPage.jsx";
import RhythmGame from "./RhythmGame.jsx";
import "./Menu.css";
import "./RhythmGame.css";
import "./ModifierPage.css";

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [modifier, setModifier] = useState(null);
  const [modifierPage, setModifierPage] = useState(false);

  return (
    <StrictMode>
      <div className="container">
        {!gameStarted && !modifierPage ? (
          <Menu onStart={(selectedPlayers) => {
            setPlayers(selectedPlayers);
            setModifierPage(true);
          }} />
        ) : !gameStarted && modifierPage ? (
          <ModifierPage onSelect={(selectedModifier) => {
            setModifier(selectedModifier);
            setGameStarted(true);
          }} />
        ) : (
          <RhythmGame players={players} modifier={modifier} onExit={() => {
            setGameStarted(false);
            setModifierPage(false);
          }} />
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
