import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import CoinSpawner from "./CoinSpawner.jsx";
import "./CoinGame.css";

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

const CoinGame = ({
  players = ["Mario", "Waluigi"],
  fpgaControls,
  ws,
  localPlayerName = "Mario"
}) => {
  const numPlayers = players.length;
  if (numPlayers === 0) return <div>No players</div>;

  // Initialize scores and lives arrays (one per player)
  const [scores, setScores] = useState(Array(numPlayers).fill(0));
  const [lives, setLives] = useState(Array(numPlayers).fill(2));
  const [gameOver, setGameOver] = useState(false);

  // Local score state for coin collection for the local player
  const [localScore, setLocalScore] = useState(0);

  // Create an array of refs for each player.
  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  // Collision handling: update lives for the given player index.
  const handleCoinCollision = (playerIndex) => {
    setLives(prev => {
      const updated = [...prev];
      updated[playerIndex] = Math.max(updated[playerIndex] - 1, 0);
      console.log(`💥 Collision for player ${playerIndex}: Lives: ${updated[playerIndex]}`);
      if (updated[playerIndex] === 0) {
        setGameOver(true);
      }
      return updated;
    });
  };

  // Increase score when a coin is collected for the given player index.
  const handleCoinCollect = (playerIndex) => {
    // If it's the local player, update localScore.
    if (players[playerIndex] === localPlayerName) {
      setLocalScore(prev => prev + 1);
    }
    setScores(prev => {
      const updated = [...prev];
      updated[playerIndex] = updated[playerIndex] + 1;
      console.log(`✅ Coin collected for player ${playerIndex}: Score: ${updated[playerIndex]}`);
      return updated;
    });
  };

  // Build an array of player objects.
  const updatedPlayers = players.map((player, index) => {
    // If player is a string, wrap it in an object.
    const username = typeof player === "string" ? player : player.username;
    return {
      username,
      position: [(-3 + index * (10 / Math.max(1, numPlayers))) * 0.3, -0.7, 0],
      score: username === localPlayerName ? localScore : (scores[index] || 0),
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Scoreboard players={updatedPlayers} lives={lives} />

      {gameOver && (
        <div className="game-over-overlay">
          <h1 className="title">
            <span className="word"><span>G</span><span>A</span><span>M</span><span>E</span></span>
            <span className="word"><span>O</span><span>V</span><span>E</span><span>R</span></span>
          </h1>
          <div className="game-over-score">Scores: {scores.join(" - ")}</div>
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
        <ambientLight intensity={4} />
        <directionalLight position={[10, 10, 5]} castShadow />

        {updatedPlayers.map((player, index) => {
          // Determine if this player is local.
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
                jumpLow={fpgaControls?.[2]?.jump || false}
                left={fpgaControls?.[2]?.left || false}
                right={fpgaControls?.[2]?.right || false}
                still={fpgaControls?.[2]?.still || false}
                playerRef={isLocal ? controlledPlayerRefs.current[index] : undefined}
                ws={ws}
              />
            );
          } else {
            return null;
          }
        })}

        <CoinLayerGroup layer={2}>
          <CoinSpawner
            startPositions={[[0, 0, 0], [1, 0, 0]]}
            playerRef={controlledPlayerRefs.current[0] || undefined}
            onCoinCollect={(playerIndex) => handleCoinCollect(playerIndex)}
            onCollision={(playerIndex) => handleCoinCollision(playerIndex)}
          />
        </CoinLayerGroup>
      </Canvas>
    </div>
  );
};

export default CoinGame;
