import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Background from "../../pages/RythmGame/Background.jsx";
import PlayerMario from "../Player/PlayerMario.jsx";
import PlayerWaluigi from "../Player/PlayerWaluigi.jsx";
import Coin from "./Coin.jsx";

const useKeyboardControls = () => {
  const [state, setState] = useState({ left: false, right: false, jump: false, still: true });
  useEffect(() => {
    const handle = (down) => (e) => {
      setState((prev) => {
        const next = { ...prev };
        if (e.key === "ArrowLeft") next.left = down;
        if (e.key === "ArrowRight") next.right = down;
        if (e.key === " ") next.jump = down;
        next.still = !next.left && !next.right && !next.jump;
        return next;
      });
    };
    window.addEventListener("keydown", handle(true));
    window.addEventListener("keyup", handle(false));
    return () => {
      window.removeEventListener("keydown", handle(true));
      window.removeEventListener("keyup", handle(false));
    };
  }, []);
  return state;
};

const ReportPosition = ({ playerRef, playerIndex, ws }) => {
  useFrame(() => {
    if (playerRef?.current && ws?.readyState === WebSocket.OPEN) {
      const pos = new THREE.Vector3();
      playerRef.current.getWorldPosition(pos);
      ws.send(JSON.stringify({
        type: "player_position",
        player: playerIndex + 1,
        position: { x: pos.x, y: pos.y }
      }));
    }
  });
  return null;
};

const CoinGame = ({
  fpgaControls = {},
  players = ["Mario", "Waluigi"],
  localPlayerName = "Mario",
  ws,
  gameObjects = [],
}) => {
  const keyboardState = useKeyboardControls();
  const effectiveFpgaControls = {
    ...fpgaControls,
    1: keyboardState
  };

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

  const playerData = processedPlayers.map((player, index) => {
    const spacing = 10 / Math.max(1, numPlayers);
    const xPos = (-3 + index * spacing) * 0.3;
    return { ...player, position: [xPos, -0.7, 0] };
  });

  const renderedPlayers = playerData.map((player, index) => {
    const isLocal = player.username === localPlayerName;
    const control = effectiveFpgaControls?.[index + 1] || {};
    const Component = index === 0 ? PlayerMario : PlayerWaluigi;
    return (
      <React.Fragment key={player.username}>
        <Component
          username={player.username}
          initialPosition={player.position}
          isPlayerPlayer={isLocal}
          jumpLow={control.jump}
          left={control.left}
          right={control.right}
          still={control.still}
          playerRef={controlledPlayerRefs.current[index]}
        />
        <ReportPosition playerRef={controlledPlayerRefs.current[index]} playerIndex={index} ws={ws} />
      </React.Fragment>
    );
  });

  const renderedCoins = gameObjects
    .filter((obj) => obj.type === "coin")
    .map((coin) => (
      <Coin
        key={coin.id}
        position={[coin.x, coin.y, 0]}
        gravity={coin.gravity || 0.06}
        onCollect={() => {}}
      />
    ));

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
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
        <Background imagePath="/images/Castel.jpg" />
        <directionalLight position={[10, 10, 5]} castShadow />
        {renderedPlayers}
        {renderedCoins}
      </Canvas>
    </div>
  );
};

export default CoinGame;
