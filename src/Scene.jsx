import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture, useAnimations } from "@react-three/drei";
import Server from "./server";

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

const Player = ({ username, isPlayerPlayer, model, initialPosition, jumpLow, left, right, still }) => {
  const[currentModel, setCurrentModel] = useState("MarioIdle");
  const playerRef = useRef();

  const modelData = MODELS[currentModel];
  const { scene, animations } = useGLTF(modelData.path);
  const { scene: idleScene, animations: idleAnimations } = useGLTF(MODELS.MarioIdle.path);
  const { scene: jumpScene, animations: jumpAnimations } = useGLTF(MODELS.MarioJump.path);
  const { scene: sideStepScene, animations: sideStepAnimations } = useGLTF(MODELS.MarioSideStep.path);
  const { actions: idleActions } = useAnimations(idleAnimations, playerRef);
  const { actions: jumpActions } = useAnimations(jumpAnimations, playerRef);
  const { actions: sideStepActions } = useAnimations(sideStepAnimations, playerRef);
  const velocityY = useRef(0);
  const speed = 0.01;
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
    if (jumpLow && !isJumping.current) {
      console.log("Jumping due to WebSocket event!");
      isJumping.current = true;
      velocityY.current = jumpStrength;
      setCurrentModel("MarioJump");
    }
  }, [jumpLow]);
  
  useEffect(() => {
    if (!isPlayerPlayer) {
      return;
    }
  
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

    if (keys.current.ArrowUp) {
      playerRef.current.position.y += speed;
    }
    if (keys.current.ArrowDown) {
      playerRef.current.position.y -= speed;
    }
    if (left) {
      playerRef.current.position.x -= speed;
    }
    if (right) {
      playerRef.current.position.x += speed;
    }

    if (isJumping.current) {
      playerRef.current.position.y += velocityY.current;
      velocityY.current -= gravity;

      if (playerRef.current.position.y <= initialPosition[1]) {
        playerRef.current.position.y = initialPosition[1];
        isJumping.current = false;
        velocityY.current = 0;
        setCurrentModel("MarioIdle");
      }
    }
  });


  useEffect(() => {
    idleActions["mixamo.com"]?.stop();
    jumpActions["mixamo.com"]?.stop();
    sideStepActions["mixamo.com"]?.stop();
    if (currentModel === "MarioIdle") {
      idleActions["mixamo.com"]?.play();
    } else if (currentModel === "MarioJump") {
      jumpActions["mixamo.com"]?.play();
    } else if(currentModel === "MarioSideStep") {
      sideStepActions["mixamo.com"]?.play();
    }
  }, [currentModel])

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

const Scene = ({ jumpLow, left, right, still }) => {
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

      <Canvas shadows camera={{ position: [0, 0, 10], fov: 10 }} style={{ display: "block" }}>
        <Background />

        <ambientLight intensity={4} />
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
              isPlayerPlayer={player.username === "John"} // Ensure this is correct
              jumpLow={jumpLow} // Pass jumpLow prop
              left={left}
              right={right}
              still={still}
            />
          );
        })}
      </Canvas>
    </div>
  );
};

export default Scene;
