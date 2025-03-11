import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import SpikeBall from "./SpikeBall.jsx";

const OFFSCREEN_X = -2.5;

const SpikeBallSpawner = ({
  playerRef,
  onCollision,
  onSafePass,
  spawnInterval = 6000,
}) => {
  const [spikeBalls, setSpikeBalls] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    const spawnSpikeBall = () => {
      const id = Date.now() + Math.random();
      const position = [1.5, -0.25, 0];
      const speed = 1.0 + Math.random() * 0.5;

      setSpikeBalls((prev) => [...prev, { id, position, speed, hasScored: false }]);
    };

    intervalRef.current = setInterval(spawnSpikeBall, spawnInterval);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [spawnInterval]);

  useFrame((_, delta) => {
    const playerPos = playerRef?.current?.position || { x: 0, y: 0.35, z: 0 };

    setSpikeBalls((prev) =>
      prev
        .map((ball) => {
          const [x, y, z] = ball.position;
          const newX = x - ball.speed * delta;

          const spikePos = { x: newX + 0.1, y: y + 0.25 };
          const dist = Math.sqrt(
            (playerPos.x - spikePos.x) ** 2 + (playerPos.y + 0.35 - spikePos.y) ** 2
          );

          if (dist < 0.3 && !ball.hasScored) {
            onCollision?.();
            return { ...ball, position: [newX, y, z], hasScored: true };
          } else if (spikePos.x < playerPos.x - 1 && !ball.hasScored) {
            onSafePass?.();
            return { ...ball, position: [newX, y, z], hasScored: true };
          }

          return { ...ball, position: [newX, y, z] };
        })
        .filter((ball) => ball.position[0] > OFFSCREEN_X)
    );
  });

  return (
    <>
      {spikeBalls.map(({ id, position, speed }) => (
        <SpikeBall
          key={id}
          speed={speed}
          position={position}
          playerRef={playerRef}
          onCollision={onCollision}
          onSafePass={onSafePass}
        />
      ))}
    </>
  );
};

export default SpikeBallSpawner;