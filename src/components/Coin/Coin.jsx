import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Coin = ({ position, onCollect }) => {
  const { scene } = useGLTF("/models/coin.glb");
  const coinGroupRef = useRef();
  const [clone, setClone] = useState(null);

  useEffect(() => {
    if (scene) {
      // Clone the scene so we can modify it without affecting the original.
      const clonedScene = scene.clone(true);
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({ color: "#B8860B" });
          child.castShadow = true;
          child.receiveShadow = true;
        }
        // Force the coin to be on layer 2.
        child.layers.set(2);
      });
      setClone(clonedScene);
    }
  }, [scene]);

  // Rotate the coin.
  useFrame(() => {
    if (coinGroupRef.current) {
      coinGroupRef.current.rotation.y += 0.05;
    }
  });

  if (!clone) return null;

  return (
    <group ref={coinGroupRef} position={position}>
      {/* Local ambient light for coins: only affects layer 2 */}
      <pointLight
        intensity={0.5} // A very low intensity to provide minimal fill
        distance={0.05}
        color="gold"
        position={[0, 0, 0]}
        onUpdate={(self) => {
          self.layers.disable(0); // Remove default layer 0
          self.layers.disable(1); // Remove player layer 1
          self.layers.enable(2);  // Enable coin layer 2
        }}
      />
      <primitive object={clone} scale={0.05} onClick={onCollect} />
    </group>
  );
};

export default Coin;
