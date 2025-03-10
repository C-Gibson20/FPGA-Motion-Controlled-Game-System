import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import Player from "../Player/Player.jsx";
import CoinSpawner from "./CoinSpawner.jsx"; // Your coin spawner component
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import * as THREE from "three";

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

// This wrapper ensures that all its children are forced to layer 0 every frame.
const CoinLayerGroup = ({ children, layer = 0 }) => {
  const groupRef = useRef();
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        child.layers.set(layer);
      });
    }
  });
  return <group ref={groupRef}>{children}</group>;
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
      <Canvas
        shadows
        camera={{ position: [0, 0, 10], fov: 10 }}
        onCreated={({ camera }) => {
          // Enable both layer 0 (for coins) and layer 1 (for the player and its light)
          camera.layers.enable(0);
          camera.layers.enable(1);
          camera.layers.enable(2);
        }}
      >
        <Background />
        {/* Remove global lights */}
        <Player
          username={playerData.username}
          initialPosition={playerData.position}
          isPlayerPlayer={true}
          playerRef={controlledPlayerRef}
        />
        {/* Wrap CoinSpawner so that its coins are forced to layer 0 */}
        <CoinLayerGroup layer={2}>
          <CoinSpawner
            startPositions={[playerData.position, playerData.position]}
            playerRef={controlledPlayerRef}
            onCoinCollect={handleCoinCollect}
          />
        </CoinLayerGroup>
      </Canvas>
    </div>
  );
};

export default CoinGame;
