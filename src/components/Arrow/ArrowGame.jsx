import React, { useEffect, useState, useRef } from "react";
import Arrow from "./Arrow.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import "./Arrow.css";

const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const TARGET_X = 80;
const HIT_WINDOW = 20;

const ArrowGame = () => {
  const [arrows, setArrows] = useState([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimeout = useRef(null);
  const containerRef = useRef();

  const arrowLanes = {
    ArrowUp: 0,
    ArrowDown: 0,
    ArrowLeft: 0,
    ArrowRight: 0,
  };

  useEffect(() => {
    const ARROW_SPEED = 5;        // pixels per tick
    const TICK_INTERVAL = 50;     // ms
    const SPAWN_INTERVAL = 1000;  // ms
    const DISTANCE_PER_SECOND = (SPAWN_INTERVAL / TICK_INTERVAL) * ARROW_SPEED; // 100px

    // Preload arrows with correct spacing
    const initialArrows = Array.from({ length: 10 }).map((_, i) => {
      const randomKey = ARROW_KEYS[Math.floor(Math.random() * ARROW_KEYS.length)];
      return {
        id: Date.now() + i,
        type: randomKey,
        position: {
          x: window.innerWidth - i * DISTANCE_PER_SECOND,
          y: arrowLanes[randomKey],
        },
        missed: false,
      };
    });

    setArrows(initialArrows);

    // Regular arrow spawn interval
    const spawnInterval = setInterval(() => {
      const randomKey = ARROW_KEYS[Math.floor(Math.random() * ARROW_KEYS.length)];
      setArrows((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: randomKey,
          position: {
            x: window.innerWidth,
            y: arrowLanes[randomKey],
          },
          missed: false,
        },
      ]);
    }, SPAWN_INTERVAL);

    return () => clearInterval(spawnInterval);
  }, []);

  // Move arrows and detect misses
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setArrows((prev) =>
        prev
          .map((arrow) => {
            const newX = arrow.position.x - 5;
            if (!arrow.missed && newX < TARGET_X - HIT_WINDOW) {
              showFeedback("Miss", "red");
              return {
                ...arrow,
                missed: true,
                position: { ...arrow.position, x: newX },
              };
            }
            return {
              ...arrow,
              position: { ...arrow.position, x: newX },
            };
          })
          .filter((arrow) => arrow.position.x > -100)
      );
    }, 50);

    return () => clearInterval(moveInterval);
  }, []);

  // Handle key input for arrow hits
  useEffect(() => {
    const handleKeyDown = (e) => {
      const matchIndex = arrows.findIndex(
        (arrow) =>
          arrow.type === e.key &&
          !arrow.missed &&
          Math.abs(arrow.position.x - TARGET_X) < HIT_WINDOW
      );

      if (matchIndex !== -1) {
        const arrowX = arrows[matchIndex].position.x;
        const distance = Math.abs(arrowX - TARGET_X);

        if (distance < 10) {
          setScore((prev) => prev + 2);
          showFeedback("Perfect!", "lime");
        } else {
          setScore((prev) => prev + 1);
          showFeedback("Good!", "yellow");
        }

        setArrows((prev) => prev.filter((_, i) => i !== matchIndex));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [arrows]);

  // Ensure window focus for key input
  useEffect(() => {
    window.focus();
  }, []);

  const showFeedback = (text, color) => {
    setFeedback({ text, color });
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 600);
  };

  return (
    <div className="arrow-game-wrapper">
      <Scoreboard players={[{ username: "Player", score }]} />
      <div ref={containerRef} className="arrow-game-container">
        <div className="hit-line" style={{ left: `${TARGET_X}px` }} />
        {arrows.map((arrow) => (
          <Arrow key={arrow.id} type={arrow.type} position={arrow.position} />
        ))}
      </div>

      {feedback && (
        <div className="hit-feedback" style={{ color: feedback.color }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
};

export default ArrowGame;
