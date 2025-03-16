import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Background from "../../pages/RythmGame/Background.jsx";
import PlayerMario from "../Player/PlayerMario.jsx";
import PlayerWaluigi from "../Player/PlayerWaluigi.jsx";
import SpikeBall from "./SpikeBall.jsx"; 

const ReportPosition = ({ playerRef, playerIndex, ws }) => {
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef?.current && ws?.readyState === WebSocket.OPEN) {
        const pos = new THREE.Vector3();
        playerRef.current.getWorldPosition(pos);
        ws.send(
          JSON.stringify({
            type: "player_position",
            player: playerIndex + 1,
            position: { x: pos.x, y: pos.y },
          })
        );
      }
    }, 100); 
    return () => clearInterval(interval);
  }, [playerRef, playerIndex, ws]);

  return null;
};

const SpikeBallGame = ({
  fpgaControls = {}, 
  players = ["Mario", "Waluigi"],
  localPlayerName = "Mario",
  ws,
  gameObjects = [],
}) => {
  const processedPlayers = players.map((p) =>
    typeof p === "string" ? { username: p } : p
  );
  const numPlayers = processedPlayers.length;

  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  const playerPositions = processedPlayers.map((player, index) => {
    const spacing = 10 / Math.max(1, numPlayers);
    const xPos = (-3 + index * spacing) * 0.3;
    return {
      ...player,
      position: [xPos, -0.35, 0],
    };
  });

  const renderedPlayers = playerPositions.map((player, index) => {
    const isLocal = player.id === localPlayerName.id;
    const control = fpgaControls?.[index + 1] || {}; 
    const PlayerComponent = index === 0 ? PlayerMario : PlayerWaluigi;

    return (
      <React.Fragment key={player.id}> 
      <PlayerComponent
        username={player.username}
        initialPosition={player.position}
        isPlayerPlayer={isLocal}
        click={control.click}
        jumpLow={control.jump}
        left={control.left}
        right={control.right}
        still={control.still}
        disableLateralMovement={true}
        playerRef={controlledPlayerRefs.current[index]}
      />
      <ReportPosition 
        playerRef={controlledPlayerRefs.current[index]} 
        playerIndex={index} 
        ws={ws} 
      />
    </React.Fragment>
    );
  });

  const renderedSpikeBalls = gameObjects
    .filter((obj) => obj.type === "spike")
    .map((spike) => (
      <SpikeBall
        key={spike.id}
        position={[spike.x, spike.y, 0]}
        speed={spike.speed || 4}
        lifetime={spike.lifetime || 4000}
      />
    ));

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 10], fov: 10 }}
        onCreated={({ camera }) => {
          camera.layers.enable(0);
          camera.layers.enable(1);
          camera.layers.enable(2);
        }}
      >
        <Background imagePath="/images/Bowser.jpg" />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        {renderedPlayers}
        {renderedSpikeBalls}
      </Canvas>
    </div>
  );
};

export default SpikeBallGame;
