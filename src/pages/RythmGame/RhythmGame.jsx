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

const DEFAULT_BEAT_INTERVAL = 3000;
const SPEED_UP_BEAT_INTERVAL = 2000;
const HIT_WINDOW = 100;

const RhythmGame = ({ gameSel, players = [], modifier, ws, onExit }) => {
  // players is expected to be an array of names, e.g. ["Mario", "Waluigi"]
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(players.map(() => 0));
  const [data, setData] = useState([]);
  // fpgaControls: object keyed by player number (1-indexed)
  const [fpgaControls, setFpgaControls] = useState({});

  const lastBeatTime = useRef(Date.now());
  const beatRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const hasPressedRef = useRef(false);

  // Set beat interval based on modifier.
  let beatInterval = modifier === 'speed-up' ? SPEED_UP_BEAT_INTERVAL : DEFAULT_BEAT_INTERVAL;
  const hitTime = beatInterval / 2;

  useEffect(() => {
    document.documentElement.style.setProperty('--beat-interval', `${beatInterval}ms`);
  }, [beatInterval]);

  useEffect(() => {
    startBeat();
    return () => {
      clearInterval(beatRef.current);
      clearTimeout(missTimeoutRef.current);
    };
  }, [beatInterval]);

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
            // If hit commands are sent, trigger hit.
            if (payload.button1 || payload.button2) {
              triggerHit(payload.player - 1);
            } else {
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
                  // Check: is this intended to also be a jump, or should it be a different control?
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
          }
        } catch (err) {
          console.error("Error parsing message:", err);
        }
      };
      ws.addEventListener("message", messageHandler);
      return () => ws.removeEventListener("message", messageHandler);
    }
  }, [ws]);
  
  

  const startBeat = () => {
    beatRef.current = setInterval(() => {
      lastBeatTime.current = Date.now();
      hasPressedRef.current = false;
      clearTimeout(missTimeoutRef.current);
      missTimeoutRef.current = setTimeout(() => {
        if (!hasPressedRef.current) {
          setMessage('Miss');
        }
      }, beatInterval);
    }, beatInterval);
  };

  const triggerHit = (playerIndex) => {
    console.log("triggerHit called for player", playerIndex);
    const now = Date.now();
    const timeSinceLastBeat = now - lastBeatTime.current;
    let scoreUpdate = 0;
    let feedback = 'Miss';

    if (Math.abs(timeSinceLastBeat - hitTime) <= HIT_WINDOW) {
      scoreUpdate = 2;
      feedback = 'Perfect!';
    } else if (Math.abs(timeSinceLastBeat - hitTime) <= HIT_WINDOW * 2) {
      scoreUpdate = 1;
      feedback = 'Good';
    }

    setMessage(feedback);
    setScores(prevScores =>
      prevScores.map((score, i) => (i === playerIndex ? score + scoreUpdate : score))
    );
    hasPressedRef.current = true;
    clearTimeout(missTimeoutRef.current);
  };

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
