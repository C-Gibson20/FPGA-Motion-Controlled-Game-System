import React, { useEffect, useState, useRef } from "react";
import Arrow from "./Arrow.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../Player/PlayerMario.jsx";
import { Canvas, useThree } from "@react-three/fiber";
import "./Arrow.css";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import * as THREE from "three";

// Constants
const INPUT_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
const TARGET_X = 80;
const HIT_WINDOW = 40;
const ARROW_SPEED = 5; // visual speed
const LOOP_DURATION = 5500;

const BEATMAP = [
  // Intro (0 - 6000ms)
  { time: 0, type: "ArrowUp" },
  { time: 1500, type: "ArrowLeft" },
  { time: 3000, type: "ArrowDown" },
  { time: 4500, type: "ArrowRight" },
  { time: 6000, type: " " },

  // Main Section (6000 - 18000ms)
  { time: 7500, type: "ArrowUp" },
  { time: 9000, type: "ArrowLeft" },
  { time: 10500, type: "ArrowDown" },
  { time: 12000, type: "ArrowRight" },
  { time: 13500, type: "ArrowUp" },
  { time: 15000, type: "ArrowLeft" },
  { time: 16500, type: "ArrowDown" },
  { time: 18000, type: "ArrowRight" },
  
  // Outro/Transition (18000 - 24000ms)
  { time: 19500, type: " " },
  { time: 21000, type: "ArrowUp" },
  { time: 22500, type: "ArrowLeft" },
  { time: 24000, type: "ArrowDown" },
];


const Background = () => {
  const texture = useTexture("/images/disco.jpg");

  texture.encoding = THREE.sRGBEncoding;
  texture.colorSpace = THREE.SRGBColorSpace;

  const { scene } = useThree();
  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);

  return null;
};

