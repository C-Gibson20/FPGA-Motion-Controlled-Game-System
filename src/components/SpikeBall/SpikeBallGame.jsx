import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import Player from "../Player/Player.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import * as THREE from "three";
import SpikeBall from "./SpikeBall.jsx";
// import './Scene.css';

const Background = () => {
  const texture = useTexture("/images/Castel.jpg");

  // Ensure correct color encoding
  texture.encoding = THREE.sRGBEncoding;
  texture.colorSpace = THREE.SRGBColorSpace;

  const { scene } = useThree();
  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);

  return null;
};

const SpikeBallGame = () => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(1);
  const controlledPlayerRef = useRef();

  const handleSpikeCollision = () => {
    setLives((prev) => Math.max(prev - 1, 0));
    console.log("💥 Collision! Lives:", lives - 1);
  };

  const handleSpikePass = () => {
    setScore((prev) => prev + 1);
    console.log("✅ Safe! Score:", score + 1);
  };

  const playerData = { username: "Player", position: [0, -0.7, 0] };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Scoreboard
        players={[{ username: playerData.username, score }]}
        lives={lives}
      />
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
          playerRef={controlledPlayerRef}
          onCollision={handleSpikeCollision}
          onSafePass={handleSpikePass}
        />
      </Canvas>
    </div>
  );
};


export default SpikeBallGame;
