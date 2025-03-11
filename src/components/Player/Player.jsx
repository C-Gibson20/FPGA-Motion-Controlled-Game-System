import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MODELS = {
  MarioIdle: { path: "/models/MarioIdle.glb", scale: 0.003 },
  MarioJump: { path: "/models/MarioJump.glb", scale: 0.003 },
  MarioSideStep: { path: "/models/MarioSideStep.glb", scale: 0.003 },
};

const Player = ({ username, isPlayerPlayer, initialPosition, playerRef }) => {
  const [currentModel, setCurrentModel] = useState("MarioIdle");
  const groupRef = useRef();
  const ambientLightRef = useRef();

  // Forward group ref for external access.
  useEffect(() => {
    if (playerRef) {
      playerRef.current = groupRef.current;
    }
    // Set all objects in this group to layer 1.
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        child.layers.set(1);
      });
    }
  }, [playerRef]);

  // Load models and animations.
  const modelData = MODELS[currentModel];
  const { scene } = useGLTF(modelData.path);
  const { scene: idleScene, animations: idleAnimations } = useGLTF(MODELS.MarioIdle.path);
  const { scene: jumpScene, animations: jumpAnimations } = useGLTF(MODELS.MarioJump.path);
  const { scene: sideStepScene, animations: sideStepAnimations } = useGLTF(MODELS.MarioSideStep.path);

  const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
  const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
  const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);

  const velocityY = useRef(0);
  const speed = 0.05;
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

  // Keyboard event listeners.
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

    const BASE_SPEED = 40;

    useFrame((_, delta) => {
        if (!isPlayerPlayer || !groupRef.current) return;
    
        let moving = false;

        delta *= BASE_SPEED;
    
        // Handle movement
        if (keys.current.ArrowUp) {
            groupRef.current.position.y += delta * speed;
            moving = true;
        }
        if (keys.current.ArrowDown) {
            groupRef.current.position.y -= delta * speed;
            moving = true;
        }
        if (keys.current.ArrowLeft) {
            groupRef.current.position.x -= delta * speed;
            if (currentModel !== "MarioSideStep") setCurrentModel("MarioSideStep");
            moving = true;
        }
        if (keys.current.ArrowRight) {
            groupRef.current.position.x += delta * speed;
            if (currentModel !== "MarioSideStep") setCurrentModel("MarioSideStep");
            moving = true;
        }
    
        // Handle jumping
        if (isJumping.current) {
            groupRef.current.position.y += delta * velocityY.current;
            velocityY.current -= delta * gravity;
    
            if (groupRef.current.position.y <= initialPosition[1]) {
                groupRef.current.position.y = initialPosition[1];
                isJumping.current = false;
                velocityY.current = 0;
                setCurrentModel("MarioIdle"); // Reset to idle only after jump ends
            }
        }
    
        // If no movement keys are pressed, return to Idle
        if (!moving && !isJumping.current && currentModel !== "MarioIdle") {
            setCurrentModel("MarioIdle");
        }
    });
    

  useEffect(() => {
    // Stop all animations.
    idleActions["mixamo.com"]?.stop();
    jumpActions["mixamo.com"]?.stop();
    sideStepActions["mixamo.com"]?.stop();

    // Start the appropriate animation.
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
      {/* Local ambient light for the player only.
          onUpdate ensures the light is configured to affect only layer 1. */}
      <ambientLight
        ref={ambientLightRef}
        intensity={4}
        onUpdate={(self) => {
            self.layers.disable(0); // Remove default layer 0
            self.layers.disable(2); // Remove default layer 0
            self.layers.enable(1);  // Ensure only layer 1 is lit
        }}
      />

      <primitive object={scene} scale={modelData.scale} />
    </group>
  );
};

export default Player;
