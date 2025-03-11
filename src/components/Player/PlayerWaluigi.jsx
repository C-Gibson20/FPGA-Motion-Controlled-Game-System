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

  // This ref tracks whether a jump has already been triggered.
  const jumpTriggered = useRef(false);

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
  const speed = 0.001;
  const jumpStrength = 0.07;
  const gravity = 0.9;
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

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    let didMove = false;
    
    // FPGA controls first: Trigger jump only once on the rising edge.
    if (jumpLow && !jumpTriggered.current && !isJumping.current) {
      jumpTriggered.current = true;
      isJumping.current = true;
      velocityY.current = jumpStrength;
      setCurrentModel("WaluigiJump");
    }
    if (!jumpLow) {
      // Reset jump trigger once FPGA flag is off.
      jumpTriggered.current = false;
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
    // Then apply keyboard controls (if local).
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
      velocityY.current -= gravity * delta;
      if (groupRef.current.position.y <= initialPosition[1]) {
        groupRef.current.position.y = initialPosition[1];
        isJumping.current = false;
        velocityY.current = 0;
        setCurrentModel("WaluigiIdle");
      }
    }
  });

  useEffect(() => {
    // Fade out the previous animation.
    if (activeAction.current) {
      activeAction.current.fadeOut(0.2);
    }
    let action;
    if (currentModel === "WaluigiIdle") {
      action = idleActions["mixamo.com"] || Object.values(idleActions)[0];
    } else if (currentModel === "WaluigiJump") {
      action = jumpActions["mixamo.com"] || Object.values(jumpActions)[0];
      if (action) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
    } else if (currentModel === "WaluigiSideStep") {
      action = sideStepActions["mixamo.com"] || Object.values(sideStepActions)[0];
      if (action) action.setLoop(THREE.LoopRepeat, Infinity);
    } else if (currentModel === "WaluigiRightSideStep") {
      action = rightSideStepActions["mixamo.com"] || Object.values(rightSideStepActions)[0];
      if (action) action.setLoop(THREE.LoopRepeat, Infinity);
    }
    if (action) {
      action.reset().fadeIn(0.2).play();
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
