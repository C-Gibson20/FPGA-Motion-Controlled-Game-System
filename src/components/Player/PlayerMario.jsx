import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playJumpSound } from "../Sounds/Sounds.jsx";

const MODELS = {
  MarioIdle: { path: "/models/MarioIdle.glb", scale: 0.003 },
  MarioJump: { path: "/models/MarioJump.glb", scale: 0.003 },
  MarioSideStep: { path: "/models/MarioLeftStep.glb", scale: 0.003 },
  MarioRightSideStep: { path: "/models/MarioRightStep.glb", scale: 0.003 },
  MarioBackFlip: { path: "/models/MarioBackFlip.glb", scale: 0.003 },
};

const PlayerMario = ({
  username,
  isPlayerPlayer,
  initialPosition,
  playerRef,
  jumpLow,
  click,
  disableLateralMovement = false,
}) => {
  const [currentModel, setCurrentModel] = useState("MarioIdle");
  const groupRef = useRef();
  const activeAction = useRef(null);
  const jumpTriggeredRef = useRef(false);
  const clickTriggeredRef = useRef(false);

  const modelData = MODELS[currentModel];
  const { scene } = useGLTF(modelData.path);

  // Load animations
  const { animations: idleAnimations } = useGLTF(MODELS.MarioIdle.path);
  const { animations: jumpAnimations } = useGLTF(MODELS.MarioJump.path);
  const { animations: clickAnimations } = useGLTF(MODELS.MarioBackFlip.path);
  const { animations: sideStepAnimations } = useGLTF(MODELS.MarioSideStep.path);
  const { animations: rightSideStepAnimations } = useGLTF(MODELS.MarioRightSideStep.path);

  const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
  const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
  const { actions: clickActions } = useAnimations(clickAnimations, groupRef);
  const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);
  const { actions: rightSideStepActions } = useAnimations(rightSideStepAnimations, groupRef);

  const velocityY = useRef(0);
  const speed = 0.005;
  const jumpStrength = 0.07;
  const gravity = 0.9;
  const isJumping = useRef(false);
  const isBackFlipping = useRef(false);
  const keys = useRef({
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  });

  // Expose ref externally
  useEffect(() => {
    if (playerRef) {
      playerRef.current = groupRef.current;
    }
  }, [playerRef]);

  // Local keyboard controls
  useEffect(() => {
    if (!isPlayerPlayer) return;

    const handleKeyDown = (e) => {
      if (keys.current[e.key] !== undefined) keys.current[e.key] = true;
      if (e.key === " " && !isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("MarioJump");
        playJumpSound();
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

  // Main animation and movement logic
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    let didMove = false;

    // FPGA-based jump
    if (jumpLow && !jumpTriggeredRef.current && !isJumping.current) {
      jumpTriggeredRef.current = true;
      isJumping.current = true;
      velocityY.current = jumpStrength;
      setCurrentModel("MarioJump");
      playJumpSound();
    } else if (!jumpLow) {
      jumpTriggeredRef.current = false;
    }

    // FPGA-based click (backflip)
    if (click && !clickTriggeredRef.current && !isBackFlipping.current) {
      clickTriggeredRef.current = true;
      isBackFlipping.current = true;
      velocityY.current = jumpStrength;
      setCurrentModel("MarioBackFlip");
      playJumpSound();
    } else if (!click) {
      clickTriggeredRef.current = false;
    }

    // Local movement (only if allowed)
    if (isPlayerPlayer && !disableLateralMovement) {
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

    // Idle fallback
    if (!didMove && !isJumping.current && !isBackFlipping.current && currentModel !== "MarioIdle") {
      setCurrentModel("MarioIdle");
    }

    // Jump arc motion
    if (isJumping.current) {
      groupRef.current.position.y += velocityY.current;
      velocityY.current -= 0.3 * delta * gravity;
      if (groupRef.current.position.y <= initialPosition[1]) {
        groupRef.current.position.y = initialPosition[1];
        isJumping.current = false;
        velocityY.current = 0;
        setCurrentModel("MarioIdle");
      }
    }
  });

  // Handle animation transitions
  useEffect(() => {
    if (activeAction.current) {
      activeAction.current.fadeOut(0.2);
    }

    let action;
    if (currentModel === "MarioIdle") {
      action = idleActions["mixamo.com"] || Object.values(idleActions)[0];
      action?.setLoop(THREE.LoopRepeat, Infinity);
    } else if (currentModel === "MarioJump") {
      action = jumpActions["mixamo.com"] || Object.values(jumpActions)[0];
      if (action) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
    } else if (currentModel === "MarioBackFlip") {
      action = clickActions["mixamo.com"] || Object.values(clickActions)[0];
      if (action) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().fadeIn(0.2).play();
        const duration = action.getClip().duration;
        setTimeout(() => {
          isBackFlipping.current = false;
          setCurrentModel("MarioIdle");
        }, duration * 1000);
      }
    } else if (currentModel === "MarioSideStep") {
      action = sideStepActions["mixamo.com"] || Object.values(sideStepActions)[0];
      action?.setLoop(THREE.LoopRepeat, Infinity);
    } else if (currentModel === "MarioRightSideStep") {
      action = rightSideStepActions["mixamo.com"] || Object.values(rightSideStepActions)[0];
      action?.setLoop(THREE.LoopRepeat, Infinity);
    }

    if (action) {
      action.reset().fadeIn(0.2).play();
      activeAction.current = action;
    }
  }, [currentModel, idleActions, jumpActions, clickActions, sideStepActions, rightSideStepActions]);

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
      <primitive object={scene} scale={modelData.scale} />
    </group>
  );
};

export default PlayerMario;
