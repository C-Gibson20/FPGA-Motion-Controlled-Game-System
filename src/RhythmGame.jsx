import React, { useState, useEffect, useRef } from 'react';

const BEAT_INTERVAL = 800; // ms per beat (120 BPM)
const HIT_WINDOW = 150; // timing window in ms

const RhythmGame = () => {
  const [message, setMessage] = useState('');
  const beatRef = useRef(null);
  const lastBeatTime = useRef(Date.now());

  useEffect(() => {
    beatRef.current = setInterval(() => {
      lastBeatTime.current = Date.now();
      flashBeat();
    }, BEAT_INTERVAL);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(beatRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const flashBeat = () => {
    setMessage('Beat!');
    setTimeout(() => setMessage(''), 100);
  };

  const handleKeyDown = (event) => {
    const now = Date.now();
    const diff = Math.abs(now - lastBeatTime.current);

    if (diff <= HIT_WINDOW) {
      setMessage('Perfect!');
    } else if (diff <= HIT_WINDOW * 2) {
      setMessage('Good');
    } else {
      setMessage('Miss');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-6">Rhythm Game</h1>
      <div className="text-3xl">
        <div>Press any key on the beat!</div>
        {message}
      </div>
    </div>
  );
};

export default RhythmGame;
