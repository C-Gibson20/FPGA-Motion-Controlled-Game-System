import React, { useState, useEffect, useRef } from 'react';
import './RhythmGame.css';
import axios from 'axios';
import Scene from '../MiniGames/Scene.jsx';

const DEFAULT_BEAT_INTERVAL = 3000;
const SPEED_UP_BEAT_INTERVAL = 2000;
const HIT_WINDOW = 100;

const RhythmGame = ({ players, modifier, ws, onExit }) => {
  // players is an array of names, e.g. ["Mario", "Waluigi"]
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(players.map(() => 0));
  const [data, setData] = useState([]);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);

  // Refs for beat timing and miss handling
  const lastBeatTime = useRef(Date.now());
  const beatRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const hasPressedRef = useRef(false);

  // (Optional) Keyboard keys – useful for testing.
  const keys = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    " ": false,
  });

  // Instead of global FPGA flags, store per-player controls.
  // We'll assume players are numbered 1 and 2.
  const [fpgaControls, setFpgaControls] = useState({});

  // Determine beat interval based on modifier.
  let beatInterval;
  switch (modifier) {
    case 'speed-up':
      beatInterval = SPEED_UP_BEAT_INTERVAL;
      break;
    default:
      beatInterval = DEFAULT_BEAT_INTERVAL;
  }
  const hitTime = beatInterval / 2;

  // Set CSS custom property for beat interval.
  useEffect(() => {
    document.documentElement.style.setProperty('--beat-interval', `${beatInterval}ms`);
  }, [beatInterval]);

  // Start the beat timer and add a key listener.
  useEffect(() => {
    startBeat();
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(beatRef.current);
      clearTimeout(missTimeoutRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [beatInterval]);

  // Fetch leaderboard data (scores) from server.
  useEffect(() => {
    axios.get('http://localhost:5001/scores')
      .then(response => setData(response.data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  // Handle incoming WebSocket messages.
  useEffect(() => {
    if (ws) {
      const messageHandler = (event) => {
        console.log("RhythmGame received message:", event.data);
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'data') {
            // Check for hit commands (using button1 or button2).
            if (payload.button1 || payload.button2) {
              // Trigger a hit for the specified player (player numbers are assumed to be 1-indexed).
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

  // Optional keydown handler (for testing).
  const handleKeyDown = (e) => {
    if (keys.current[e.key] !== undefined) {
      keys.current[e.key] = true;
    }
  };

  // Beat timer: resets the beat and sets a timeout for a miss.
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

  // Trigger a hit for the specified player index (0 for first player, 1 for second).
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
    setScores((prevScores) =>
      prevScores.map((score, i) => (i === playerIndex ? score + scoreUpdate : score))
    );

    hasPressedRef.current = true;
    clearTimeout(missTimeoutRef.current);
  };

  return (
    <div className="game-container">
      {/* Pass in individual FPGA controls and players to Scene */}
      <Scene
        fpgaControls={fpgaControls}
        players={players.map((name, index) => ({
          username: name,
          score: scores[index] || 0,
          // Define default model: first player is Mario, second is Waluigi.
          model: index === 0 ? "MarioIdle" : "WaluigiIdle",
        }))}
        scores={scores}
        startPositions={[[0, 0, 0], [1, 0, 0]]} // Ensure at least two start positions.
        onCoinCollect={() => console.log("Coin collected callback")}
        localPlayerName={players[0]} // Local keyboard control for the first player.
      />

      <button onClick={onExit} className="exit-button">✖</button>
      {showFinalLeaderboard && (
        <div className="final-leaderboard">
          <div className="popup">
            <h2>Final Leaderboard</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{entry.username}</td>
                    <td>{entry.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={onExit}>Return to Menu</button>
          </div>
        </div>
      )}
      <div className="game-message">{message}</div>
    </div>
  );
};

export default RhythmGame;
