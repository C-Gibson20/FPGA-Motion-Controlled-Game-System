import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import SpikeBall from "./SpikeBall.jsx";
import "./SpikeBallGame.css";
import SpikeBallSpawner from "./SpikeBallSpawner.jsx";

// Background component using a castle image.
const Background = () => {
  const texture = useTexture("/images/Bowser.jpg");
  texture.encoding = THREE.sRGBEncoding;
  texture.colorSpace = THREE.SRGBColorSpace;
  const { scene } = useThree();
  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);
  return null;
};

// This wrapper forces its children to a specific layer.
const CoinLayerGroup = ({ children, layer = 0 }) => {
  const groupRef = useRef();
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        child.layers.set(layer);
      });
    }
  });
  return <group ref={groupRef}>{children}</group>;
};

const SpikeBallGame = ({
  players = ["Mario", "Waluigi"],
  fpgaControls = {},
  ws,
  localPlayerName = "Mario"
}) => {
  // Process players: if players are passed as strings, wrap them into objects.
  const processedPlayers = players.map(p =>
    typeof p === "string" ? { username: p } : p
  );
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  // Initialize scores and lives arrays.
  const [scores, setScores] = useState(Array(numPlayers).fill(0));
  const [lives, setLives] = useState(Array(numPlayers).fill(10));
  const [gameOver, setGameOver] = useState(false);

  // Create an array of refs for each player.
  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  // Collision handling: update lives for the given player index.
  const handleSpikeCollision = (playerIndex) => {
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

  // Increase score for a safe pass for the given player index.
  const handleSpikePass = (playerIndex) => {
    setScores(prev => {
      const updated = [...prev];
      updated[playerIndex] = updated[playerIndex] + 1;
      console.log(`✅ Safe for player ${playerIndex}: Score: ${updated[playerIndex]}`);
      return updated;
    });
  };

  // Build updated players for Scoreboard.
  const updatedPlayers = processedPlayers.map((player, index) => {
    const username = player.username;
    // Calculate an even spread for positions.
    const spacing = 10 / Math.max(1, numPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      username,
      position: [xPos, -0.7, 0],
      score: username === localPlayerName ? scores[index] : scores[index] || 0,
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Render one Scoreboard for both players */}
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
        <directionalLight castShadow intensity={1} position={[5, 5, 5]} />

        {updatedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          if (index === 0) {
            return (
              <PlayerMario
                key={`mario-${index}`}
                username={player.username}
                initialPosition={[-0.65, -0.35, 0]}
                isPlayerPlayer={isLocal} // Only the local player's component handles keyboard input.
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
                initialPosition={[0.5, -0.35, 0]}
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

        {/* Here we render SpikeBall. It should call onCollision and onSafePass with a player index. */}
        <SpikeBallSpawner
          playerRef={controlledPlayerRefs.current[0]} // or [1] for second player
          onCollision={() => handleSpikeCollision(0)} // player index
          onSafePass={() => handleSpikePass(0)}
          spawnInterval={6000}
          lifetime={4000}
        />
      </Canvas>
    </div>
  );
};

export default SpikeBallGame;
