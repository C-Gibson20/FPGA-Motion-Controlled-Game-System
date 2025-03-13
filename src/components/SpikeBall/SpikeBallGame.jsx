import React, { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import SpikeBallSpawner from "./SpikeBallSpawner.jsx";
import Background from "../../pages/RythmGame/Background.jsx";

const SpikeBallGame = ({
  players = ["Mario", "Waluigi"],
  fpgaControls = {},
  ws,
  localPlayerName = "Mario"
}) => {
  // Process players
  const processedPlayers = players.map(p =>
    typeof p === "string" ? { username: p } : p
  );
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  const [scores, setScores] = useState(Array(numPlayers).fill(0));
  const controlledPlayerRefs = useRef(players.map(() => React.createRef()));

  const handleTurn = (playerIndex, collisionStatus) => {
    setScores((prevScores) => {
      const updatedScores = [...prevScores];
      updatedScores[playerIndex] += collisionStatus * 10; 
      return updatedScores;
    });
  };

  // Build updated players for Scoreboard.
  const updatedPlayers = processedPlayers.map((player, index) => {
    const username = player.username;
    const spacing = 10 / Math.max(1, numPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      username,
      position: [xPos, -0.7, 0],
      score: username === localPlayerName ? scores[index] : scores[index] || 0,
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
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
        <Background  imagePath="/images/Bowser.jpg"/>
        <directionalLight castShadow intensity={1} position={[5, 5, 5]} />

        {updatedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          if (index === 0) {
            return (
              <PlayerMario
                key={`mario-${index}`}
                username={player.username}
                initialPosition={[-0.65, -0.35, 0]}
                isPlayerPlayer={isLocal} // Only the local player's component handles keyboard input.
                jumpLow={fpgaControls?.[1]?.jump || false}
                //left={fpgaControls?.[1]?.left || false}
                //right={fpgaControls?.[1]?.right || false}
                still={fpgaControls?.[1]?.still || false}
                playerRef={controlledPlayerRefs.current[index]}
                ws={ws}
              />
            );
          } else if  (index === 1) {
            return (
              <PlayerWaluigi
                key={`waluigi-${index}`}
                username={player.username}
                initialPosition={[0.5, -0.35, 0]}
                isPlayerPlayer={isLocal}
                jumpLow={fpgaControls?.[2]?.jump || false}
                //left={fpgaControls?.[2]?.left || false}
                //right={fpgaControls?.[2]?.right || false}
                still={fpgaControls?.[2]?.still || false}
                playerRef={controlledPlayerRefs.current[index]}
                ws={ws}
              />
            );
          } else {
            return null;
          }
        })}
        <SpikeBallSpawner
          playerRefs={controlledPlayerRefs.current}
          onTurn={handleTurn} 
          spawnInterval={2000}
          lifetime={4000}
        />
      </Canvas>
    </div>
  );
};

export default SpikeBallGame;
