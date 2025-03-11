import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import Server from "../../server";
import "./Scene.css";
import { playBackgroundSound, playJumpSound } from "../../components/Sounds/Sounds";
import CoinSpawner from "../../components/Coin/CoinSpawner";
import * as THREE from "three";
// import SpikeBall from "./SpikeBall";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";

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

const FETCH_INTERVAL = 1000;

const Scene = ({ fpgaControls, players, scores, startPositions, onCoinCollect, localPlayerName }) => {
  const [playerList, setPlayers] = useState([]);
  const localPlayerRef = useRef();

  useEffect(() => {
    const fetchPlayers = () => setPlayers(Server.getPlayerInfo());
    fetchPlayers();
    const interval = setInterval(fetchPlayers, FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Calculate positions for players so they are evenly spread.
  const updatedPlayers = players.map((player, index) => {
    const totalPlayers = players.length;
    const spacing = 10 / Math.max(1, totalPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      ...player,
      position: [xPos, -0.7, 0],
      score: scores[index] || 0,
      // Force the avatar regardless of what's passed in:
      avatar: index === 0 ? "/images/mario-icon.png" : "/images/waluigi-icon.png",
    };
  });
  

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Scoreboard players={updatedPlayers} />

      <Canvas shadows camera={{ position: [0, 0, 10], fov: 10 }} style={{ display: "block" }}>
        <Background />
        <ambientLight intensity={4} />
        <directionalLight position={[10, 10, 5]} castShadow />

        {updatedPlayers.map((player, index) => {
          // For player 1 (index 0) use PlayerMario, for player 2 (index 1) use PlayerWaluigi.
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

        {/* Extra game elements */}
        <CoinSpawner startPositions={startPositions} playerRef={localPlayerRef} onCoinCollect={onCoinCollect} />
      </Canvas>
    </div>
  );
};

export default Scene;
