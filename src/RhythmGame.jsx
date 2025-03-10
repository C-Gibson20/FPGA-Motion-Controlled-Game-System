import React, { useState, useEffect, useRef } from 'react';
import './RhythmGame.css';
import axios from 'axios';
import Scene from './Scene.jsx';

const DEFAULT_BEAT_INTERVAL = 3000;
const SPEED_UP_BEAT_INTERVAL = 2000;
const HIT_WINDOW = 100;

const RhythmGame = ({ players, modifier, ws, onExit }) => {
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(players.map(() => 0));
  const [data, setData] = useState([]);
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);

  const lastBeatTime = useRef(Date.now());
  const beatRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const hasPressedRef = useRef(false);

  // Commands from the fpga
  const [jumpLow, setJumpLow] = useState(false);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);
  const [still, setStill] = useState(false);

  let beatInterval;
  switch (modifier) {
    case 'speed-up':
      beatInterval = SPEED_UP_BEAT_INTERVAL;
      break;
    default:
      beatInterval = DEFAULT_BEAT_INTERVAL;
  }

  const handleKeyDown = (e) => {
    if (keys.current[e.key] !== undefined) {
      keys.current[e.key] = true;
    }
  };

  const hitTime = beatInterval / 2;

  useEffect(() => {
    document.documentElement.style.setProperty('--beat-interval', `${beatInterval}ms`);
  }, [beatInterval]);

  useEffect(() => {
    startBeat();
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(beatRef.current);
      clearTimeout(missTimeoutRef.current);
      window.removeEventListener('keydown', handleKeyDown);
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
            if (payload.button) {
              triggerHit();
            } else if (payload.jump) {
              setJumpLow(true);
              setTimeout(() => setJumpLow(false), 500);
            } else if (payload.left) {
              setLeft(true);
              setRight(false);
              setStill(false);
            } else if (payload.right) {
              setRight(true);
              setLeft(false);
              setStill(false);
            } else if (payload.still) {
              setStill(true);
              setLeft(false);
              setRight(false);
            }
          }
        } catch (err) {
          console.error("Error parsing message:", err);
        }
      };

      ws.addEventListener("message", messageHandler);

      return () => {
        ws.removeEventListener("message", messageHandler);
      };
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

  const triggerHit = () => {
    console.log("triggerHit called");
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
      prevScores.map((score, i) => score + (i === 0 ? scoreUpdate : 0))
    );

    hasPressedRef.current = true;
    clearTimeout(missTimeoutRef.current);
  };

// <div className="game-message">{message}</div>
//       <h2 className="score-title">Scores:</h2>
//       <ul className="score-list">
//         {players.map((player, index) => (
//           <li key={index} className="score-item">
//             {player}: {scores[index]}
//           </li>
//         ))}
            // </ul>

  return (
    <div className="game-container">
            <Scene jumpLow={jumpLow} left={left} right={right} still={still} />
      <button onClick={onExit} className="exit-button">
        Exit to Home
      </button>
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
    </div>
  );
};

export default RhythmGame;
