import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Coin from "./Coin.jsx";
import * as THREE from "three";

const getSpawnPositionNear = ([baseX, baseY, baseZ]) => [
  baseX + (Math.random() * 0.8 - 0.4),
  baseY + 1.5,
  baseZ,
];

const defaultStartPositions = [[0, 0, 0], [1, 0, 0]];

const CoinSpawner = ({ startPositions = defaultStartPositions, playerRefs, onCoinCollect }) => {
  const effectiveStartPositions =
    startPositions && startPositions.length >= 2 ? startPositions : defaultStartPositions;

  const [coins, setCoins] = useState([]);
  const coinVelocities = useRef({});
  const intervalRef = useRef(null);
  const lastWasFirst = useRef(false);

  // Spawn a new coin every second.
  useEffect(() => {
    const spawnCoin = () => {
      const baseIndex = lastWasFirst.current ? 1 : 0;
      lastWasFirst.current = !lastWasFirst.current;
      const base = effectiveStartPositions[baseIndex];
      const position = getSpawnPositionNear(base);
      // Use a unique id by combining Date.now with a random number.
      const id = Date.now() + Math.random();
      const gravity = 0.95 * Math.random() + 0.05;

      setCoins(prev => [...prev, { id, position, gravity }]);
      coinVelocities.current[id] = 0;
    };

    intervalRef.current = setInterval(spawnCoin, 1000);
    return () => clearInterval(intervalRef.current);
  }, [effectiveStartPositions]);

  // Remove coin and notify which player collected it.
  const collectCoin = (coinId, playerIndex) => {
    setCoins(prev => prev.filter(coin => coin.id !== coinId));
    delete coinVelocities.current[coinId];
    console.log("Coin collected by player:", playerIndex);
    if (onCoinCollect) onCoinCollect(playerIndex);
  };

  // Animate coins falling and check for collisions with each player's world position.
  useFrame((state, delta) => {
    setCoins(prevCoins => {
      const newCoins = [];
      prevCoins.forEach(coin => {
        const id = coin.id;
        let [x, y, z] = coin.position;
        let velocity = coinVelocities.current[id] || 0;

        velocity -= coin.gravity * delta;
        y += velocity * delta;
        coinVelocities.current[id] = velocity;

        // Remove coin if it falls off-screen.
        if (y <= -0.65) {
          delete coinVelocities.current[id];
          return;
        }

        const coinPos = new THREE.Vector3(x, y, z);
        let collided = false;
        
        // Loop through all player refs and check collisions.
        if (playerRefs && playerRefs.length > 0) {
          for (let i = 0; i < playerRefs.length; i++) {
            const ref = playerRefs[i];
            if (ref && ref.current) {
              const playerWorldPos = new THREE.Vector3();
              ref.current.getWorldPosition(playerWorldPos);
              // Use a collision threshold of 0.3 (adjust if needed)
              if (playerWorldPos.distanceTo(coinPos) < 0.3) {
                collectCoin(id, i);
                collided = true;
                break;
              }
            }
          }
        }
        
        if (!collided) {
          newCoins.push({ ...coin, position: [x, y, z] });
        }
      });
      return newCoins;
    });
  });

  return (
    <>
      {coins.map((coin) => (
        <Coin 
          key={coin.id} 
          position={coin.position} 
          onCollect={() => collectCoin(coin.id, null)} 
        />
      ))}
    </>
  );
};

export default CoinSpawner;
