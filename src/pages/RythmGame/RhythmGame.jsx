import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SpikeBallGame from "../../components/SpikeBall/SpikeBallGame.jsx";
import CoinGame from "../../components/Coin/CoinGame.jsx";
import ArrowGame from "../../components/Arrow/ArrowGame.jsx";
import Scoreboard from './Scoreboard.jsx';
import "./RhythmGame.css";

// The keys in GAMES must exactly match the names set in GameSel.
const GAMES = {
  'Bullet Barrage': SpikeBallGame,
  'Coin Cascade': CoinGame,
  'Disco Dash': ArrowGame
};

const RhythmGame = ({ gameSel, players = [], modifier, ws, onExit }) => {
  // players is expected to be an array of names, e.g. ["Mario", "Waluigi"]
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(players.map(() => 0));
  const [data, setData] = useState([]);
  // fpgaControls: object keyed by player number (1-indexed)
  const [fpgaControls, setFpgaControls] = useState({});

  useEffect(() => {
    axios.get('http://localhost:5001/scores')
      .then(response => setData(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  useEffect(() => {
    if (ws) {
      const messageHandler = (event) => {
        console.log("RhythmGame received message:", event.data);
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'data') {             
            // Convert the payload.data value into control booleans.
            const controls = { jump: false, left: false, right: false, still: false };
            switch (payload.data) {
              case 'J':
                controls.jump = true;
                break;
              case 'L':
                controls.left = true;
                break;
              case 'R':
                controls.right = true;
                break;
              case 'N':
                controls.still = true;
                break;
              case 'B1':
                controls.jump = true;
                break;
              default:
                break;
            }
            // Update fpgaControls for the given player (assumed 1-indexed)
            setFpgaControls(prev => ({
              ...prev,
              [payload.player]: controls
            }));
          
          }
        } catch (err) {
          console.error("Error parsing message:", err);
        }
      };
      ws.addEventListener("message", messageHandler);
      return () => ws.removeEventListener("message", messageHandler);
    }
  }, [ws]);

  const SelectedGame = GAMES[gameSel];

  return (
    <div className="game-container">
      {/* Render one Scoreboard for both players */}
      <Scoreboard players={players.map((name, index) => ({
        username: name,
        score: scores[index] || 0
      }))} />
      
      {SelectedGame ? (
        <SelectedGame
          players={players}
          scores={scores}
          fpgaControls={fpgaControls}
          onCoinCollect={() => console.log("Coin collected callback")}
          localPlayerName={players[0]}
          ws={ws}
        />
      ) : (
        // If no game is selected, display an error or a fallback screen.
        <div style={{ color: "white", textAlign: "center", marginTop: "20px" }}>
          No game selected.
        </div>
      )}

      <button onClick={onExit} className="exit-button">✖</button>
    </div>
  );
};

export default RhythmGame;
