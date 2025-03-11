import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Scene from '../MiniGames/Scene.jsx';
import SpikeBallGame from "../../components/SpikeBall/SpikeBallGame.jsx";
import CoinGame from "../../components/Coin/CoinGame.jsx";
import ArrowGame from "../../components/Arrow/ArrowGame.jsx";
import Scoreboard from './Scoreboard.jsx';
import "./RhythmGame.css";

const GAMES = {
  'Bullet Barrage': SpikeBallGame,
  'Coin Cascade': CoinGame,
  'Disco Dash': ArrowGame
};

const DEFAULT_BEAT_INTERVAL = 3000;
const SPEED_UP_BEAT_INTERVAL = 2000;
const HIT_WINDOW = 100;

const RhythmGame = ({ gameSel, players = [], modifier, ws, onExit }) => {
  // players is expected to be an array of names (e.g. ["Mario", "Waluigi"])
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(players.map(() => 0));
  const [data, setData] = useState([]);
  // fpgaControls: object keyed by player number (1-indexed)
  const [fpgaControls, setFpgaControls] = useState({});

  const lastBeatTime = useRef(Date.now());
  const beatRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const hasPressedRef = useRef(false);

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
            if (payload.button1 || payload.button2) {
              // Trigger a hit for the specified player (assumes payload.player is 1-indexed)
              triggerHit(payload.player - 1);
            } else {
              // Update FPGA controls for the specific player.
              setFpgaControls(prev => ({
                ...prev,
                [payload.player]: {
                  jump: payload.jump,
                  left: payload.left,
                  right: payload.right,
                  still: payload.still,
                }
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
        <Scene
          fpgaControls={fpgaControls}
          players={players.map((name, index) => ({
            username: name,
            score: scores[index] || 0
          }))}
          scores={scores}
          startPositions={[[0, 0, 0], [1, 0, 0]]}
          onCoinCollect={() => console.log("Coin collected callback")}
          localPlayerName={players[0]}
          ws={ws}
        />
      )}

      <button onClick={onExit} className="exit-button">✖</button>
    </div>
  );
};

export default RhythmGame;
