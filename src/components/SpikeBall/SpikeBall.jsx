import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// SmokeTrail Component
const SmokeTrail = ({ followRef }) => {
  const [smokePuffs, setSmokePuffs] = useState([]);
  const puffId = useRef(0);

  useFrame((_, delta) => {
    if (!followRef.current) return;

    setSmokePuffs((prev) => {
      // Decrease life of existing puffs and filter out dead ones
      const updated = prev
        .map((p) => ({ ...p, life: p.life - delta }))
        .filter((p) => p.life > 0);

      // Add a new puff at current position
      updated.push({
        id: puffId.current++,
        position: followRef.current.position.clone(),
        life: 0.5,
      });

      return updated;
    });
  });

  return (
    <>
      {smokePuffs.map((puff) => (
        <mesh key={puff.id} position={puff.position}>
          <sphereGeometry args={[0.1, 6, 6]} />
          <meshStandardMaterial
            transparent
            opacity={puff.life}
            color="white"
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
};

// SpikeBall Component
const SpikeBall = ({
  position = [0.65, -0.35 , 0],
  onFire = () => {},
  playerRef,
  onCollision = () => {},
  onSafePass = () => {},
}) => {
  const { scene } = useGLTF("models/BanzaiBIll.glb");
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
          child.material = new THREE.MeshStandardMaterial({ color: "#2E2E2E" });
          child.castShadow = true;
          child.receiveShadow = true;
        }
        child.layers.set(2);
      });
      setClone(clonedScene);
    }
  }, [scene]);

  useFrame((_, delta) => {
    if (!groupRef.current || !playerRef?.current || !spikeBallRef.current) return;
  
    // Move the spike ball along the x-axis.
    posX.current -= delta * 0.8;
    if (posX.current < -2) {
      posX.current = 2;
      hasScoredThisCycle.current = false; // Reset for a new cycle.
    }
    groupRef.current.position.x = posX.current;
  
    // Get world positions of the spike ball and the player.
    const spikePos = new THREE.Vector3();
    spikeBallRef.current.getWorldPosition(spikePos);
    spikePos.y += 0.35 
  
    const playerPos = new THREE.Vector3();
    playerRef.current.getWorldPosition(playerPos);
    playerPos.y += 0.7
  
    // Use the full Euclidean distance for collision detection.
    const collisionThreshold = 0.4; // Adjust based on your model sizes.
    if (playerPos.distanceTo(spikePos) < collisionThreshold && !hasScoredThisCycle.current) {
      onCollision();
      hasScoredThisCycle.current = true;
    } else if (spikePos.x < playerPos.x && !hasScoredThisCycle.current) {
      // The spike ball has passed the player without colliding.
      onSafePass();
      hasScoredThisCycle.current = true;
    }
  });
  

  if (!clone) return null;

  return (
    <>
      <group ref={groupRef} position={position}>
        <pointLight
          intensity={0.5}
          distance={0.5}
          position={[0, 0, 0.4]}
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
          rotation={[0, -Math.PI / 2, 0]}
          scale={0.004}
          onClick={onFire}
        />
      </group>
      <SmokeTrail followRef={groupRef} />
    </>
  );
};

export default SpikeBall;
