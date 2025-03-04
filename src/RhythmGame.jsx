  import React, { useState, useEffect, useRef } from 'react';
import './RhythmGame.css';

const BEAT_INTERVAL = 3000; // Full grow-shrink cycle (3 seconds)
const HIT_TIME = 1500; // Peak of animation (small square fully grown)
const HIT_WINDOW = 100; // Acceptable hit margin (100ms before/after peak)

const RhythmGame = ({ players, onExit }) => {
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState(players.map(() => 0));

  const lastBeatTime = useRef(Date.now());
  const beatRef = useRef(null);
  const missTimeoutRef = useRef(null);
  const hasPressedRef = useRef(false); // Tracks if a key was pressed during the current beat

  useEffect(() => {
    startBeat();
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(beatRef.current);
      clearTimeout(missTimeoutRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const startBeat = () => {
    beatRef.current = setInterval(() => {
      // Do not clear the message here; we want it to persist from previous beats.
      lastBeatTime.current = Date.now();
      hasPressedRef.current = false;

      // Clear any existing miss timeout and start a new one for the full beat.
      clearTimeout(missTimeoutRef.current);
      missTimeoutRef.current = setTimeout(() => {
        if (!hasPressedRef.current) {
          setMessage('Miss');
        }
      }, BEAT_INTERVAL);
    }, BEAT_INTERVAL);
  };

  const handleKeyDown = () => {
    const now = Date.now();
    const timeSinceLastBeat = now - lastBeatTime.current;
    let scoreUpdate = 0;
    let feedback = 'Miss';

    if (Math.abs(timeSinceLastBeat - HIT_TIME) <= HIT_WINDOW) {
      scoreUpdate = 2;
      feedback = 'Perfect!';
    } else if (Math.abs(timeSinceLastBeat - HIT_TIME) <= HIT_WINDOW * 2) {
      scoreUpdate = 1;
      feedback = 'Good';
    }

    // Set the message based on key press timing.
    setMessage(feedback);
    setScores((prevScores) =>
      prevScores.map((score, i) => score + (i === 0 ? scoreUpdate : 0))
    );

    // Mark that a key has been pressed and cancel the miss timeout.
    hasPressedRef.current = true;
    clearTimeout(missTimeoutRef.current);
  };

  useEffect(() => {
    fetch("http://localhost:5001/users").then(r => r.json()).then(scores => setScores(_ => scores))

    return () => {
      clearInterval(beatRef.current);
      clearTimeout(missTimeoutRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="game-container">
      <h1 className="game-title">Play</h1>
      <div className="square-container">
        <div className="big-square">
          <div className="small-square"></div>
        </div>
      </div>
      <div className="game-message">{message}</div>
      <h2 className="score-title">Scores:</h2>
      <ul className="score-list">
        {scores.map(score => (
          <li key={score.username} className="score-item">
            {score.username}: {score.score}
          </li>
        ))}
      </ul>
      <button onClick={onExit} className="exit-button">
        Exit to Home
      </button>
    </div>
  );
};

export default RhythmGame;
