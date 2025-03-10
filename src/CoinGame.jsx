// CoinGame.jsx
import React, { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Player from "./Player";
import CoinSpawner from "./CoinSpawner";
import Scoreboard from "./Scoreboard";

const CoinGame = () => {
  const [score, setScore] = useState(0);
  // This ref will be passed to the controlled player for collision detection.
  const controlledPlayerRef = useRef();

  // Called when a coin is collected.
  const handleCoinCollect = () => {
    setScore((prevScore) => prevScore + 1);
  };

  // For simplicity we assume one player with a starting position.
  const playerData = { username: "Player", position: [0, -0.7, 0] };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Scoreboard players={[{ username: playerData.username, score }]} />
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} castShadow />
        <Player
          username={playerData.username}
          initialPosition={playerData.position}
          isPlayerPlayer={true}
          playerRef={controlledPlayerRef}
        />
        <CoinSpawner
          startPositions={[playerData.position]} 
          playerRef={controlledPlayerRef}
          onCoinCollect={handleCoinCollect}
        />
      </Canvas>
    </div>
  );
};

export default CoinGame;