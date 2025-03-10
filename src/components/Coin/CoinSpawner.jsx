import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Coin from "./Coin.jsx";
import * as THREE from "three";

const GROUND_Y = -0.65;
const MIN_GRAVITY = 0.05;
const MAX_GRAVITY = 1;

const getSpawnPositionNear = (basePosition) => {
  const [baseX, baseY, baseZ] = basePosition;
  const x = baseX + (Math.random() * 0.8 - 0.4);
  const y = baseY + 1.5;
  const z = baseZ;
  return [x, y, z];
};

const CoinSpawner = ({ startPositions, playerRef, onCoinCollect }) => {
  const [coins, setCoins] = useState([]);
  const coinVelocities = useRef({});
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startPositions || startPositions.length < 2) return;
  
    let lastWasFirst = false; // Track which character got the last coin
  
    const spawnCoin = () => {
      // Alternate between startPositions[0] and startPositions[1]
      const base = startPositions[lastWasFirst ? 1 : 0];
      lastWasFirst = !lastWasFirst;
  
      const position = getSpawnPositionNear(base);
      const id = Date.now();
      const gravity = Math.random() * (MAX_GRAVITY - MIN_GRAVITY) + MIN_GRAVITY;
  
      setCoins((prev) => [...prev, { id, position, gravity }]);
      coinVelocities.current[id] = 0;
    };
  
    intervalRef.current = setInterval(spawnCoin, 1000);
  
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startPositions.length]);
  

  const collectCoin = (coinId) => {
    setCoins((prevCoins) => prevCoins.filter((coin) => coin.id !== coinId));
    delete coinVelocities.current[coinId];
    console.log("Coin collected!");
  };

  useFrame((state, delta) => {
    if (!playerRef.current) return;
    const playerPos = playerRef.current.position;

    setCoins((prevCoins) => {
      const newCoins = [];
      prevCoins.forEach((coin) => {
        const id = coin.id;
        let [x, y, z] = coin.position;
        let velocity = coinVelocities.current[id] || 0;

        velocity -= coin.gravity * delta;
        y += velocity * delta;
        coinVelocities.current[id] = velocity;

        // Remove coin if it hits the ground.
        if (y <= GROUND_Y) {
          delete coinVelocities.current[id];
          return;
        }

        // Check for collision with the player.
        const coinPos = new THREE.Vector3(x, y, z);
        if (playerPos.distanceTo(coinPos) < 0.5) {
          // Collision detected – notify and remove the coin.
          onCoinCollect();
          delete coinVelocities.current[id];
          return;
        }

        newCoins.push({ ...coin, position: [x, y, z] });
      });
      return newCoins;
    });
  });

  return (
    <>
      {coins.map((coin) => (
        <Coin key={coin.id} position={coin.position} onCollect={() => collectCoin(coin.id)} />
      ))}
    </>
  );
};

export default CoinSpawner;
