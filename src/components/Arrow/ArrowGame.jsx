import React, { useState, useEffect, useRef } from "react";
import Arrow from "./Arrow.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import { Canvas } from "@react-three/fiber";
import "./Arrow.css";
import Background from "../../pages/RythmGame/Background.jsx";

const TARGET_X = 80;
const HIT_WINDOW = 50; 
const ARROW_SPEED = 4; 
const LOOP_DURATION = 5500;
const BEATMAP = [
  { time: 0, type: "ArrowUp" },
  { time: 1500, type: "ArrowLeft" },
  { time: 3000, type: "ArrowUp" },
  { time: 4500, type: "ArrowRight" },
  { time: 6000, type: "ArrowLeft" },

  // Main Section (6000 - 18000ms)
  { time: 7500, type: "ArrowUp" },
  { time: 9000, type: "ArrowLeft" },
  { time: 10500, type: "ArrowUp" },
  { time: 12000, type: "ArrowRight" },
  { time: 13500, type: "ArrowUp" },
  { time: 15000, type: "ArrowLeft" },
  { time: 16500, type: "ArrowUp" },
  { time: 18000, type: "ArrowRight" },
  
  // Outro/Transition (18000 - 24000ms)
  { time: 19500, type: "ArrowLeft" },
  { time: 21000, type: "ArrowUp" },
  { time: 22500, type: "ArrowLeft" },
  { time: 24000, type: "ArrowRight" },
];

const COMMAND_MAPPING = {
  L: "ArrowLeft", R: "ArrowRight", J: "ArrowUp", B1: "ArrowUp",
};

const getCurrentLoopInfo = (elapsed) => {
  const loopNumber = Math.floor(elapsed / LOOP_DURATION);
  return { loopNumber, loopStart: loopNumber * LOOP_DURATION };
};

const getAnimationState = (command) => {
  const baseState = { jumpLow: false, left: false, right: false, still: false };
  switch (command) {
    case "J": case "B1": return { ...baseState, jumpLow: true };
    case "L": return { ...baseState, left: true };
    case "R": return { ...baseState, right: true };
    default: return baseState;
  }
};

