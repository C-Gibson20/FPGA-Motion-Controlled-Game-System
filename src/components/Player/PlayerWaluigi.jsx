import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MODELS = {
  WaluigiIdle: { path: "/models/WaluigiIdle.glb", scale: 0.004 },
  WaluigiJump: { path: "/models/WaluigiJump.glb", scale: 0.004 },
  WaluigiSideStep: { path: "/models/WaluigiSideStep.glb", scale: 0.004 },
  WaluigiRightSideStep: { path: "/models/WaluigiRightSideStep.glb", scale: 0.004 },
};

const PlayerWaluigi = ({ username, isPlayerPlayer, initialPosition, playerRef, jumpLow, left, right, still }) => {
  const [currentModel, setCurrentModel] = useState("WaluigiIdle");
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
  const { animations: idleAnimations } = useGLTF(MODELS.WaluigiIdle.path);
  const { animations: jumpAnimations } = useGLTF(MODELS.WaluigiJump.path);
  const { animations: sideStepAnimations } = useGLTF(MODELS.WaluigiSideStep.path);
  const { animations: rightSideStepAnimations } = useGLTF(MODELS.WaluigiRightSideStep.path);

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

  // Keyboard controls for local player.
  useEffect(() => {
    if (!isPlayerPlayer) return;
    const handleKeyDown = (e) => {
      if (keys.current[e.key] !== undefined) keys.current[e.key] = true;
      if (e.key === " " && !isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("WaluigiJump");
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
    
    // FPGA controls first.
    if (jumpLow) {
      if (!isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("WaluigiJump");
      }
    }
    if (left) {
      groupRef.current.position.x -= speed;
      if (currentModel !== "WaluigiSideStep") setCurrentModel("WaluigiSideStep");
      didMove = true;
    }
    if (right) {
      groupRef.current.position.x += speed;
      if (currentModel !== "WaluigiRightSideStep") setCurrentModel("WaluigiRightSideStep");
      didMove = true;
    }
    if (still && !didMove && !isJumping.current && currentModel !== "WaluigiIdle") {
      setCurrentModel("WaluigiIdle");
    }
    // Then keyboard controls (if local).
    if (isPlayerPlayer) {
      if (keys.current.ArrowLeft) {
        groupRef.current.position.x -= speed;
        if (currentModel !== "WaluigiSideStep") setCurrentModel("WaluigiSideStep");
        didMove = true;
      }
      if (keys.current.ArrowRight) {
        groupRef.current.position.x += speed;
        if (currentModel !== "WaluigiRightSideStep") setCurrentModel("WaluigiRightSideStep");
        didMove = true;
      }
    }
    if (isJumping.current) {
      groupRef.current.position.y += velocityY.current;
      velocityY.current -= gravity;
      if (groupRef.current.position.y <= initialPosition[1]) {
        groupRef.current.position.y = initialPosition[1];
        isJumping.current = false;
        velocityY.current = 0;
        setCurrentModel("WaluigiIdle");
      }
    }
  });

  useEffect(() => {
    if (activeAction.current) {
      activeAction.current.fadeOut(0.2);
    }
    let action;
    if (currentModel === "WaluigiIdle") {
      action = idleActions["mixamo.com"] || Object.values(idleActions)[0];
    } else if (currentModel === "WaluigiJump") {
      action = jumpActions["mixamo.com"] || Object.values(jumpActions)[0];
    } else if (currentModel === "WaluigiSideStep") {
      action = sideStepActions["mixamo.com"] || Object.values(sideStepActions)[0];
    } else if (currentModel === "WaluigiRightSideStep") {
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

export default PlayerWaluigi;
