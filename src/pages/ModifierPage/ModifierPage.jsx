import { useState, useEffect, useRef } from "react";
import "./ModifierPage.css";

const MODIFIERS = [
  { name: "Speed Up", effect: "speed-up", color: "#ff0400" },
  { name: "No Modifier", effect: "none", color: "#0099ff" },
  { name: "No Modifier", effect: "none", color: "#ffd000" },
  { name: "No Modifier", effect: "none", color: "#009500" },
  { name: "Speed Up", effect: "speed-up", color: "#ff0400" },
  { name: "No Modifier", effect: "none", color: "#0099ff" },
  { name: "No Modifier", effect: "none", color: "#ffd000" },
  { name: "No Modifier", effect: "none", color: "#009500" },
  { name: "No Modifier", effect: "none", color: "#0099ff" },
];

export default function ModifierPage({ ws, onSelect }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedModifier, setSelectedModifier] = useState(null);
  const stopSpinRef = useRef(false);
  const speedRef = useRef(10);
  const [state, setState] = useState("start");
  

  const drawWheel = (context, angleOffset) => {
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;
    const numSegments = MODIFIERS.length;
    const segmentAngle = (2 * Math.PI) / numSegments;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "16px 'Luckiest Guy', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    MODIFIERS.forEach((mod, index) => {
      const startAngle = index * segmentAngle + angleOffset;
      const endAngle = startAngle + segmentAngle;

      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius, startAngle, endAngle);
      context.fillStyle = mod.color;
      context.fill();
      context.strokeStyle = "#000";
      context.stroke();

      const textAngle = startAngle + segmentAngle / 2;
      const textX = centerX + Math.cos(textAngle) * (radius * 0.6);
      const textY = centerY + Math.sin(textAngle) * (radius * 0.6);

      context.save();
      context.translate(textX, textY);
      context.rotate(textAngle);
      context.fillStyle = "#FFF";
      context.fillText(mod.name, 0, 0);
      context.restore();
    });

    context.beginPath();
    context.arc(centerX, centerY, 10, 0, 2 * Math.PI);
    context.fillStyle = "#000";
    context.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    drawWheel(context, (rotation * Math.PI) / 180);
  }, [rotation]);

  const [clickCount, setClickCount] = useState(0); // Track button presses

  useEffect(() => {
    if (ws) {
      const messageHandler = (event) => {
        console.log("RhythmGame received message:", event.data);
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === "data" && (payload.button1 || payload.button2)) {
            setClickCount((prev) => prev + 1); // Increase button press count

            setState((prevState) => {
              if (prevState === "start" && !selectedModifier && !spinning) {
                console.log("Auto-spinning wheel due to button press");
                spinWheel();
                return "spinning";
              } 
              else if (prevState === "spinning" && spinning) { 
                console.log("Stopping the wheel due to second button press");
                stopSpinRef.current = true; // Stop the spin
                return "end";
              }
              else if (prevState === "end" && selectedModifier && clickCount >= 2) { 
                console.log("Auto-continuing to next step due to third button press");
                onSelect(selectedModifier.effect); // Auto-continue
                setClickCount(0); // Reset click count for the next round
                setSelectedModifier(null); // Reset modifier selection
                return "start";
              }
              return prevState;
            });
          }
        } catch (err) {
          console.error("Error parsing message:", err);
        }
      };

      ws.addEventListener("message", messageHandler);

      return () => {
        ws.removeEventListener("message", messageHandler);
      };
    }
  }, [ws, selectedModifier, spinning, clickCount, onSelect]); // Dependencies added for correct updates



  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === " ") { // Spacebar to trigger slow down
        stopSpinRef.current = true;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    stopSpinRef.current = false;
    speedRef.current = 10; // Initial fast spin
    let currentRotation = rotation;

    const animateSpin = () => {
      if (speedRef.current > 0) {
        currentRotation = (currentRotation + speedRef.current) % 360;
        setRotation(currentRotation);
        
        if (stopSpinRef.current) {
          speedRef.current *= 0.95; // Gradual slow down
        }

        if (speedRef.current < 0.5) {
          setSpinning(false);
          speedRef.current = 0;
          const numSegments = MODIFIERS.length;
          const segmentAngle = 360 / numSegments;
          const pointerStatic = (270 - currentRotation + 360) % 360;
          const selectedIndex = Math.floor(pointerStatic / segmentAngle);
          setSelectedModifier(MODIFIERS[selectedIndex]);
          return;
        }

        requestAnimationFrame(animateSpin);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  return (
    <div className="modifier-container">
      <h1 className="wheel_title">
        <span className="wheel_word">
            <span>M</span><span>O</span><span>D</span><span>I</span><span>F</span><span>I</span><span>E</span><span>R</span>
        </span>
        <span className="wheel_word">
            <span>W</span><span>H</span><span>E</span><span>E</span><span>L</span>
        </span>
      </h1>
      <div className="wheel-wrapper">
        <canvas ref={canvasRef} width="300" height="300"></canvas>
        <div className="wheel-pointer"></div>
      </div>
      {!selectedModifier && (
        <button onClick={spinWheel} disabled={spinning}>
          {spinning ? "Spinning..." : "Spin"}
        </button>
      )}
      {selectedModifier && (
        <button onClick={() => onSelect(selectedModifier.effect)}>Continue</button>
      )}
    </div>
  );
}
