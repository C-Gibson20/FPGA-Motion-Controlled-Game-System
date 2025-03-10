import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import Server from "./server";
import './Scene.css';
import {playBackgroundSound, playJumpSound} from "./Sounds";
import CoinSpawner from "./CoinSpawner";
import Player from "./Player";
import Scoreboard from "./Scoreboard";
import * as THREE from "three";
import SpikeBall from "./SpikeBall";

const MODELS = {
  MarioIdle: { path: "/models/MarioIdle.glb", scale: 0.003 },
  MarioJump: { path: "/models/MarioJump.glb", scale: 0.003 },
  MarioSideStep: { path: "/models/MarioSideStep.glb", scale: 0.003 },
};

const Background = () => {
  const texture = useTexture("/images/background2.png");

  // Ensure correct color encoding
  texture.encoding = THREE.sRGBEncoding;
  texture.colorSpace = THREE.SRGBColorSpace;

  const { scene } = useThree();

  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);

  return null;
};

const FETCH_INTERVAL = 1000;

const Scene = () => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchPlayers = () => setPlayers(Server.getPlayerInfo());
    fetchPlayers();
    const interval = setInterval(fetchPlayers, FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Update players with positions
  const updatedPlayers = players.map((player, index) => {
    const totalPlayers = players.length;
    const spacing = 10 / Math.max(1, totalPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;

    return {
      ...player,
      position: [xPos, -0.7, 0], // attach position for CoinSpawner
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Scoreboard players={players} />

      <Canvas shadows camera={{ position: [0, 0, 10], fov: 10 }} style={{ display: "block" }}>
        <Background />

        <ambientLight intensity={4} />
        <directionalLight position={[10, 10, 5]} castShadow />

        {updatedPlayers.map((player) => (
          <Player
            key={player.username}
            username={player.username}
            model={player.model}
            initialPosition={player.position}
            isPlayerPlayer={player.username === "John"}
          />
        ))}

        <CoinSpawner startPositions={updatedPlayers.map(p => p.position)} />
        <SpikeBall />

      </Canvas>
    </div>
  );
};

export default Scene;
