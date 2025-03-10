import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import Player from "../Player/Player.jsx";
import CoinSpawner from "./CoinSpawner.jsx"; // Your coin spawner component
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import * as THREE from "three";
import './Scene.css';

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

const CoinGame = () => {
  const [score, setScore] = useState(0);
  const controlledPlayerRef = useRef();

  // Called when a coin is collected.
  const handleCoinCollect = () => {
    setScore((prevScore) => prevScore + 1);
  };

  const playerData = { username: "Player", position: [0, -0.7, 0] };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Scoreboard players={[{ username: playerData.username, score }]} />
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 10 }}>
        <Background/>
        <ambientLight intensity={4} />
        <directionalLight position={[10, 10, 5]} castShadow />
        <Player
          username={playerData.username}
          initialPosition={playerData.position}
          isPlayerPlayer={true}
          playerRef={controlledPlayerRef}
        />
        <CoinSpawner
          startPositions={[0, -0.7, 0]} 
          playerRef={controlledPlayerRef}
          onCoinCollect={handleCoinCollect}
        />
      </Canvas>
    </div>
  );
};

export default CoinGame;
