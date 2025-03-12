import React, { useState, useEffect, useRef } from "react";
import Arrow from "./Arrow.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import { Canvas, useThree } from "@react-three/fiber";
import "./Arrow.css";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

// Constants for the arrow game
const TARGET_X = 80;
const HIT_WINDOW = 50; // Wide detection margin
const ARROW_SPEED = 5; // Visual speed multiplier
const LOOP_DURATION = 5500;
const BEATMAP = [
  { time: 0, type: "ArrowLeft" },
  { time: 400, type: "ArrowUp" },
  { time: 1000, type: "ArrowRight" },
  { time: 1300, type: " " },
  { time: 2200, type: "ArrowDown" },
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
  // Process players into objects if needed.
  const processedPlayers = players.map(p =>
    typeof p === "string" ? { username: p } : p
  );
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  // Scores state: an array, one per player.
  const [scores, setScores] = useState(Array(numPlayers).fill(0));
  // Feedback state: object keyed by player index (0, 1).
  const [feedback, setFeedback] = useState({});
  // localAnim state: an array of animation states (one per player).
  const [localAnim, setLocalAnim] = useState(
    Array(numPlayers).fill({ jumpLow: false, left: false, right: false, still: true })
  );
  // A flat arrow stream (common to both players).
  const [arrows, setArrows] = useState([]);
  const arrowsRef = useRef([]);
  const arrowIdCounter = useRef(0);
  const spawnedIndices = useRef({ loop: null, set: new Set() });
  
  // Remove any local keydown listener; only FPGA input is used.

  // Refs for controlled player components.
  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  // Utility: compute current loop info.
  const getCurrentLoopInfo = (elapsed) => {
    const loopNumber = Math.floor(elapsed / LOOP_DURATION);
    const loopStart = loopNumber * LOOP_DURATION;
    return { loopNumber, loopStart };
  };

  // Arrow animation loop: spawns one arrow stream and moves arrows.
  useEffect(() => {
    let lastFrameTime = performance.now();
    const gameStart = performance.now();
    let currentLoop = 0;
    const animate = (now) => {
      const delta = now - lastFrameTime;
      const elapsed = now - gameStart;
      lastFrameTime = now;
      const secondsDelta = delta / 1000;
      const moveX = ARROW_SPEED * 60 * secondsDelta;
      const { loopNumber, loopStart } = getCurrentLoopInfo(elapsed);
      if (loopNumber !== currentLoop) {
        spawnedIndices.current = { loop: loopNumber, set: new Set() };
        currentLoop = loopNumber;
      }
      
      // Move arrows in the flat arrow stream.
      arrowsRef.current = arrowsRef.current
        .map(arrow => {
          const newX = arrow.position.x - moveX;
          if (!arrow.missed && newX < TARGET_X - HIT_WINDOW) {
            // If arrow passes the detection zone, mark as missed.
            showFeedback("Miss", "red", arrow.playerIndex);
            return { ...arrow, missed: true, position: { ...arrow.position, x: newX } };
          }
          return { ...arrow, position: { ...arrow.position, x: newX } };
        })
        .filter(arrow => arrow.position.x > -100);
      
      // Spawn new arrow if needed.
      BEATMAP.forEach((beat, index) => {
        const beatTime = loopStart + beat.time;
        const spawnKey = `${currentLoop}-${index}`;
        const timeUntilBeat = beatTime - elapsed;
        if (
          timeUntilBeat <= 0 &&
          timeUntilBeat > -16.67 &&
          !spawnedIndices.current.set.has(spawnKey)
        ) {
          // Spawn one arrow (common stream) and attach the playerIndex as undefined.
          // Later, FPGA input will determine which player responds.
          arrowsRef.current.push({
            id: arrowIdCounter.current++,
            type: beat.type,
            position: { x: window.innerWidth, y: 0 },
            missed: false,
            // We may store which player eventually hit it, if needed.
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

  // Feedback handling: display feedback per player.
  const feedbackRef = useRef({});
  const showFeedback = (playerIndexOrGlobal, text, color) => {
    // If playerIndexOrGlobal is a number, use it; otherwise, assume global feedback.
    const key = typeof playerIndexOrGlobal === "number" ? playerIndexOrGlobal : "global";
    setFeedback(prev => ({ ...prev, [key]: { text, color } }));
    if (feedbackRef.current[key]) {
      clearTimeout(feedbackRef.current[key]);
    }
    feedbackRef.current[key] = setTimeout(() => {
      setFeedback(prev => {
        const newFb = { ...prev };
        delete newFb[key];
        return newFb;
      });
    }, 600);
  };

  // WebSocket handler: process FPGA input.
  useEffect(() => {
    if (ws) {
      const messageHandler = async (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "data") {
            const playerIndex = payload.player - 1; // 0-indexed
            if (playerIndex >= 0 && playerIndex < numPlayers) {
              console.log(`FPGA Input Received: Player ${playerIndex + 1}, Action: ${payload.data}`);
              // For the local player, update animation state.
              if (processedPlayers[playerIndex].username === localPlayerName) {
                let newAnimState = { jumpLow: false, left: false, right: false, still: false };
                switch (payload.data) {
                  case "J":
                    newAnimState.jumpLow = true;
                    break;
                  case "L":
                    newAnimState.left = true;
                    break;
                  case "R":
                    newAnimState.right = true;
                    break;
                  case "N":
                    newAnimState.still = true;
                    break;
                  case "B1":
                    newAnimState.jumpLow = true;
                    break;
                  default:
                    console.warn("Unknown FPGA action:", payload.data);
                    return;
                }
                setLocalAnim(prev => {
                  const updated = [...prev];
                  updated[playerIndex] = newAnimState;
                  return updated;
                });
              }
              // Arrow matching: find a matching arrow in the flat stream.
              const matchIndex = arrowsRef.current.findIndex(
                (arrow) =>
                  arrow.type.toLowerCase() === `arrow${payload.data}`.toLowerCase() &&
                  !arrow.missed &&
                  Math.abs(arrow.position.x - TARGET_X) < HIT_WINDOW
              );
              if (matchIndex !== -1) {
                const arrow = arrowsRef.current[matchIndex];
                const distance = Math.abs(arrow.position.x - TARGET_X);
                let scoreIncrement = distance < 10 ? 2 : 1;
                setScores(prev => {
                  const updated = [...prev];
                  updated[playerIndex] += scoreIncrement;
                  return updated;
                });
                showFeedback(playerIndex, distance < 10 ? "Great!" : "Good!", distance < 10 ? "lime" : "yellow");
                arrowsRef.current.splice(matchIndex, 1);
                setArrows([...arrowsRef.current]);
              }
            }
          }
        } catch (err) {
          console.error("Error parsing message:", err);
        }
      };
      ws.addEventListener("message", messageHandler);
      return () => ws.removeEventListener("message", messageHandler);
    }
  }, [ws, numPlayers, processedPlayers, localPlayerName]);

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
      <Scoreboard playerNames={players} scores={scores} />
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
      {Object.keys(feedback).map((key) => (
        <div key={`feedback-${key}`} className="hit-feedback" style={{ color: feedback[key].color }}>
          {feedback[key].text}
        </div>
      ))}
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
        {processedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          if (index === 0) {
            return (
              <PlayerMario
                key={`mario-${index}`}
                username={player.username}
                initialPosition={[-1, -0.7, 0]}  // Fixed position
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
                initialPosition={[1, -0.7, 0]}  // Fixed position
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
