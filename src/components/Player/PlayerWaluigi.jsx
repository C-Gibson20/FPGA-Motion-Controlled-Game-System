import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playJumpSound } from "../Sounds/Sounds.jsx";

// Models and their paths
const MODELS = {
  WaluigiIdle: { path: "/models/WaluigiIdle.glb", scale: 0.004 },
  WaluigiJump: { path: "/models/WaluigiJump.glb", scale: 0.004 },
  WaluigiSideStep: { path: "/models/WaluigiSideStep.glb", scale: 0.004 },
  WaluigiRightSideStep: { path: "/models/WaluigiRightSideStep.glb", scale: 0.004 },
  WaluigiBackFlip: { path: "/models/WaluigiBackflip.glb", scale: 0.004 },
};

const PlayerWaluigi = ({
  username,
  isPlayerPlayer,
  initialPosition,
  playerRef,
  click,       // FPGA backflip
  jumpLow,     // FPGA jump
  left,        // FPGA left movement
  right,       // FPGA right movement
  still,       // FPGA still state
  disableLateralMovement = false,
}) => {
  const [currentModel, setCurrentModel] = useState("WaluigiIdle");

  const groupRef = useRef();
  const activeAction = useRef(null);
  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const isBackFlipping = useRef(false);
  const jumpTriggeredRef = useRef(false);
  const clickTriggeredRef = useRef(false);

  const speed = 0.005;
  const jumpStrength = 0.07;
  const gravity = 0.9;

  const keys = useRef({
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  });

  useEffect(() => {
    if (playerRef) {
      playerRef.current = groupRef.current;
    }
  }, [playerRef]);

  useEffect(() => {
    const debugKeyLogger = (e) => {
      console.log("KEY PRESSED:", e.key);
    };
  
    window.addEventListener("keydown", debugKeyLogger);
    return () => window.removeEventListener("keydown", debugKeyLogger);
  }, []);
  

  // Key press listener (only for local player)
  useEffect(() => {
    if (!isPlayerPlayer) return;

    const handleKeyDown = (e) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key] = true;

      if (e.key === " " && !isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("WaluigiJump");
        playJumpSound();
      }
    };

    const handleKeyUp = (e) => {
      if (keys.current.hasOwnProperty(e.key)) keys.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlayerPlayer]);

  const modelData = MODELS[currentModel];
  const { scene } = useGLTF(modelData.path);

  const { animations: idleAnimations } = useGLTF(MODELS.WaluigiIdle.path);
  const { animations: jumpAnimations } = useGLTF(MODELS.WaluigiJump.path);
  const { animations: clickAnimations } = useGLTF(MODELS.WaluigiBackFlip.path);
  const { animations: sideStepAnimations } = useGLTF(MODELS.WaluigiSideStep.path);
  const { animations: rightSideStepAnimations } = useGLTF(MODELS.WaluigiRightSideStep.path);

  const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
  const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
  const { actions: clickActions } = useAnimations(clickAnimations, groupRef);
  const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);
  const { actions: rightSideStepActions } = useAnimations(rightSideStepAnimations, groupRef);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    let didMove = false;

    // FPGA Jump 
    if (jumpLow && !jumpTriggeredRef.current && !isJumping.current) {
      jumpTriggeredRef.current = true;
      isJumping.current = true;
      velocityY.current = jumpStrength;
      setCurrentModel("WaluigiJump");
      playJumpSound();
    } else if (!jumpLow) {
      jumpTriggeredRef.current = false;
    }

    // FPGA Backflip
    if (click && !clickTriggeredRef.current && !isBackFlipping.current) {
      clickTriggeredRef.current = true;
      isBackFlipping.current = true;
      velocityY.current = jumpStrength;
      setCurrentModel("WaluigiBackFlip");
      playJumpSound();
    } else if (!click) {
      clickTriggeredRef.current = false;
    }

    // FPGA Lateral movement
    if (!disableLateralMovement) {
      if (left) {
        groupRef.current.position.x -= speed;
        setCurrentModel("WaluigiSideStep");
        didMove = true;
      }
      if (right) {
        groupRef.current.position.x += speed;
        setCurrentModel("WaluigiRightSideStep");
        didMove = true;
      }
    }

    // Local keyboard movement 
    if (isPlayerPlayer && !disableLateralMovement) {
      if (keys.current.ArrowLeft) {
        groupRef.current.position.x -= speed;
        setCurrentModel("WaluigiSideStep");
        didMove = true;
      }
      if (keys.current.ArrowRight) {
        groupRef.current.position.x += speed;
        setCurrentModel("WaluigiRightSideStep");
        didMove = true;
      }
    }

    // Set idle if not moving or jumping
    if (!didMove && !isJumping.current && !isBackFlipping.current && currentModel !== "WaluigiIdle") {
      setCurrentModel("WaluigiIdle");
    }

    // Handle jump arc
    if (isJumping.current) {
      groupRef.current.position.y += velocityY.current;
      velocityY.current -= 0.3 * delta * gravity;

      if (groupRef.current.position.y <= initialPosition[1]) {
        groupRef.current.position.y = initialPosition[1];
        isJumping.current = false;
        velocityY.current = 0;
        setCurrentModel("WaluigiIdle");
      }
    }
  });

  // Handle animation switching
  useEffect(() => {
    if (activeAction.current) {
      activeAction.current.fadeOut(0.2);
    }

    let action = null;

    if (currentModel === "WaluigiIdle") {
      action = idleActions["mixamo.com"] || Object.values(idleActions)[0];
      action?.setLoop(THREE.LoopRepeat, Infinity);
    } else if (currentModel === "WaluigiJump") {
      action = jumpActions["mixamo.com"] || Object.values(jumpActions)[0];
      action?.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else if (currentModel === "WaluigiBackFlip") {
      action = clickActions["mixamo.com"] || Object.values(clickActions)[0];
      action?.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.reset().fadeIn(0.2).play();

      const duration = action.getClip().duration;
      setTimeout(() => {
        isBackFlipping.current = false;
        setCurrentModel("WaluigiIdle");
      }, duration * 1000);
    } else if (currentModel === "WaluigiSideStep") {
      action = sideStepActions["mixamo.com"] || Object.values(sideStepActions)[0];
      action?.setLoop(THREE.LoopRepeat, Infinity);
    } else if (currentModel === "WaluigiRightSideStep") {
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

export default PlayerWaluigi;
