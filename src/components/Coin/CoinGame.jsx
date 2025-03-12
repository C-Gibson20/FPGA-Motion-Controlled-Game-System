import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import Server from "../../server";
import "./CoinGame.css"; // We reuse the same CSS as Scene
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import CoinSpawner from "../../components/Coin/CoinSpawner.jsx";
import * as THREE from "three";

const Background = () => {
  const texture = useTexture("/images/Castel.jpg");
  texture.encoding = THREE.sRGBEncoding;
  texture.colorSpace = THREE.SRGBColorSpace;
  const { scene } = useThree();
  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);
  return null;
};

const CoinLayerGroup = ({ children, layer = 0 }) => {
  const groupRef = useRef();
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse(child => child.layers.set(layer));
    }
  });
  return <group ref={groupRef}>{children}</group>;
};

const FETCH_INTERVAL = 1000;

const CoinGame = ({
  fpgaControls = {},
  players = ["Mario", "Waluigi"],
  scores, // scores may be undefined
  startPositions,
  localPlayerName = "Mario"
}) => {
  // Ensure players is an array of objects.
  const processedPlayers = players.map((p) =>
    typeof p === "string" ? { username: p } : p
  );
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  // Use safeScores: if scores is not provided or empty, default to an array of 0s.
  const safeScores = (scores && scores.length) ? scores : Array(numPlayers).fill(0);

  // Local score state for coin collection (for the local player)
  const [localScore, setLocalScore] = useState(0);
  
  // Lives state (one per player)
  const [lives, setLives] = useState(Array(numPlayers).fill(2));
  const [gameOver, setGameOver] = useState(false);

  // Create an array of refs for each player.
  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  // Update local score when a coin is collected.
  const handleCoinCollect = () => {
    setLocalScore(prev => prev + 1);
    console.log("Coin collected!");
  };

  // Calculate positions for players so that they are evenly spread.
  const updatedPlayers = processedPlayers.map((player, index) => {
    const totalPlayers = processedPlayers.length;
    const spacing = 10 / Math.max(1, totalPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      ...player,
      position: [xPos, -0.7, 0],
      score: player.username === localPlayerName ? localScore : (safeScores[index] || 0),
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Scoreboard players={updatedPlayers} lives={lives} />

      {gameOver && (
        <div className="game-over-overlay">
          <h1 className="title">
            <span className="word">
              <span>G</span><span>A</span><span>M</span><span>E</span>
            </span>
            <span className="word">
              <span>O</span><span>V</span><span>E</span><span>R</span>
            </span>
          </h1>
          <div className="game-over-score">Scores: {updatedPlayers.map(p => p.score).join(" - ")}</div>
        </div>
      )}

      <Canvas
        shadows
        camera={{ position: [0, 0, 10], fov: 10 }}
        onCreated={({ camera }) => {
          camera.layers.enable(0);
          camera.layers.enable(1);
          camera.layers.enable(2);
        }}
        style={{ display: "block" }}
      >
        <Background />
        {/* <ambientLight intensity={4} /> */}
        <directionalLight position={[10, 10, 5]} castShadow />

        {updatedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          if (index === 0) {
            return (
              <PlayerMario
                key={`mario-${index}`}
                username={player.username}
                initialPosition={player.position}
                isPlayerPlayer={isLocal}
                jumpLow={fpgaControls?.[1]?.jump || false}
                left={fpgaControls?.[1]?.left || false}
                right={fpgaControls?.[1]?.right || false}
                still={fpgaControls?.[1]?.still || false}
                playerRef={controlledPlayerRefs.current[index]}
              />
            );
          } else if (index === 1) {
            return (
              <PlayerWaluigi
                key={`waluigi-${index}`}
                username={player.username}
                initialPosition={player.position}
                isPlayerPlayer={isLocal}
                jumpLow={fpgaControls?.[2]?.jump || false}
                left={fpgaControls?.[2]?.left || false}
                right={fpgaControls?.[2]?.right || false}
                still={fpgaControls?.[2]?.still || false}
                playerRef={controlledPlayerRefs.current[index]}
              />
            );
          } else {
            return null;
          }
        })}

        <CoinLayerGroup layer={2}>
          <CoinSpawner
            startPositions={startPositions || updatedPlayers.map(p => p.position)}
            playerRef={controlledPlayerRefs.current[0] || undefined}
            onCoinCollect={(playerIndex) => handleCoinCollect(playerIndex)}
          />
        </CoinLayerGroup>
      </Canvas>
    </div>
  );
};

export default CoinGame;
