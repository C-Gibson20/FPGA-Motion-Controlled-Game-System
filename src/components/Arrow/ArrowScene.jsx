// ArrowScene.js
import React, { useRef } from "react";
import PlayerMario from "../Player/PlayerMario";
import ArrowGame from "./ArrowGame";

const ArrowScene = () => {
  const playerRef = useRef();

  const handleArrowMatch = (key) => {
    if (!playerRef.current) return;
    const event = new KeyboardEvent("keydown", { key });
    window.dispatchEvent(event);
    setTimeout(() => {
      const upEvent = new KeyboardEvent("keyup", { key });
      window.dispatchEvent(upEvent);
    }, 200);
  };

  return (
    <>
      <ArrowGame onMatch={handleArrowMatch} />
      <PlayerMario
        username="Player1"
        isPlayerPlayer={true}
        initialPosition={[0, 0, 0]}
        playerRef={playerRef}
      />
    </>
  );
};

export default ArrowScene;
