import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SpikeBall = ({
  position = [0.65, -0.4, 1.5],
  onFire = () => {},
  playerRef,
  onCollision = () => {},
  onSafePass = () => {}
}) => {
  const { scene } = useGLTF("models/SpikeBall.glb");
  const groupRef = useRef();
  const spikeBallRef = useRef();
  const [clone, setClone] = useState(null);
  const posX = useRef(position[0]);

  const hasScoredThisCycle = useRef(false);

  useEffect(() => {
    if (scene) {
      const clonedScene = scene.clone(true);
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        child.layers.set(2);
      });
      setClone(clonedScene);
    }
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current || !playerRef?.current) return;

    const playerX = playerRef.current.position.x;
    const ball = groupRef.current;

    // Move spike ball
    posX.current -= delta * 1.2 * 0.00001;
    if (posX.current < -1.5) {
      posX.current = 1.5;
      hasScoredThisCycle.current = false; // Reset each time ball loops
    }

    ball.position.x = posX.current;

    // Spin it
    if (spikeBallRef.current) {
      spikeBallRef.current.rotation.z += 0.05;
    }

    // Collision detection
    const spikePos = ball.position;
    const playerPos = playerRef.current.position;

    if (!hasScoredThisCycle.current) {
      const distance = playerPos.distanceTo(spikePos);

      if (distance < 0.5) {
        onCollision();
        hasScoredThisCycle.current = true;
      } else if (spikePos.x < playerX) {
        onSafePass(); // Passed player safely
        hasScoredThisCycle.current = true;
      }
    }
  });

  if (!clone) return null;

  return (
    <group ref={groupRef} position={position}>
      <pointLight
        intensity={2}
        position={[0, 0, 0]}
        onUpdate={(self) => {
          self.layers.disable(0);
          self.layers.disable(1);
          self.layers.enable(2);
        }}
      />
      <primitive
        ref={spikeBallRef}
        object={clone}
        position={[0, 0, 0]}
        scale={0.01}
        onClick={onFire}
      />
    </group>
  );
};


export default SpikeBall;
