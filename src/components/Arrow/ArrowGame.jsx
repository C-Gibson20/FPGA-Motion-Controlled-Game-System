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
const HIT_WINDOW = 40; // detection window (in pixels)
const ARROW_SPEED = 5; // visual speed multiplier
const LOOP_DURATION = 5500;

// BEATMAP now defines a common arrow stream; arrows will spawn in both lanes.
const BEATMAP = [
  { time: 0, type: "ArrowUp" },
  { time: 1500, type: "ArrowLeft" },
  { time: 3000, type: "ArrowDown" },
  { time: 4500, type: "ArrowRight" },
  { time: 6000, type: " " },
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
  // Process players into objects if they’re strings.
  const processedPlayers = players.map(p => (typeof p === "string" ? { username: p } : p));
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  // Score state (one per player)
  const [scores, setScores] = useState(Array(numPlayers).fill(0));
  // Feedback state: an object with keys as player index.
  const [feedback, setFeedback] = useState({});
  // localAnim state: an array of animation states (one per player).
  const [localAnim, setLocalAnim] = useState(
    Array(numPlayers).fill({ jumpLow: false, left: false, right: false, still: true })
  );
  // arrowsRef: an array (length = numPlayers) of arrays of arrows.
  const arrowsRef = useRef([]);
  // Flattened arrow stream for rendering.
  const [arrows, setArrows] = useState([]);
  const arrowIdCounter = useRef(0);
  const spawnedIndices = useRef({ loop: null, set: new Set() });
  
  // Refs for controlled player components.
  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  // Initialize arrow arrays for each player.
  useEffect(() => {
    arrowsRef.current = Array(numPlayers).fill([]); 
  }, [numPlayers]);

  // Utility: compute current loop info.
  const getCurrentLoopInfo = (elapsed) => {
    const loopNumber = Math.floor(elapsed / LOOP_DURATION);
    const loopStart = loopNumber * LOOP_DURATION;
    return { loopNumber, loopStart };
  };

  // Arrow animation loop: spawn and move arrows for each player's lane.
  useEffect(() => {
    let lastFrameTime = performance.now();
    const gameStart = performance.now();
    let currentLoop = 0;
    // Define lane Y-positions: player0 at -30, player1 at +30.
    const laneYPositions = { 0: -30, 1: 30 };

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

      // For each player, move arrows.
      for (let p = 0; p < numPlayers; p++) {
        if (!arrowsRef.current[p]) arrowsRef.current[p] = [];
        arrowsRef.current[p] = arrowsRef.current[p]
          .map(arrow => {
            const newX = arrow.position.x - moveX;
            if (!arrow.missed && newX < TARGET_X - HIT_WINDOW) {
              // Arrow missed; show feedback for that player.
              showFeedback(p, "Miss", "red");
              return { ...arrow, missed: true, position: { ...arrow.position, x: newX } };
            }
            return { ...arrow, position: { ...arrow.position, x: newX } };
          })
          .filter(arrow => arrow.position.x > -100);
      }

      // Spawn arrows from BEATMAP for this loop.
      BEATMAP.forEach((beat, index) => {
        const beatTime = loopStart + beat.time;
        const spawnKey = `${currentLoop}-${index}`;
        const timeUntilBeat = beatTime - elapsed;
        if (
          timeUntilBeat <= 0 &&
          timeUntilBeat > -16.67 &&
          !spawnedIndices.current.set.has(spawnKey)
        ) {
          // For each player, add an arrow in their lane.
          for (let p = 0; p < numPlayers; p++) {
            if (!arrowsRef.current[p]) arrowsRef.current[p] = [];
            arrowsRef.current[p].push({
              id: arrowIdCounter.current++,
              type: beat.type,
              position: { x: window.innerWidth, y: laneYPositions[p] },
              missed: false,
            });
          }
          spawnedIndices.current.set.add(spawnKey);
        }
      });

      // Flatten arrow arrays for rendering.
      let flatArrows = [];
      for (let p = 0; p < numPlayers; p++) {
        flatArrows = flatArrows.concat(arrowsRef.current[p] || []);
      }
      setArrows(flatArrows);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [numPlayers]);

  // Feedback handling
  const feedbackRef = useRef({});
  const showFeedback = (playerIndex, text, color) => {
    setFeedback(prev => ({ ...prev, [playerIndex]: { text, color } }));
    if (feedbackRef.current[playerIndex]) {
      clearTimeout(feedbackRef.current[playerIndex]);
    }
    feedbackRef.current[playerIndex] = setTimeout(() => {
      setFeedback(prev => {
        const newFb = { ...prev };
        delete newFb[playerIndex];
        return newFb;
      });
    }, 600);
  };

  // WebSocket message handler: process FPGA input.
  useEffect(() => {
    if (ws) {
      const messageHandler = async (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "data") {
            const playerIndex = payload.player - 1; // 0-indexed
            if (playerIndex >= 0 && playerIndex < numPlayers) {
              console.log(`FPGA Input Received: Player ${playerIndex + 1}, Action: ${payload.data}`);
              // For local player, update animation state.
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
              // Process arrow matching only in the arrow stream for this player.
              const playerArrows = arrowsRef.current[playerIndex] || [];
              const matchIndex = playerArrows.findIndex(
                (arrow) =>
                  arrow.type.toLowerCase() === `arrow${payload.data}`.toLowerCase() &&
                  !arrow.missed &&
                  Math.abs(arrow.position.x - TARGET_X) < HIT_WINDOW
              );
              if (matchIndex !== -1) {
                const arrow = playerArrows[matchIndex];
                const distance = Math.abs(arrow.position.x - TARGET_X);
                let scoreIncrement = distance < 10 ? 2 : 1;
                setScores(prev => {
                  const updated = [...prev];
                  updated[playerIndex] += scoreIncrement;
                  return updated;
                });
                showFeedback(
                  playerIndex,
                  distance < 10 ? "Great!" : "Good!",
                  distance < 10 ? "lime" : "yellow"
                );
                playerArrows.splice(matchIndex, 1);
                arrowsRef.current[playerIndex] = playerArrows;
                // Flatten arrows for rendering.
                let flatArrows = [];
                for (let p = 0; p < numPlayers; p++) {
                  flatArrows = flatArrows.concat(arrowsRef.current[p] || []);
                }
                setArrows(flatArrows);
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

  // Remove any local keydown listener since FPGA controls the game.

  // Build updated players for the Scoreboard.
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
      {Object.keys(feedback).map((playerIndex) => (
        <div key={playerIndex} className="hit-feedback" style={{ color: feedback[playerIndex].color }}>
          {feedback[playerIndex].text}
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