const ArrowGame = ({
  fpgaControls = {},
  players = ["Mario", "Waluigi"],
  scores,
  ws,
  localPlayerName = "Mario",
  onScoreIncrement
}) => {
  const processedPlayers = players.map(p =>
    typeof p === "string" ? { username: p } : p
  );
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  // const [scores, setScores] = useState(Array(numPlayers).fill(0));
  const [feedback, setFeedback] = useState({});
  const [localAnim, setLocalAnim] = useState(
    Array.from({ length: numPlayers }, () => ({
      jumpLow: false,
      left: false,
      right: false 
    }))
  );
  const [arrows, setArrows] = useState([]);

  const arrowsRef = useRef([]);
  const arrowIdCounter = useRef(0);
  const spawnedIndices = useRef({ loop: null, set: new Set() });
  const controlledPlayerRefs = useRef([]);
  const feedbackRef = useRef({});

  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  const showFeedback = (key, text, color) => {
    setFeedback(prev => ({ ...prev, [key]: { text, color } }));
    clearTimeout(feedbackRef.current[key]);
    feedbackRef.current[key] = setTimeout(() => {
      setFeedback(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }, 600);
  };

  const handleInputCommand = (action, playerIndex) => {
    const animState = getAnimationState(action);
    setLocalAnim(prev => {
      const updated = [...prev];
      updated[playerIndex] = animState;
      return updated;
    });

    const expectedType = COMMAND_MAPPING[action] || "";
    const matchIndex = arrowsRef.current.findIndex(
      (arrow) =>
        arrow.type?.toLowerCase() === expectedType.toLowerCase()
        && !arrow.missed 
        && Math.abs(arrow.position.x - TARGET_X) < HIT_WINDOW
    );

    if (matchIndex !== -1) {
      const arrow = arrowsRef.current[matchIndex];
      const distance = Math.abs(arrow.position.x - TARGET_X);
      const points = distance < 30 ? 2 : 1;

      onScoreIncrement(playerIndex, points);

      showFeedback(playerIndex, distance < 30 ? "Great!" : "Good!", distance < 30 ? "lime" : "yellow");
      arrowsRef.current.splice(matchIndex, 1);
      setArrows([...arrowsRef.current]);
    }
  };

  // Arrow animation loop
  useEffect(() => {
    const gameStart = performance.now();
    let lastFrameTime = gameStart;
    let currentLoop = 0;

    const animate = (now) => {
      const delta = now - lastFrameTime;
      const elapsed = now - gameStart;
      const secondsDelta = delta / 1000;
      const moveX = ARROW_SPEED * 60 * secondsDelta;
      lastFrameTime = now;
      
      const { loopNumber, loopStart } = getCurrentLoopInfo(elapsed);
      if (loopNumber !== currentLoop) {
        spawnedIndices.current = { loop: loopNumber, set: new Set() };
        currentLoop = loopNumber;
      }
      
      // Move arrows
      arrowsRef.current = arrowsRef.current.map((arrow) => {
        const newX = arrow.position.x - moveX;
        if (!arrow.missed && newX < TARGET_X - HIT_WINDOW) {
          Array(numPlayers).fill(0).forEach((_, p) => showFeedback(p, "Miss", "red"));
          return { ...arrow, missed: true, position: { ...arrow.position, x: newX } };
        }
        return { ...arrow, position: { ...arrow.position, x: newX } };
      }).filter((arrow) => arrow.position.x > -100);
      
      // Spawn new arrows.
      BEATMAP.forEach((beat, index) => {
        const beatTime = loopStart + beat.time;
        const spawnKey = `${currentLoop}-${index}`;
        const timeUntilBeat = beatTime - elapsed;

        if (timeUntilBeat <= 0 && timeUntilBeat > -16.67 && !spawnedIndices.current.set.has(spawnKey)) {
          arrowsRef.current.push({
            id: arrowIdCounter.current++,
            type: beat.type,
            position: { x: window.innerWidth, y: 0 },
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
  }, [numPlayers]);

  // WebSocket message handler: update animation state and process arrow hit.
  useEffect(() => {
    if (!ws) return;
    const messageHandler = async (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== "data") return;
        const playerIndex = payload.player - 1; 
        if (playerIndex < 0 || playerIndex >= numPlayers) return;
        handleInputCommand(payload.data, playerIndex);
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };
    ws.addEventListener("message", messageHandler);
    return () => ws.removeEventListener("message", messageHandler);
  }, [ws, numPlayers]);

  useEffect(() => {
    const KEY_MAP = {
      ArrowUp: "J",
      ArrowLeft: "L",
      ArrowRight: "R",
    };

    const pressedKeys = new Set();

    const handleKeyDown = (e) => {
      const cmd = KEY_MAP[e.key];
      if (!cmd || pressedKeys.has(cmd)) return;
      pressedKeys.add(cmd);
      handleInputCommand(cmd, 0);
    };

    const handleKeyUp = (e) => {
      if (!KEY_MAP[e.key]) return;
      pressedKeys.delete(KEY_MAP[e.key]);
      handleInputCommand("N", 0);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Build updated players for Scoreboard.
  const updatedPlayers = processedPlayers.map((player, index) => {
    const spacing = 10 / Math.max(1, numPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      username: player.username,
      position: [xPos, -0.7, 0],
      score: scores[index] || 0,
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });  

  return (
    <div className="arrow-game-wrapper">
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
      {updatedPlayers.map((player, index) => (
        feedback[index] && (
          <div
            key={`feedback-${index}`}
            className="hit-feedback"
            style={{position: "absolute", left: index === 0 ? "250px" : "800px", top: "120px", color: feedback[index].color }}
          >
            {feedback[index].text}
          </div>
        )
      ))}
      <Canvas
        style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 0 }}
        camera={{ position: [0, 0, 10], fov: 10 }}
      >
        <Background imagePath={"/images/disco.jpg"}/>
        <ambientLight intensity={4} />
        {processedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          if (index === 0) {
            return (
              <PlayerMario
                key={`mario-${index}`}
                username={player.username}
                initialPosition={[-1, -0.7, 0]} 
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
                initialPosition={[1, -0.7, 0]} 
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
