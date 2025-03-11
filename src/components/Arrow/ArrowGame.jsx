import React, { useEffect, useState, useRef } from "react";
import Arrow from "./Arrow.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../Player/PlayerMario.jsx";
import { Canvas } from "@react-three/fiber";
import "./Arrow.css";

// Includes space key for "Button"
const INPUT_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
const TARGET_X = 80;
const HIT_WINDOW = 20;
const ARROW_SPEED = 100;
const SPAWN_INTERVAL = 1000;
const INITIAL_ARROW_COUNT = 6;

const ArrowGame = () => {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [arrows, setArrows] = useState([]);
  const arrowsRef = useRef([]);
  const lastSpawnTime = useRef(performance.now());
  const feedbackTimeout = useRef(null);
  const arrowIdCounter = useRef(0);
  const inputLock = useRef(false);

  const [marioAnim, setMarioAnim] = useState({
    jumpLow: false,
    left: false,
    right: false,
    still: true,
  });

  const arrowLanes = {
    ArrowUp: 0,
    ArrowDown: 0,
    ArrowLeft: 0,
    ArrowRight: 0,
    " ": 0, // Space bar ("Button") shares same lane for now
  };

  useEffect(() => {
    const DISTANCE_PER_ARROW = (SPAWN_INTERVAL / 1000) * ARROW_SPEED;
    arrowsRef.current = Array.from({ length: INITIAL_ARROW_COUNT }).map((_, i) => {
      const key = INPUT_KEYS[Math.floor(Math.random() * INPUT_KEYS.length)];
      return {
        id: arrowIdCounter.current++,
        type: key,
        position: {
          x: window.innerWidth - i * DISTANCE_PER_ARROW,
          y: arrowLanes[key],
        },
        missed: false,
      };
    });
    setArrows([...arrowsRef.current]);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      arrowsRef.current = arrowsRef.current
        .map((arrow) => {
          const newX = arrow.position.x - ARROW_SPEED * delta;
          if (!arrow.missed && newX < TARGET_X - HIT_WINDOW) {
            showFeedback("Miss", "red");
            return { ...arrow, missed: true, position: { ...arrow.position, x: newX } };
          }
          return { ...arrow, position: { ...arrow.position, x: newX } };
        })
        .filter((arrow) => arrow.position.x > -100);

      while (now - lastSpawnTime.current >= SPAWN_INTERVAL) {
        const key = INPUT_KEYS[Math.floor(Math.random() * INPUT_KEYS.length)];
        arrowsRef.current.push({
          id: arrowIdCounter.current++,
          type: key,
          position: {
            x: window.innerWidth,
            y: arrowLanes[key],
          },
          missed: false,
        });
        lastSpawnTime.current += SPAWN_INTERVAL;
      }

      setArrows([...arrowsRef.current]);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationId(animationId);
  }, []);

  const showFeedback = (text, color) => {
    setFeedback({ text, color });
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 600);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const triggerMarioAnimation = async (type) => {
    inputLock.current = true;

    if (type === "ArrowLeft") {
      setMarioAnim({ jumpLow: false, left: true, right: false, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: false, right: true, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    } else if (type === "ArrowRight") {
      setMarioAnim({ jumpLow: false, left: false, right: true, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: true, right: false, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    } else if (type === "ArrowUp") {
      setMarioAnim({ jumpLow: true, left: false, right: false, still: false });
      await sleep(400);
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    } else {
      // No animation (e.g. for Button / Space bar)
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    }

    inputLock.current = false;
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      const key = e.key === " " ? " " : e.key;
      if (inputLock.current) return;

      const matchIndex = arrowsRef.current.findIndex(
        (arrow) =>
          arrow.type === key &&
          !arrow.missed &&
          Math.abs(arrow.position.x - TARGET_X) < HIT_WINDOW
      );

      if (matchIndex !== -1) {
        const arrow = arrowsRef.current[matchIndex];
        const distance = Math.abs(arrow.position.x - TARGET_X);

        if (distance < 10) {
          setScore((s) => s + 2);
          showFeedback("Perfect!", "lime");
        } else {
          setScore((s) => s + 1);
          showFeedback("Good!", "yellow");
        }

        arrowsRef.current.splice(matchIndex, 1);
        setArrows([...arrowsRef.current]);

        await triggerMarioAnimation(arrow.type);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="arrow-game-wrapper">
      <Scoreboard players={[{ username: "Player", score }]} />
      <div className="arrow-game-container">
        <div className="hit-line" style={{ left: `${TARGET_X}px` }} />
        {arrows.map((arrow) => (
          <Arrow key={arrow.id} type={arrow.type === " " ? "Button" : arrow.type} position={arrow.position} />
        ))}
      </div>

      {feedback && (
        <div className="hit-feedback" style={{ color: feedback.color }}>
          {feedback.text}
        </div>
      )}

      <Canvas
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
        }}
        camera={{ position: [0, 0, 10], fov: 10 }}
      >
        <ambientLight intensity={4} />
        <PlayerMario
          username="Player"
          initialPosition={[0, -0.7, 0]}
          isPlayerPlayer={false}
          playerRef={null}
          jumpLow={marioAnim.jumpLow}
          left={marioAnim.left}
          right={marioAnim.right}
          still={marioAnim.still}
        />
      </Canvas>
    </div>
  );
};

export default ArrowGame;
