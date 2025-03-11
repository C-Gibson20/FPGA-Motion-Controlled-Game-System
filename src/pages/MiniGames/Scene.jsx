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
import Player from "../../components/Player/Player.jsx";

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

const Scoreboard = ({ players }) => {
  return (
    <div className="scoreboard">
      <ul>
        {players.map((p, index) => (
          <li key={`${p.username}-${index}`} className="leaderboard-entry">
            <img
              src={p.avatar || "/images/default-avatar.png"}
              alt={p.username}
              className="player-avatar"
            />
            <div className="score-box">
              <span className="player-score">{p.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FETCH_INTERVAL = 1000;

const Scene = ({ fpgaControls, players, scores, startPositions, localPlayerName }) => {
  const [playerList, setPlayers] = useState([]);
  // Local score state for coin collection
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
    setLocalScore((prevScore) => prevScore + 1);
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
      // Use the localScore for the local player.
      score: player.username === localPlayerName ? localScore : (scores[index] || 0),
      avatar: player.avatar || "/images/default-avatar.png",
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Scoreboard players={updatedPlayers} />

      <Canvas 
      shadows 
      camera={{ position: [0, 0, 10], fov: 10 }} 
      onCreated={({ camera }) => {
        // Enable both layer 0 (for coins) and layer 1 (for the player and its light)
        camera.layers.enable(0);
        camera.layers.enable(1);
        camera.layers.enable(2);
      }}
      style={{ display: "block" }}>
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
          } 
        })}
        <CoinLayerGroup layer={2}>
          <CoinSpawner
            startPositions={startPositions || updatedPlayers.map((p) => p.position)}
            playerRef={localPlayerRef}
            onCoinCollect={handleCoinCollect}
          />
        </CoinLayerGroup>
      </Canvas>
    </div>
  );
};

export default Scene;
