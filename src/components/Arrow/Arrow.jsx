import React from "react";
import {
  FiArrowUp,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
  FiCircle
} from "react-icons/fi";
import "./Arrow.css";

const Arrow = ({ type, position }) => {
  const iconMap = {
    ArrowUp: <FiArrowUp />,
    ArrowDown: <FiArrowDown />,
    ArrowLeft: <FiArrowLeft />,
    ArrowRight: <FiArrowRight />,
    Button: <FiCircle />
  };

  return (
    <div
      className={`arrow arrow-${type}`}
      style={{transform: `translate(${position.x}px, ${position.y}px)`,}}
    >
      <div className="arrow-icon">{iconMap[type]}</div>
    </div>
  );
};

export default Arrow;