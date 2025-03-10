// PlayerWaluigi.jsx
import React from "react";
import BasePlayer from "./BasePlayer";

const waluigiModels = {
  idle: { path: "/models/WaluigiIdle.glb", scale: 0.004 },
  jump: { path: "/models/WaluigiJump.glb", scale: 0.004 },
  left: { path: "/models/WaluigiSideStep.glb", scale: 0.004 },
  right: { path: "/models/WaluigiRightSideStep.glb", scale: 0.004 },
};

const RefactoredPlayerWaluigi = (props) => {
  return (
    <BasePlayer
      {...props}
      models={waluigiModels}
      movement="horizontal"
      animationTransition="fade"
    />
  );
};

export default RefactoredPlayerWaluigi;
