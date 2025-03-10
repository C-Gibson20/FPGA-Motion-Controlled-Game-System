import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

const MODELS = {
    MarioIdle: { path: "/models/MarioIdle.glb", scale: 0.003 },
    MarioJump: { path: "/models/MarioJump.glb", scale: 0.003 },
    MarioSideStep: { path: "/models/MarioSideStep.glb", scale: 0.003 },
};

const PlayerMario = ({ username, isPlayerPlayer, model, initialPosition, playerRef }) => {
    const [currentModel, setCurrentModel] = useState("MarioIdle");
    const groupRef = useRef(); // This group will maintain the consistent location
    //const playerRef = useRef(); // Reference for the model primitive if needed

    // Forward the group ref to the provided playerRef so others can read its position.
    useEffect(() => {
        if (playerRef) {
        playerRef.current = groupRef.current;
        }
    }, [playerRef]);

    const modelData = MODELS[currentModel];
    const { scene, animations } = useGLTF(modelData.path);
    const { scene: idleScene, animations: idleAnimations } = useGLTF(MODELS.MarioIdle.path);
    const { scene: jumpScene, animations: jumpAnimations } = useGLTF(MODELS.MarioJump.path);
    const { scene: sideStepScene, animations: sideStepAnimations } = useGLTF(MODELS.MarioSideStep.path);

    const { actions: idleActions } = useAnimations(idleAnimations, groupRef);
    const { actions: jumpActions } = useAnimations(jumpAnimations, groupRef);
    const { actions: sideStepActions } = useAnimations(sideStepAnimations, groupRef);

    const velocityY = useRef(0);
    const speed = 0.05;
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

    useFrame(() => {
        if (!isPlayerPlayer || !groupRef.current) {
        return;
        }

        // Update the group's position so the new model stays in the same location
        if (keys.current.ArrowUp) {
        groupRef.current.position.y += speed;
        }
        if (keys.current.ArrowDown) {
        groupRef.current.position.y -= speed;
        }
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
        // Stop all animations
        Object.values(idleActions).forEach((action) => action.stop());
        Object.values(jumpActions).forEach((action) => action.stop());
        Object.values(sideStepActions).forEach((action) => action.stop());
    
        let action;
    
        // Use the correct animation
        if (currentModel === "MarioIdle") {
            action = idleActions["mixamo.com"];
        } else if (currentModel === "MarioJump") {
            action = jumpActions["mixamo.com"];
        } else if (currentModel === "MarioSideStep") {
            action = sideStepActions["mixamo.com"];
        }
    
        if (action) {
            action.reset().fadeIn(0.2).play();
            action.setLoop(THREE.LoopRepeat, Infinity); // Ensure animations loop
        }
    
    }, [currentModel, idleActions, jumpActions, sideStepActions]);
    

    return (
        <group ref={groupRef} position={initialPosition}>
        {/* The primitive model is attached to the group */}
        <primitive object={scene} scale={modelData.scale} />
        </group>
    );
};

export default PlayerMario;