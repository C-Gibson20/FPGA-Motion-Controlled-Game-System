import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MAX_PARTICLES = 100;
const PARTICLE_LIFETIME = 1.5;

const SpikeBall = ({
  position = [1.5, -0.25, 0]
}) => {
  const { scene } = useGLTF("models/BanzaiBIll.glb");
  const groupRef = useRef();
  const [clone, setClone] = useState(null);

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
  

  if (!clone) return null;

  return (
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
        object={clone}
        position={[0, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={0.004}
      />
    </group>
  );
};

export default SpikeBall;