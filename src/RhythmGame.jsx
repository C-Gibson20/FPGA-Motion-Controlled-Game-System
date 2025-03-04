  import React, { useState, useEffect, useRef } from 'react';
import './RhythmGame.css';

const DEFAULT_BEAT_INTERVAL = 3000;
const SPEED_UP_BEAT_INTERVAL = 2000;
const HIT_WINDOW = 100;

const RhythmGame = ({ players, modifier, onExit }) => {
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(players.map(() => 0));
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);

  const lastBeatTime = useRef(Date.now());
  const beatRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const hasPressedRef = useRef(false);

  // Determine beat interval using a switch statement
  let beatInterval;
  switch (modifier) {
    case 'speed-up':
      beatInterval = SPEED_UP_BEAT_INTERVAL;
      break;
    default:
      beatInterval = DEFAULT_BEAT_INTERVAL;
  }

  const hitTime = beatInterval / 2; // Compute dynamically

  // Update CSS variable for animation timing
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
  }, [beatInterval]); // Re-run if beatInterval changes

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

  const handleKeyDown = () => {
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

  const handleExit = () => {
    setShowFinalLeaderboard(true);
  };

  return (
    <div className="game-container">
      <h1 className="game-title">Play</h1>
      <div className="square-container">
        <div className="big-square">
          <div className="small-square"></div>
        </div>
      </div>
      <div className="game-message">{message}</div>

      {/* Leaderboard in top-right corner */}
      <div className="leaderboard">
        <h2>Leaderboard</h2>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={index}>
                <td>{player}</td>
                <td>{scores[index]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleExit} className="exit-button">
        Exit to Home
      </button>

      {/* Final Leaderboard Popup */}
      {showFinalLeaderboard && (
        <div className="final-leaderboard">
          <div className="popup">
            <h2>Final Leaderboard</h2>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr key={index}>
                    <td>{player}</td>
                    <td>{scores[index]}</td>
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