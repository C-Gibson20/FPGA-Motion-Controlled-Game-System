import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Coin = ({ position = [0, 0, 0], gravity = 0.05, onCollect }) => {
  const { scene } = useGLTF("/models/coin.glb");
  const coinRef = useRef();
  const [clone, setClone] = useState(null);

  const targetPosition = useRef(new THREE.Vector3(...position));
  const velocity = useRef(0);

  useEffect(() => {
    targetPosition.current.set(...position);
  }, [position]);

  useEffect(() => {
    if (scene) {
      const cloned = scene.clone(true);
      cloned.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({ color: "#B8860B" });
          child.castShadow = true;
          child.receiveShadow = true;
        }
        child.layers.set(2);
      });
      setClone(cloned);
    }
  }, [scene]);

  useFrame((_, delta) => {
    if (!coinRef.current) return;

    // Gravity + interpolation
    velocity.current -= gravity * delta;
    targetPosition.current.y += velocity.current;

    coinRef.current.position.lerp(targetPosition.current, 0.15);
    coinRef.current.rotation.y += 0.05;
  });

  if (!clone) return null;

  return (
    <group ref={coinRef} position={position}>
      <pointLight
        intensity={0.5}
        distance={0.05}
        color="gold"
        position={[0, 0, 0]}
        onUpdate={(self) => {
          self.layers.disable(0);
          self.layers.disable(1);
          self.layers.enable(2);
        }}
      />
      <primitive object={clone} scale={0.05} onClick={onCollect} />
    </group>
  );
};

export default Coin;
