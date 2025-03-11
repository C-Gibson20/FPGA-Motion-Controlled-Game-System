import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MODELS = {
  MarioIdle: { path: "/models/MarioIdle.glb", scale: 0.003 },
  MarioJump: { path: "/models/MarioJump.glb", scale: 0.003 },
  MarioSideStep: { path: "/models/MarioSideStep.glb", scale: 0.003 },
  MarioRightSideStep: { path: "/models/MarioRightSideStep.glb", scale: 0.003 },
};

const PlayerMario = ({ username, isPlayerPlayer, initialPosition, playerRef, jumpLow, left, right, still }) => {
  const [currentModel, setCurrentModel] = useState("MarioIdle");
  const groupRef = useRef();
  const activeAction = useRef(null);

  // Forward group ref for external access.
  useEffect(() => {
    if (playerRef) {
      playerRef.current = groupRef.current;
    }
  }, [playerRef]);

  const modelData = MODELS[currentModel];
  const { scene } = useGLTF(modelData.path);

  // Load animations from separate GLTF files.
  const { animations: idleAnimations } = useGLTF(MODELS.MarioIdle.path);
  const { animations: jumpAnimations } = useGLTF(MODELS.MarioJump.path);
  const { animations: sideStepAnimations } = useGLTF(MODELS.MarioSideStep.path);
  const { animations: rightSideStepAnimations } = useGLTF(MODELS.MarioRightSideStep.path);

  // Create animation actions.
  const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
  const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
  const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);
  const { actions: rightSideStepActions } = useAnimations(rightSideStepAnimations, groupRef);

  const velocityY = useRef(0);
  const speed = 0.02;
  const jumpStrength = 0.07;
  const gravity = 0.004;
  const isJumping = useRef(false);
  const keys = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  });

  // Set up keyboard controls for local player.
  useEffect(() => {
    if (!isPlayerPlayer) return;

    const handleKeyDown = (e) => {
      if (keys.current[e.key] !== undefined) keys.current[e.key] = true;
      if (e.key === " " && !isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("MarioJump");
      }
    };

    const handleKeyUp = (e) => {
      if (keys.current[e.key] !== undefined) keys.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlayerPlayer]);

  useFrame(() => {
    if (!groupRef.current) return;
    let didMove = false;

    // Apply FPGA (WS) controls first.
    if (jumpLow) {
      if (!isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("MarioJump");
      }
    }
    if (left) {
      groupRef.current.position.x -= speed;
      if (currentModel !== "MarioSideStep") setCurrentModel("MarioSideStep");
      didMove = true;
    }
    if (right) {
      groupRef.current.position.x += speed;
      if (currentModel !== "MarioRightSideStep") setCurrentModel("MarioRightSideStep");
      didMove = true;
    }
    if (still && !didMove && !isJumping.current && currentModel !== "MarioIdle") {
      setCurrentModel("MarioIdle");
    }

    // Then apply keyboard controls (if local).
    if (isPlayerPlayer) {
      if (keys.current.ArrowLeft) {
        groupRef.current.position.x -= speed;
        if (currentModel !== "MarioSideStep") setCurrentModel("MarioSideStep");
        didMove = true;
      }
      if (keys.current.ArrowRight) {
        groupRef.current.position.x += speed;
        if (currentModel !== "MarioRightSideStep") setCurrentModel("MarioRightSideStep");
        didMove = true;
      }
    }

    // Update jumping motion.
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
    // Fade out previous animation.
    if (activeAction.current) {
      activeAction.current.fadeOut(0.2);
    }
    let action;
    if (currentModel === "MarioIdle") {
      action = idleActions["mixamo.com"] || Object.values(idleActions)[0];
    } else if (currentModel === "MarioJump") {
      action = jumpActions["mixamo.com"] || Object.values(jumpActions)[0];
    } else if (currentModel === "MarioSideStep") {
      action = sideStepActions["mixamo.com"] || Object.values(sideStepActions)[0];
    } else if (currentModel === "MarioRightSideStep") {
      action = rightSideStepActions["mixamo.com"] || Object.values(rightSideStepActions)[0];
    }
    if (action) {
      action.reset().fadeIn(0.2).play();
      action.setLoop(THREE.LoopRepeat, Infinity);
      activeAction.current = action;
    }
  }, [currentModel, idleActions, jumpActions, sideStepActions, rightSideStepActions]);

  return (
    <group ref={groupRef} position={initialPosition}>
      <ambientLight
        intensity={4}
        onUpdate={(self) => {
          self.layers.disable(0);
          self.layers.disable(2);
          self.layers.enable(1);
        }}
      />
      <primitive object={scene} scale={MODELS[currentModel].scale} />
    </group>
  );
};

export default PlayerMario;
