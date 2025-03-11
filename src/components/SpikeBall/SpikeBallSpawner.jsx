import React, { useState, useEffect, useRef } from "react";
import SpikeBall from "./SpikeBall.jsx";

const SpikeBallSpawner = ({
  startPositions,    // Array of base positions (e.g. [[x, y, z], [x, y, z], ...])
  playerRef,         // Ref to the player, passed to each SpikeBall for collision detection.
  onCollision,       // Callback when a spike ball collides with the player.
  onSafePass,        // Callback when a spike ball safely passes the player.
  spawnInterval = 2000,  // Base interval (ms) between spawning new spike balls.
  lifetime = 4000       // How long (ms) each spike ball remains spawned.
}) => {
  const [spikeBalls, setSpikeBalls] = useState([]);
  const spawnIndex = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!startPositions || startPositions.length === 0) return;
    
    let isMounted = true;
    
    const spawnSpikeBall = () => {
      // Use the spawn positions directly from startPositions.
      const position = startPositions[spawnIndex.current];
      spawnIndex.current = (spawnIndex.current + 1) % startPositions.length;

      const id = Date.now() + Math.random();
      setSpikeBalls((prev) => [...prev, { id, position }]);

      // Remove this spike ball after its lifetime.
      setTimeout(() => {
        setSpikeBalls((prev) => prev.filter((s) => s.id !== id));
      }, lifetime);
    };

    const spawnLoop = () => {
      if (!isMounted) return;
      
      spawnSpikeBall();
      // Randomize the next spawn interval between 75% and 125% of spawnInterval.
      const nextInterval = spawnInterval * (0.75 + Math.random() * 0.4);
      timeoutRef.current = setTimeout(spawnLoop, nextInterval);
    };

    spawnLoop();

    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startPositions, spawnInterval, lifetime]);

  return (
    <>
      {spikeBalls.map(({ id, position }) => (
        <SpikeBall
          key={id}
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
