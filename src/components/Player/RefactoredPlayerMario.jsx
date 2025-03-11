// PlayerMario.jsx
import React from "react";
import BasePlayer from "./BasePlayer";

const marioModels = {
  idle: { path: "/models/MarioIdle.glb", scale: 0.003 },
  jump: { path: "/models/MarioJump.glb", scale: 0.003 },
  left: { path: "/models/MarioSideStep.glb", scale: 0.003 },
  right: { path: "/models/MarioRightSideStep.glb", scale: 0.003 },
};

const RefactoredPlayerMario = (props) => {
  return (
    <BasePlayer
      {...props}
      models={marioModels}
      movement="horizontal" // only left/right movement
      animationTransition="fade" // use fade transitions like your original PlayerMario
    />
  );
};

export default RefactoredPlayerMario;
