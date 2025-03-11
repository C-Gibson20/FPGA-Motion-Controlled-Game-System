import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import Server from "../../server";
import "./Scene.css";
import { playBackgroundSound, playJumpSound } from "../../components/Sounds/Sounds";
import CoinSpawner from "../../components/Coin/CoinSpawner";
import * as THREE from "three";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
// import Player from "../../components/Player/Player.jsx";

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

// This wrapper ensures that all its children are forced to a specific layer every frame.
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

const FETCH_INTERVAL = 1000;

// ... (imports and other code remain the same)

const Scene = ({ fpgaControls, players, scores, startPositions, localPlayerName }) => {
  const [playerList, setPlayers] = useState([]);
  // Local score state for coin collection (for the local player)
  const [localScore, setLocalScore] = useState(0);
  const localPlayerRef = useRef();

  useEffect(() => {
    const fetchPlayers = () => setPlayers(Server.getPlayerInfo());
    fetchPlayers();
    const interval = setInterval(fetchPlayers, FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Update the local score when a coin is collected.
  const handleCoinCollect = () => {
    setLocalScore((prev) => prev + 1);
    console.log("Coin collected!");
  };

  // Calculate positions for players so they are evenly spread.
  const updatedPlayers = players.map((player, index) => {
    const totalPlayers = players.length;
    const spacing = 10 / Math.max(1, totalPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      ...player,
      position: [xPos, -0.7, 0],
      // For the local player, use localScore; otherwise, use the parent's scores array.
      score: player.username === localPlayerName ? localScore : (scores[index] || 0),
      // Force the default avatars for 2 players.
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Scoreboard players={updatedPlayers} />

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
          // For player 1 use PlayerMario, for player 2 use PlayerWaluigi.
          if (index === 0) {
            return (
              <PlayerMario
                key={`${player.username}-${index}`}
                username={player.username}
                initialPosition={player.position}
                isPlayerPlayer={player.username === localPlayerName}
                jumpLow={fpgaControls[1]?.jump || false}
                left={fpgaControls[1]?.left || false}
                right={fpgaControls[1]?.right || false}
                still={fpgaControls[1]?.still || false}
                playerRef={player.username === localPlayerName ? localPlayerRef : undefined}
              />
            );
          } else if (index === 1) {
            return (
              <PlayerWaluigi
                key={`${player.username}-${index}`}
                username={player.username}
                initialPosition={player.position}
                isPlayerPlayer={player.username === localPlayerName}
                jumpLow={fpgaControls[2]?.jump || false}
                left={fpgaControls[2]?.left || false}
                right={fpgaControls[2]?.right || false}
                still={fpgaControls[2]?.still || false}
                playerRef={player.username === localPlayerName ? localPlayerRef : undefined}
              />
            );
          } else {
            return null;
          }
        })}

        <CoinSpawner 
          startPositions={startPositions || updatedPlayers.map((p) => p.position)}
          playerRef={localPlayerRef}
          onCoinCollect={handleCoinCollect}
        />
      </Canvas>
    </div>
  );
};

export default Scene;