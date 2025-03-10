import React, { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SpikeBall = ({ position = [0.65, -0.4, 0], onFire = () => {} }) => {
  const { scene } = useGLTF("models/SpikeBall.glb");
  const cannonRef = useRef();
  const [clone, setClone] = useState(null);
  const [posX, setPosX] = useState(position[0])

  useEffect(() => {
    if (scene) {
      const clonedScene = scene.clone(true);
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      setClone(clonedScene);
    }
  }, [scene]);

  useFrame((state, delta) => {
    if (cannonRef.current) {
      let newX = posX - delta * 1.2 ; // Adjust speed here

      // Wrap around if it goes off-screen (customize this boundary)
      if (newX < -1.5) {
        newX = 1.5;
      }

      setPosX(newX);

      cannonRef.current.position.x = newX;
      
      // cannonRef.current.position.x -= 0.005; // Adjust speed here
      cannonRef.current.rotation.z += 0.15; // Adjust speed here
    }
    
  });

  if (!clone) return null;

  return (
    <primitive
      ref={cannonRef}
      object={clone}
      position={position}
      scale={0.01}
      onClick={onFire}
    />
  );
};

export default SpikeBall;
