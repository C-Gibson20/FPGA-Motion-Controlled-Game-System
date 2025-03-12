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

const CoinSpawner = ({ startPositions=defaultStartPositions, playerRef, onCoinCollect }) => {
  const effectiveStartPositions =
    startPositions && startPositions.length >= 2 ? startPositions : defaultStartPositions;

  const [coins, setCoins] = useState([]);
  const coinVelocities = useRef({});
  const intervalRef = useRef(null);
  const lastWasFirst = useRef(false);

  useEffect(() => {
    const spawnCoin = () => {
      const baseIndex = lastWasFirst.current ? 1 : 0;
      lastWasFirst.current = !lastWasFirst.current;
      const base = effectiveStartPositions[baseIndex];
      const position = getSpawnPositionNear(base);
      const id = Date.now();
      const gravity = 0.95 * Math.random() + 0.05;

      setCoins(prev => [...prev, { id, position, gravity }]);
      coinVelocities.current[id] = 0;
    };

    intervalRef.current = setInterval(spawnCoin, 1000);

    return () => clearInterval(intervalRef.current);
    }, [effectiveStartPositions]);

  const collectCoin = (coinId) => {
    setCoins(prev => prev.filter(coin => coin.id !== coinId));
    delete coinVelocities.current[coinId];
    if (onCoinCollect) onCoinCollect();
    console.log("Coin collected!");
  };

  useFrame((state, delta) => {
    const playerPos = playerRef?.current?.position || new THREE.Vector3(0, 0, 0);

    setCoins(prevCoins => {
      const newCoins = [];
      prevCoins.forEach(coin => {
        const id = coin.id;
        let [x, y, z] = coin.position;
        let velocity = coinVelocities.current[id] || 0;

        velocity -= coin.gravity * delta;
        y += velocity * delta;
        coinVelocities.current[id] = velocity;

        if (y <= -0.65) {
          delete coinVelocities.current[id];
          return;
        }

        const coinPos = new THREE.Vector3(x, y, z);
        if (playerPos.distanceTo(coinPos) < 0.2) {
          collectCoin(id);
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
        <Coin 
          key={coin.id} 
          position={coin.position} 
          onCollect={() => collectCoin(coin.id)} 
        />
      ))}
    </>
  );
};

export default CoinSpawner;
