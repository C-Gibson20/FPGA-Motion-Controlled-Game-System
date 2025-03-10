// import React, { useRef, useEffect, useState } from "react";
// import { useGLTF, useAnimations } from "@react-three/drei";
// import { useFrame } from "@react-three/fiber";

// const MODELS = {
//     MarioIdle: { path: "/models/MarioIdle.glb", scale: 0.003 },
//     MarioJump: { path: "/models/MarioJump.glb", scale: 0.003 },
//     MarioSideStep: { path: "/models/MarioSideStep.glb", scale: 0.003 },
// };

// const Player = ({ username, isPlayerPlayer, model, initialPosition, playerRef }) => {
//     const [currentModel, setCurrentModel] = useState("MarioIdle");
//     const groupRef = useRef(); // This group will maintain the consistent location
//     //const playerRef = useRef(); // Reference for the model primitive if needed

//     // Forward the group ref to the provided playerRef so others can read its position.
//     useEffect(() => {
//         if (playerRef) {
//         playerRef.current = groupRef.current;
//         }
//     }, [playerRef]);

//     const modelData = MODELS[currentModel];
//     const { scene, animations } = useGLTF(modelData.path);
//     const { scene: idleScene, animations: idleAnimations } = useGLTF(MODELS.MarioIdle.path);
//     const { scene: jumpScene, animations: jumpAnimations } = useGLTF(MODELS.MarioJump.path);
//     const { scene: sideStepScene, animations: sideStepAnimations } = useGLTF(MODELS.MarioSideStep.path);

//     const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
//     const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
//     const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);

//     const velocityY = useRef(0);
//     const speed = 0.05;
//     const jumpStrength = 0.07; // Jump height
//     const gravity = 0.004; // Gravity effect
//     const isJumping = useRef(false);
//     const keys = useRef({
//         ArrowUp: false,
//         ArrowDown: false,
//         ArrowLeft: false,
//         ArrowRight: false,
//         Space: false,
//     });

//     useEffect(() => {
//         if (!isPlayerPlayer) return;

//         const handleKeyDown = (e) => {
//         if (keys.current[e.key] !== undefined) {
//             keys.current[e.key] = true;
//         }
//         if (e.key === " " && !isJumping.current) {
//             isJumping.current = true;
//             velocityY.current = jumpStrength;
//             setCurrentModel("MarioJump");
//         }
//         };

//         const handleKeyUp = (e) => {
//         if (keys.current[e.key] !== undefined) {
//             keys.current[e.key] = false;
//         }
//         if (e.key === " ") {
//             if (!isJumping.current) {
//             isJumping.current = true;
//             velocityY.current = jumpStrength;
//             }
//         }
//         };

//         window.addEventListener("keydown", handleKeyDown);
//         window.addEventListener("keyup", handleKeyUp);

//         return () => {
//         window.removeEventListener("keydown", handleKeyDown);
//         window.removeEventListener("keyup", handleKeyUp);
//         };
//     }, [isPlayerPlayer]);

//     useFrame(() => {
//         if (!isPlayerPlayer || !groupRef.current) {
//         return;
//         }

//         // Update the group's position so the new model stays in the same location
//         if (keys.current.ArrowUp) {
//         groupRef.current.position.y += speed;
//         }
//         if (keys.current.ArrowDown) {
//         groupRef.current.position.y -= speed;
//         }
//         if (keys.current.ArrowLeft) {
//         groupRef.current.position.x -= speed;
//         setCurrentModel("MarioSideStep");
//         }
//         if (keys.current.ArrowRight) {
//         groupRef.current.position.x += speed;
//         setCurrentModel("MarioSideStep");
//         }

//         if (isJumping.current) {
//         groupRef.current.position.y += velocityY.current;
//         velocityY.current -= gravity;

//         if (groupRef.current.position.y <= initialPosition[1]) {
//             groupRef.current.position.y = initialPosition[1];
//             isJumping.current = false;
//             velocityY.current = 0;
//             setCurrentModel("MarioIdle");
//         }
//         }
//     });

//     useEffect(() => {
//         // Stop all animations
//         idleActions["mixamo.com"]?.stop();
//         jumpActions["mixamo.com"]?.stop();
//         sideStepActions["mixamo.com"]?.stop();

//         // Start the current model's animation
//         if (currentModel === "MarioIdle") {
//         idleActions["mixamo.com"]?.play();
//         } else if (currentModel === "MarioJump") {
//         jumpActions["mixamo.com"]?.play();
//         } else if (currentModel === "MarioSideStep") {
//         sideStepActions["mixamo.com"]?.play();
//         }
//     }, [currentModel, idleActions, jumpActions, sideStepActions]);

//     return (
//         <group ref={groupRef} position={initialPosition}>
//         {/* The primitive model is attached to the group */}
//         <primitive object={scene} scale={modelData.scale} />
//         </group>
//     );
// };

// export default Player;

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

  // Update movement and animations.
  useFrame(() => {
    if (!isPlayerPlayer || !groupRef.current) return;

    if (keys.current.ArrowUp) groupRef.current.position.y += speed;
    if (keys.current.ArrowDown) groupRef.current.position.y -= speed;
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
