import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import Coin from "./Coin";

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

const CoinSpawner = ({ startPositions }) => {
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
    setCoins((prevCoins) =>
      prevCoins
        .map((coin) => {
          const id = coin.id;
          let [x, y, z] = coin.position;
          let velocity = coinVelocities.current[id] ?? 0;

          velocity -= coin.gravity * delta;
          y += velocity * delta;

          coinVelocities.current[id] = velocity;

          if (y <= GROUND_Y) {
            delete coinVelocities.current[id];
            return null; 
          }

          return { ...coin, position: [x, y, z] };
        })
        .filter(Boolean)
    );
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
