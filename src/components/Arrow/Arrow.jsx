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

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`
  };

  return (
    <div
      className={`arrow arrow-${type}`}
      style={style}
    >
      <div className="arrow-icon">{iconMap[type]}</div>
    </div>
  );
};

export default Arrow;
