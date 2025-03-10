import React, { useRef, useEffect, useState } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three"; // ✅ Import Three.js

const MODELS = {
    WaluigiIdle: { path: "/models/WaluigiIdle.glb", scale: 0.004 },
    WaluigiJump: { path: "/models/WaluigiJump.glb", scale: 0.004 },
    WaluigiSideStep: { path: "/models/WaluigiSideStep.glb", scale: 0.004 },
};

const PlayerWaluigi = ({ username, isPlayerPlayer, initialPosition, playerRef }) => {
    const [currentModel, setCurrentModel] = useState("WaluigiIdle");
    const groupRef = useRef();
    const activeAction = useRef(null);

    useEffect(() => {
        if (playerRef) {
            playerRef.current = groupRef.current;
        }
    }, [playerRef]);

    const modelData = MODELS[currentModel];
    const { scene, animations } = useGLTF(modelData.path);
    const { scene: idleScene, animations: idleAnimations } = useGLTF(MODELS.WaluigiIdle.path);
    const { scene: jumpScene, animations: jumpAnimations } = useGLTF(MODELS.WaluigiJump.path);
    const { scene: sideStepScene, animations: sideStepAnimations } = useGLTF(MODELS.WaluigiSideStep.path);

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

    useEffect(() => {
        if (!isPlayerPlayer) return;

        const handleKeyDown = (e) => {
            if (keys.current[e.key] !== undefined) {
                keys.current[e.key] = true;
            }
            if (e.key === " " && !isJumping.current) {
                isJumping.current = true;
                velocityY.current = jumpStrength;
                setCurrentModel("WaluigiJump");
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

    useFrame(() => {
        if (!isPlayerPlayer || !groupRef.current) return;

        let moving = false;

        if (keys.current.ArrowLeft) {
            groupRef.current.position.x -= speed;
            if (currentModel !== "WaluigiSideStep") setCurrentModel("WaluigiSideStep");
            moving = true;
        }
        if (keys.current.ArrowRight) {
            groupRef.current.position.x += speed;
            if (currentModel !== "WaluigiSideStep") setCurrentModel("WaluigiSideStep");
            moving = true;
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

        if (!moving && !isJumping.current && currentModel !== "WaluigiIdle") {
            setCurrentModel("WaluigiIdle");
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
        }

        if (action) {
            action.reset().fadeIn(0.2).play();
            action.setLoop(THREE.LoopRepeat, Infinity); // ✅ Ensure animations loop
            activeAction.current = action;
        }
    }, [currentModel, idleActions, jumpActions, sideStepActions]);

    return (
        <group ref={groupRef} position={initialPosition}>
            <primitive object={scene} scale={modelData.scale} />
        </group>
    );
};

export default PlayerWaluigi;
