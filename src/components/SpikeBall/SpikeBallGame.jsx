import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import SpikeBall from "./SpikeBall.jsx";
import "./SpikeBallGame.css";

// Background component remains the same.
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

// Revised SpikeBallGame component with default props.
const SpikeBallGame = ({ players = [], fpgaControls = {}, ws }) => {
  const numPlayers = players.length;
  if (numPlayers === 0) return <div>No players</div>;

  // Initialize scores and lives arrays for each player.
  const [scores, setScores] = useState(Array(numPlayers).fill(0));
  const [lives, setLives] = useState(Array(numPlayers).fill(2));
  const [gameOver, setGameOver] = useState(false);

  // Create an array of refs—one for each player.
  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  // Collision handling: update lives for the colliding player.
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

  // Increase score for a safe pass.
  const handleSpikePass = (playerIndex) => {
    setScores(prev => {
      const updated = [...prev];
      updated[playerIndex] = updated[playerIndex] + 1;
      console.log(`✅ Safe for player ${playerIndex}: Score: ${updated[playerIndex]}`);
      return updated;
    });
  };

  // Prepare player data for the Scoreboard.
  const updatedPlayers = players.map((name, index) => ({
    username: name,
    score: scores[index] || 0,
    avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png"
  }));

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Render Scoreboard once */}
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
      >
        <Background />
        <directionalLight castShadow intensity={1} position={[5, 5, 5]} />

        {players.map((name, index) => {
          if (index === 0) {
            return (
              <PlayerMario
                key={`mario-${index}`}
                username={name}
                initialPosition={[-1, -0.7, 0]} // Adjust as needed
                isPlayerPlayer={true}
                // Use fpgaControls[1] or default to an empty object.
                fpgaControls={fpgaControls[1] || {}}
                playerRef={controlledPlayerRefs.current[index] || null}
                ws={ws}
              />
            );
          } else if (index === 1) {
            return (
              <PlayerWaluigi
                key={`waluigi-${index}`}
                username={name}
                initialPosition={[1, -0.7, 0]} // Adjust as needed
                isPlayerPlayer={true}
                fpgaControls={fpgaControls[2] || {}}
                playerRef={controlledPlayerRefs.current[index] || null}
                ws={ws}
              />
            );
          } else {
            return null;
          }
        })}
        <SpikeBall />
      </Canvas>
    </div>
  );
};

export default SpikeBallGame;
