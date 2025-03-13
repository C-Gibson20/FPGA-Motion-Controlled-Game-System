import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {playJumpSound} from "../Sounds/Sounds.jsx";

const MODELS = {
  WaluigiIdle: { path: "/models/WaluigiIdle.glb", scale: 0.004 },
  WaluigiJump: { path: "/models/WaluigiJump.glb", scale: 0.004 },
  WaluigiSideStep: { path: "/models/WaluigiSideStep.glb", scale: 0.004 },
  WaluigiBackFlip: { path: "/models/WaluigiBackflip.glb", scale: 0.004 },
  WaluigiRightSideStep: { path: "/models/WaluigiRightStep.glb", scale: 0.004 },
};

const PlayerWaluigi = ({ username, isPlayerPlayer, initialPosition, playerRef, jumpLow, left, right, still, click }) => {
  const [currentModel, setCurrentModel] = useState("WaluigiIdle");
  const groupRef = useRef();
  const activeAction = useRef(null);

  // This ref tracks whether a jump has already been triggered.
  const jumpTriggered = useRef(false);
  const clickTriggeredRef = useRef(false);

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
  const { animations: backFlipAnimations } = useGLTF(MODELS.WaluigiBackFlip.path);

  const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
  const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
  const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);
  const { actions: rightSideStepActions } = useAnimations(rightSideStepAnimations, groupRef);
  const { actions: backFlipActions } = useAnimations(backFlipAnimations, groupRef);

  const velocityY = useRef(0);
  const speed = 0.005;
  const jumpStrength = 0.07;
  const gravity = 0.9;
  const isJumping = useRef(false);
  const isBackFlipping = useRef(false);
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

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    let didMove = false;
    
    // FPGA controls first: Trigger jump only once on the rising edge.
    if (jumpLow && !jumpTriggered.current && !isJumping.current) {
      jumpTriggered.current = true;
      isJumping.current = true;
      velocityY.current = jumpStrength;
      setCurrentModel("WaluigiJump");
      playJumpSound();
    }
    if (!jumpLow) {
      // Reset jump trigger once FPGA flag is off.
      jumpTriggered.current = false;
    }
    if (click) {
      // Only trigger jump once when click becomes true.
      if (!clickTriggeredRef.current && !isBackFlipping.current) {
        clickTriggeredRef.current = true;
        isBackFlipping.current = true;
        velocityY.current = jumpStrength;
        if (currentModel !== "WaluigiBackFlip") setCurrentModel("WaluigiBackFlip");
        playJumpSound();
      }
    } else {
      // Reset our trigger when jumpLow is false.
      clickTriggeredRef.current = false;
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
    if (still && !didMove && !isJumping.current && !isBackFlipping.current && currentModel !== "WaluigiIdle") {
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
      velocityY.current -= 0.3 * gravity * delta;
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
    } else if (currentModel === "WaluigiBackFlip") {
          action = backFlipActions["mixamo.com"] || Object.values(backFlipActions)[0];
          if (action) {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.reset().fadeIn(0.2).play();
        
            // Use the animation clip's duration to schedule the reset.
            const clipDuration = action.getClip().duration;
            setTimeout(() => {
              isBackFlipping.current = false;
              setCurrentModel("WaluigiIdle"); // Reset to idle so new clicks trigger backflip
            }, clipDuration * 1000);
          }
        }
    else if (currentModel === "WaluigiSideStep") {
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