const ArrowGame = ({
  players = ["Mario", "Waluigi"],
  fpgaControls = {},
  ws,
  localPlayerName = "Mario"
}) => {
  const [feedback, setFeedback] = useState(null);
  const [arrows, setArrows] = useState([]);
  const arrowsRef = useRef([]);
  const feedbackTimeout = useRef(null);
  const arrowIdCounter = useRef(0);
  const inputLock = useRef(false);
  const spawnedIndices = useRef({ loop: null, set: new Set() });
  const audioRef = useRef(null); // Reference for the audio element

  const [marioAnim, setMarioAnim] = useState({
    jumpLow: false,
    left: false,
    right: false,
    still: true,
  });

  const [waluigiAnim, setWaluigiAnim] = useState({
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
    " ": 0,
  };

  const processedPlayers = players.map(p => (typeof p === "string" ? { username: p } : p));
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  const [scores, setScores] = useState(Array(numPlayers).fill(0));

  const [localAnim, setLocalAnim] = useState(
      Array(numPlayers).fill({ jumpLow: false, left: false, right: false, still: true })
    );

  const getCurrentLoopInfo = (elapsed) => {
    const loopNumber = Math.floor(elapsed / LOOP_DURATION);
    const loopStart = loopNumber * LOOP_DURATION;
    return { loopNumber, loopStart };
  };

  useEffect(() => {
    let lastFrameTime = performance.now();
    const gameStart = performance.now();

    const animate = (now) => {
      const delta = now - lastFrameTime;
      const elapsed = now - gameStart;
      lastFrameTime = now;

      const secondsDelta = delta / 1000;
      const speed = ARROW_SPEED * 60;

      const { loopNumber, loopStart } = getCurrentLoopInfo(elapsed);

      // Reset spawn tracking when loop changes
      if (spawnedIndices.current.loop !== loopNumber) {
        spawnedIndices.current = { loop: loopNumber, set: new Set() };
      }

      // Move arrows
      arrowsRef.current = arrowsRef.current
        .map((arrow) => {
          const newX = arrow.position.x - speed * secondsDelta;
          if (!arrow.missed && newX < TARGET_X - HIT_WINDOW) {
            showFeedback("Miss", "red");
            return { ...arrow, missed: true, position: { ...arrow.position, x: newX } };
          }
          return { ...arrow, position: { ...arrow.position, x: newX } };
        })
        .filter((arrow) => arrow.position.x > -100);

      // Spawn arrows for this loop only at correct time
      BEATMAP.forEach((beat, index) => {
        const beatTime = loopStart + beat.time;
        const spawnKey = `${loopNumber}-${index}`;
        const timeUntilBeat = beatTime - elapsed;

        if (
          timeUntilBeat <= 0 &&
          timeUntilBeat > -16.67 &&
          !spawnedIndices.current.set.has(spawnKey)
        ) {
          const key = beat.type;
          arrowsRef.current.push({
            id: arrowIdCounter.current++,
            type: key,
            position: {
              x: window.innerWidth,
              y: arrowLanes[key],
            },
            missed: false,
          });
          spawnedIndices.current.set.add(spawnKey);
        }
      });

      setArrows([...arrowsRef.current]);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const showFeedback = (text, color) => {
    setFeedback({ text, color });
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 600);
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const triggerMarioAnimation = async (type) => {
    inputLock.current = true;

    if (type === "L") {
      setMarioAnim({ jumpLow: false, left: true, right: false, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: false, right: true, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    } else if (type === "R") {
      setMarioAnim({ jumpLow: false, left: false, right: true, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: true, right: false, still: false });
      await sleep(300);
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    } else if (type === "J") {
      setMarioAnim({ jumpLow: true, left: false, right: false, still: false });
      await sleep(400);
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    } else {
      setMarioAnim({ jumpLow: false, left: false, right: false, still: true });
    }

    inputLock.current = false;
  };

  const triggerWaluigiAnimation = async (type) => {
    inputLock.current = true;

    if (type === "L") {
      setWaluigiAnim({ jumpLow: false, left: true, right: false, still: false });
      await sleep(300);
      setWaluigiAnim({ jumpLow: false, left: false, right: true, still: false });
      await sleep(300);
      setWaluigiAnim({ jumpLow: false, left: false, right: false, still: true });
    } else if (type === "R") {
      setWaluigiAnim({ jumpLow: false, left: false, right: true, still: false });
      await sleep(300);
      setWaluigiAnim({ jumpLow: false, left: true, right: false, still: false });
      await sleep(300);
      setWaluigiAnim({ jumpLow: false, left: false, right: false, still: true });
    } else if (type === "J") {
      setWaluigiAnim({ jumpLow: true, left: false, right: false, still: false });
      await sleep(400);
      setWaluigiAnim({ jumpLow: false, left: false, right: false, still: true });
    } else {
      setWaluigiAnim({ jumpLow: false, left: false, right: false, still: true });
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

        if (distance < 100) {
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

  const updatedPlayers = processedPlayers.map((player, index) => {
    const spacing = 10 / Math.max(1, numPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      username: player.username,
      position: [xPos, -0.7, 0],
      score: player.username === localPlayerName ? scores[index] : scores[index] || 0,
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });

  return (
    <div className="arrow-game-wrapper">
      <audio ref={audioRef} src="/sounds/Beethoven_Virus_-_DDR.mp3" autoPlay loop />

      <Scoreboard players={updatedPlayers} />
      <div className="arrow-game-container">
        <div className="hit-line" style={{ left: `${TARGET_X}px` }} />
        {arrows.map((arrow) => (
          <Arrow
            key={arrow.id}
            type={arrow.type === " " ? "Button" : arrow.type}
            position={arrow.position}
          />
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
        <Background />
        <ambientLight intensity={4} />
        {updatedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          if (index === 0) {
            return (
              <PlayerMario
                key={`mario-${index}`}
                username={player.username}
                initialPosition={player.position}
                isPlayerPlayer={isLocal}
                jumpLow={localAnim[index]?.jumpLow || false}
                left={localAnim[index]?.left || false}
                right={localAnim[index]?.right || false}
                still={localAnim[index]?.still || true}
                playerRef={isLocal ? controlledPlayerRefs.current[index] : undefined}
                ws={ws}
              />
            );
          } else if (index === 1) {
            return (
              <PlayerWaluigi
                key={`waluigi-${index}`}
                username={player.username}
                initialPosition={player.position}
                isPlayerPlayer={isLocal}
                jumpLow={localAnim[index]?.jumpLow || false}
                left={localAnim[index]?.left || false}
                right={localAnim[index]?.right || false}
                still={localAnim[index]?.still || true}
                playerRef={isLocal ? controlledPlayerRefs.current[index] : undefined}
                ws={ws}
              />
            );
          } else {
            return null;
          }
        })}
      </Canvas>
    </div>
  );
};

export default ArrowGame;


