import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import Server from "./server";
import CoinSpawner from "./CoinSpawner";
import SpikeBall from "./SpikeBall";

const MODELS = {
  MarioIdle: { path: "/models/MarioIdle.glb", scale: 0.003 },
  MarioJump: { path: "/models/MarioJump.glb", scale: 0.003 },
  MarioSideStep: { path: "/models/MarioSideStep.glb", scale: 0.003 },
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
  const [currentModel, setCurrentModel] = useState("MarioIdle");
  const groupRef = useRef(); // This group will maintain the consistent location
  const playerRef = useRef(); // Reference for the model primitive if needed

  const modelData = MODELS[currentModel];
  const { scene, animations } = useGLTF(modelData.path);
  const { scene: idleScene, animations: idleAnimations } = useGLTF(MODELS.MarioIdle.path);
  const { scene: jumpScene, animations: jumpAnimations } = useGLTF(MODELS.MarioJump.path);
  const { scene: sideStepScene, animations: sideStepAnimations } = useGLTF(MODELS.MarioSideStep.path);

  const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
  const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
  const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);

  const velocityY = useRef(0);
  const speed = 0.05;
  const jumpStrength = 0.07; // Jump height
  const gravity = 0.004; // Gravity effect
  const isJumping = useRef(false);
  const keys = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  });

  useEffect(() => {
    if (!isPlayerPlayer) return;

    const handleKeyDown = (e) => {
      if (keys.current[e.key] !== undefined) {
        keys.current[e.key] = true;
      }
      if (e.key === " " && !isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("MarioJump");
      }
    };

    const handleKeyUp = (e) => {
      if (keys.current[e.key] !== undefined) {
        keys.current[e.key] = false;
      }
      if (e.key === " ") {
        if (!isJumping.current) {
          isJumping.current = true;
          velocityY.current = jumpStrength;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlayerPlayer]);

  useFrame(() => {
    if (!isPlayerPlayer || !groupRef.current) {
      return;
    }

    // Update the group's position so the new model stays in the same location
    if (keys.current.ArrowUp) {
      groupRef.current.position.y += speed;
    }
    if (keys.current.ArrowDown) {
      groupRef.current.position.y -= speed;
    }
    if (keys.current.ArrowLeft) {
      groupRef.current.position.x -= speed;
      setCurrentModel("MarioSideStep");
    }
    if (keys.current.ArrowRight) {
      groupRef.current.position.x += speed;
      setCurrentModel("MarioSideStep");
    }

    if (isJumping.current) {
      groupRef.current.position.y += velocityY.current;
      velocityY.current -= gravity;

      if (groupRef.current.position.y <= initialPosition[1]) {
        groupRef.current.position.y = initialPosition[1];
        isJumping.current = false;
        velocityY.current = 0;
        setCurrentModel("MarioIdle");
      }
    }
  });

  useEffect(() => {
    // Stop all animations
    idleActions["mixamo.com"]?.stop();
    jumpActions["mixamo.com"]?.stop();
    sideStepActions["mixamo.com"]?.stop();

    // Start the current model's animation
    if (currentModel === "MarioIdle") {
      idleActions["mixamo.com"]?.play();
    } else if (currentModel === "MarioJump") {
      jumpActions["mixamo.com"]?.play();
    } else if (currentModel === "MarioSideStep") {
      sideStepActions["mixamo.com"]?.play();
    }
  }, [currentModel, idleActions, jumpActions, sideStepActions]);

  return (
    <group ref={groupRef} position={initialPosition}>
      {/* The primitive model is attached to the group */}
      <primitive ref={playerRef} object={scene} scale={modelData.scale} />
    </group>
  );
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
