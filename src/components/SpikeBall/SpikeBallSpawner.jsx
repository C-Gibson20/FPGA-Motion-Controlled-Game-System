import React, { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import SpikeBall from "./SpikeBall.jsx";

const OFFSCREEN_X = -2.5;

const SpikeBallSpawner = ({ playerRefs = [], onTurn, spawnInterval }) => {
  const [spikeBalls, setSpikeBalls] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    const spawnSpikeBall = () => {
      const id = Date.now() + Math.random();
      const position = [1.5, -0.25, 0]; // Initial spawn position
      const speed = 2.0 + Math.random() * 0.5; // Speed variation

      setSpikeBalls((prev) => [
        ...prev,
        {
          id,
          position,
          speed,
          scoredPlayers: new Set(), // Track which players were scored
        },
      ]);
    };

    intervalRef.current = setInterval(spawnSpikeBall, spawnInterval);
    return () => clearInterval(intervalRef.current);
  }, [spawnInterval]);

  useFrame((_, delta) => {
    setSpikeBalls((prev) =>
      prev
        .map((ball) => {
          const [x, y, z] = ball.position;
          const newX = x - ball.speed * delta;
          const spikePos = { x: newX + 0.1, y: y + 0.25 };

          playerRefs.forEach((ref, index) => {
            const playerPos = ref?.current?.position;
            if (!playerPos) return;
          
            const dist = Math.sqrt(
              (playerPos.x - spikePos.x) ** 2 +
              (playerPos.y + 0.35 - spikePos.y) ** 2
            );
          
            if (dist < 0.3 && !ball.scoredPlayers.has(index)) {
              // Collision detected, deduct points
              onTurn(index, -1);
              ball.scoredPlayers.add(index); // Register that the player has been affected
            } else if (
              spikePos.x < playerPos.x - 0.5 && // Correcting pass detection for both players
              !ball.scoredPlayers.has(index)
            ) {
              // If the spike ball moves past the player, award points
              onTurn(index, 1);
              ball.scoredPlayers.add(index);
            }
          });
          

          return { ...ball, position: [newX, y, z] };
        })
        .filter((ball) => ball.position[0] > OFFSCREEN_X) // Keep only visible balls
    );
  });

  return (
    <>
      {spikeBalls.map(({ id, position }) => (
        <SpikeBall key={id} position={position} />
      ))}
    </>
  );
};

export default SpikeBallSpawner;
