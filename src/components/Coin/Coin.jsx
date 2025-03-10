import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Coin = ({ position, onCollect }) => {
  const { scene } = useGLTF("models/coin.glb");
  const coinRef = useRef();
  const [clone, setClone] = useState();

  useEffect(() => {
    if (scene) {
      const clonedScene = scene.clone(true);
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({ color: "gold" });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      setClone(clonedScene);
    }
  }, [scene]);

  // Rotate the coin
  useFrame(() => {
    if (coinRef.current) {
      coinRef.current.rotation.y += 0.05;
    }
  });

  if (!clone) return null;

  return (
    <primitive
      ref={coinRef}
      object={clone}
      position={position}
      scale={0.05}
      onClick={onCollect}
    />
  );
};

export default Coin;
