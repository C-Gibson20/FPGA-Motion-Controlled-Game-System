// BasePlayer.jsx
import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BasePlayer = ({
  username,
  isPlayerPlayer,
  initialPosition,
  playerRef,
  models, // expected keys: idle, jump, left, (optionally right)
  movement = "full", // "full" or "horizontal"
  animationTransition = "instant", // "instant" or "fade"
}) => {
  // We'll use generic state names: "idle", "jump", "left", "right"
  const [currentModel, setCurrentModel] = useState("idle");
  const groupRef = useRef();
  const ambientLightRef = useRef();
  const activeAction = useRef(null);

  // Physics & movement variables
  const speed = 0.05;
  const jumpStrength = 0.07;
  const gravity = 0.004;
  const velocityY = useRef(0);
  const isJumping = useRef(false);
  const keys = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    " ": false,
  });

  // Forward group ref and set all children to layer 1.
  useEffect(() => {
    if (playerRef) {
      playerRef.current = groupRef.current;
    }
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        child.layers.set(1);
      });
    }
  }, [playerRef]);

  // Load GLTFs for each state
  const idleGLTF = useGLTF(models.idle.path);
  const jumpGLTF = useGLTF(models.jump.path);
  const leftGLTF = useGLTF(models.left.path);
  // If a "right" model isn’t provided, we use the left model.
  const rightGLTF = models.right ? useGLTF(models.right.path) : leftGLTF;

  // Setup animations for each state.
  const idleActions = useAnimations(idleGLTF.animations, groupRef).actions;
  const jumpActions = useAnimations(jumpGLTF.animations, groupRef).actions;
  const leftActions = useAnimations(leftGLTF.animations, groupRef).actions;
  const rightActions = useAnimations(rightGLTF.animations, groupRef).actions;

  // Determine which GLTF, scale, and animation actions to use
  let currentGLTF, modelData, currentActions;
  if (currentModel === "idle") {
    currentGLTF = idleGLTF;
    modelData = models.idle;
    currentActions = idleActions;
  } else if (currentModel === "jump") {
    currentGLTF = jumpGLTF;
    modelData = models.jump;
    currentActions = jumpActions;
  } else if (currentModel === "left") {
    currentGLTF = leftGLTF;
    modelData = models.left;
    currentActions = leftActions;
  } else if (currentModel === "right") {
    currentGLTF = rightGLTF;
    modelData = models.right || models.left;
    currentActions = rightActions;
  }

  // Keyboard event listeners (only if isPlayerPlayer is true)
  useEffect(() => {
    if (!isPlayerPlayer) return;
    const handleKeyDown = (e) => {
      if (keys.current[e.key] !== undefined) {
        keys.current[e.key] = true;
      }
      if (e.key === " " && !isJumping.current) {
        isJumping.current = true;
        velocityY.current = jumpStrength;
        setCurrentModel("jump");
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
  }, [isPlayerPlayer]);

  // Update movement and jump physics on each frame
  useFrame(() => {
    if (!isPlayerPlayer || !groupRef.current) return;
    let moving = false;
    // Horizontal movement
    if (keys.current.ArrowLeft) {
      groupRef.current.position.x -= speed;
      if (currentModel !== "left") setCurrentModel("left");
      moving = true;
    }
    if (keys.current.ArrowRight) {
      groupRef.current.position.x += speed;
      if (models.right) {
        if (currentModel !== "right") setCurrentModel("right");
      } else {
        if (currentModel !== "left") setCurrentModel("left");
      }
      moving = true;
    }
    // Vertical movement if "full" movement is enabled.
    if (movement === "full") {
      if (keys.current.ArrowUp) {
        groupRef.current.position.y += speed;
        moving = true;
      }
      if (keys.current.ArrowDown) {
        groupRef.current.position.y -= speed;
        moving = true;
      }
    }
    // Handle jump physics
    if (isJumping.current) {
      groupRef.current.position.y += velocityY.current;
      velocityY.current -= gravity;
      if (groupRef.current.position.y <= initialPosition[1]) {
        groupRef.current.position.y = initialPosition[1];
        isJumping.current = false;
        velocityY.current = 0;
        if (!moving) setCurrentModel("idle");
      }
    }
    if (!moving && !isJumping.current && currentModel !== "idle") {
      setCurrentModel("idle");
    }
  });

  // Handle animation transitions on model change.
  useEffect(() => {
    if (animationTransition === "fade") {
      // Fade out previous action then fade in new one.
      if (activeAction.current) {
        activeAction.current.fadeOut(0.2);
      }
      let action;
      if (currentModel === "idle") {
        action = idleActions["mixamo.com"] || Object.values(idleActions)[0];
      } else if (currentModel === "jump") {
        action = jumpActions["mixamo.com"] || Object.values(jumpActions)[0];
      } else if (currentModel === "left") {
        action = leftActions["mixamo.com"] || Object.values(leftActions)[0];
      } else if (currentModel === "right") {
        action = rightActions["mixamo.com"] || Object.values(rightActions)[0];
      }
      if (action) {
        action.reset().fadeIn(0.2).play();
        action.setLoop(THREE.LoopRepeat, Infinity);
        activeAction.current = action;
      }
    } else {
      // Instant transition: stop all actions then play the new one.
      idleActions["mixamo.com"]?.stop();
      jumpActions["mixamo.com"]?.stop();
      leftActions["mixamo.com"]?.stop();
      rightActions["mixamo.com"]?.stop();
      if (currentModel === "idle") {
        idleActions["mixamo.com"]?.play();
      } else if (currentModel === "jump") {
        jumpActions["mixamo.com"]?.play();
      } else if (currentModel === "left") {
        leftActions["mixamo.com"]?.play();
      } else if (currentModel === "right") {
        rightActions["mixamo.com"]?.play();
      }
    }
  }, [
    currentModel,
    idleActions,
    jumpActions,
    leftActions,
    rightActions,
    animationTransition,
  ]);

  return (
    <group ref={groupRef} position={initialPosition}>
      <ambientLight
        ref={ambientLightRef}
        intensity={4}
        onUpdate={(self) => {
          self.layers.disable(0);
          self.layers.disable(2);
          self.layers.enable(1);
        }}
      />
      <primitive
        key={currentModel}
        object={currentGLTF.scene}
        scale={modelData.scale}
      />
    </group>
  );
};

export default BasePlayer;
