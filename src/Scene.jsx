import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import Server from "./server";
import {playBackgroundSound, playJumpSound} from "./Sounds";
import * as THREE from "three";

const MODELS = {
  Mario: { path: "/models/Mario.glb", scale: 0.3 },
  Luigi: { path: "/models/Luigi.glb", scale: 1.5 },
};

const Background = () => {
  const texture = useTexture("/images/background.png");
  const { scene } = useThree();

  useEffect(() => {
    scene.background = texture;
  }, [scene, texture]);

  return null;
};

const Player = ({ username, isPlayerPlayer, model, initialPosition }) => {
  const modelData = MODELS[model] || MODELS.Mario;
  const { scene, animations } = useGLTF(modelData.path);
  const playerRef = useRef();
  const { actions } = useAnimations(animations, playerRef);

  const speed = 0.05;
  const jumpStrength = 0.1; // Jump height
  const gravity = 0.00015; // Gravity effect

  const isJumping = useRef(false);
  const velocityY = useRef(0); // Y-axis velocity
  const jumpHoldFrames = useRef(0);
  const keys = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  });

  useEffect(() => {
    if (!isPlayerPlayer) {
      return;
    }

    const handleKeyDown = (e) => {
      if (keys.current[e.key] !== undefined) {
        keys.current[e.key] = true;
      }
    };

    const handleKeyUp = (e) => {
      if (keys.current[e.key] !== undefined) {
        keys.current[e.key] = false;
      }
      if (e.key === " ") {
        // Trigger jump on key release
        if (!isJumping.current) {
          isJumping.current = true;
          velocityY.current = jumpStrength;
          playJumpSound();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // use keyboard for now
  useFrame(() => {
    if (!isPlayerPlayer || !playerRef.current) {
      return;
    }

    let ArrowUpJump = false;

    if (keys.current.ArrowUp) {
      playerRef.current.position.y += speed;
      ArrowUpJump = true;
    }
    if (keys.current.ArrowDown) {
      playerRef.current.position.y -= speed;
    }
    if (keys.current.ArrowLeft) {
      playerRef.current.position.x -= speed;
    }
    if (keys.current.ArrowRight) {
      playerRef.current.position.x += speed;
    }

    if (isJumping.current) {
      playerRef.current.position.y += velocityY.current;
      jumpHoldFrames.current++;
      velocityY.current -= gravity * (1 + jumpHoldFrames.current * 0.1); // Apply gravity

      // Stop jumping when reaching the ground
      if (playerRef.current.position.y <= initialPosition[1]) {
        playerRef.current.position.y = initialPosition[1]; // Reset to ground level
        isJumping.current = false;
        velocityY.current = 0;
      }
    }
  });

  return <primitive ref={playerRef} object={scene} position={initialPosition} scale={modelData.scale} />;
};

const Scoreboard = ({ players }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center",
        padding: "10px 0",
        zIndex: 10,
      }}
    >
      {players.map((p) => (
        <h1 key={p.username} style={{ color: "white", fontSize: "24px", margin: 0 }}>
          {p.username}: {p.score}
        </h1>
      ))}
    </div>
  );
};

const FETCH_INTERVAL = 1000

const Scene = () => {
  const [players, setPlayers] = useState([]);
  

  useEffect(() => {
    const fetchPlayers = () => setPlayers(Server.getPlayerInfo());
    fetchPlayers();
    const interval = setInterval(fetchPlayers, FETCH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Scoreboard players={players} />
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 10 }} style={{ display: "block" }}>
        <Background />

        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} castShadow />

        {players.map((player, index) => {
          // spread players evenely

          const totalPlayers = players.length;
          const spacing = 10 / Math.max(1, totalPlayers);
          let xPos = -3 + index * spacing;
          xPos = xPos * 0.3;

          return (
            <Player
              key={player.username}
              username={player.username}
              model={player.model}
              initialPosition={[xPos, -0.7, 0]}
              isPlayerPlayer={player.username == "John"} // what logic do we have to determine who is who? frontend seems to be multiplayer rn
            />
          );
        })}
      </Canvas>
    </div>
  );
};

export default Scene;
