import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Menu from './Menu.jsx';
import RhythmGame from './RhythmGame.jsx';
import './Menu.css';
import './RhythmGame.css';

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);

  return (
    <StrictMode>
      <div className="container">
        {!gameStarted ? (
          <Menu onStart={(selectedPlayers) => {
            setPlayers(selectedPlayers);
            setGameStarted(true);
          }} />
        ) : (
          <RhythmGame players={players} onExit={() => setGameStarted(false)} />
        )}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Root />);