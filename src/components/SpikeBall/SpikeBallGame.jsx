import React, { useState, useEffect, useRef } from "react"; 
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import Player from "../Player/Player.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import * as THREE from "three";
import SpikeBall from "./SpikeBall.jsx";
import "./SpikeBallGame.css";


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

const SpikeBallGame = () => {
  const [speed, setSpeed] = useState(0.5);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const controlledPlayerRef = useRef();

  const handleSpikeCollision = () => {
    setLives((prev) => {
      const updated = Math.max(prev - 1, 0);
      if (updated === 0) {
        setGameOver(true);
      }
      return updated;
    });
    console.log("💥 Collision! Lives:", lives - 1);
  };

  const handleSpikePass = () => {
    setScore((prev) => prev + 1);
    setSpeed(prev => prev + 0.1)
    console.log("✅ Safe! Score:", score + 1);
  };

  const playerData = { username: "Player", position: [0, -0.7, 0] };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Scoreboard
        players={[{ username: playerData.username, score }]}
        lives={lives}
      />

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

          <div className="game-over-score">Score: {score}</div>
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
        <Player
          username={playerData.username}
          initialPosition={playerData.position}
          isPlayerPlayer={true}
          playerRef={controlledPlayerRef}
        />
        <SpikeBall
          speed={speed}
          playerRef={controlledPlayerRef}
          onCollision={handleSpikeCollision}
          onSafePass={handleSpikePass}
        />
      </Canvas>
    </div>
  );
};

export default SpikeBallGame;
