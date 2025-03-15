import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import Arrow from "./Arrow.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import Background from "../../pages/RythmGame/Background.jsx";
import "./Arrow.css";

const COMMAND_MAPPING = {
  L: "ArrowLeft",
  R: "ArrowRight",
  J: "ArrowUp",
  B1: "ArrowUp",
  B2: "Button",
};

const getAnimationState = (command) => {
  const base = { jumpLow: false, left: false, right: false, still: false, click: false };
  switch (command) {
    case "J":
    case "B1":
      return { ...base, jumpLow: true };
    case "L":
      return { ...base, left: true };
    case "R":
      return { ...base, right: true };
    case "B2":
      return { ...base, click: true };
    default:
      return base;
  }
};

const ArrowGame = ({
  fpgaControls = {},
  players = ["Mario", "Waluigi"],
  ws,
  localPlayerName = "Mario",
}) => {
  const [arrows, setArrows] = useState([]);
  const [feedback, setFeedback] = useState({});
  const [localAnim, setLocalAnim] = useState(players.map(() => getAnimationState("N")));

  const feedbackRef = useRef({});
  const controlledPlayerRefs = useRef([]);

  useEffect(() => {
    controlledPlayerRefs.current = players.map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [players.length]);

  const showFeedback = (index, text, color) => {
    setFeedback((prev) => ({ ...prev, [index]: { text, color } }));
    clearTimeout(feedbackRef.current[index]);

    feedbackRef.current[index] = setTimeout(() => {
      setFeedback((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }, 600);
  };

  const handleInputCommand = (action, playerIndex) => {
    const anim = getAnimationState(action);
    setLocalAnim((prev) => {
      const next = [...prev];
      next[playerIndex] = anim;
      return next;
    });

    const mappedAction = COMMAND_MAPPING[action];
    if (!mappedAction || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(
      JSON.stringify({
        type: "player_input",
        player: playerIndex + 1,
        action: mappedAction,
        timestamp: Date.now() / 1000,
      })
    );
  };

  // Handle Keyboard Input for Local Player
  useEffect(() => {
    const KEY_MAP = {
      ArrowUp: "J",
      ArrowLeft: "L",
      ArrowRight: "R",
      " ": "B2",
    };

    const pressedKeys = new Set();

    const onKeyDown = (e) => {
      const cmd = KEY_MAP[e.key];
      if (!cmd || pressedKeys.has(cmd)) return;
      pressedKeys.add(cmd);
      handleInputCommand(cmd, 0);
    };

    const onKeyUp = (e) => {
      const cmd = KEY_MAP[e.key];
      pressedKeys.delete(cmd);
      handleInputCommand("N", 0);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Handle WebSocket Updates
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "gameStateUpdate" && data.mode === "Disco Dash") {
          setArrows(data.objects?.filter((obj) => obj.type?.startsWith("Arrow") || obj.type === "Button") || []);
        }

        if (data.type === "data") {
          const playerIndex = data.player - 1;
          handleInputCommand(data.data, playerIndex);
        }

        if (data.type === "score_feedback") {
          const { player, result } = data;
          const colorMap = {
            Perfect: "lime",
            Good: "yellow",
            Miss: "red",
          };
          showFeedback(player - 1, `${result}!`, colorMap[result] || "white");
        }
      } catch (err) {
        console.error("WS parse error in ArrowGame:", err);
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws]);

  const positionedPlayers = players.map((username, index) => {
    const spacing = 10 / players.length;
    const x = (-3 + index * spacing) * 0.3;
    return {
      username,
      position: [x, -0.7, 0],
    };
  });

  return (
    <div className="arrow-game-wrapper">
      <div className="arrow-game-container">
        <div className="hit-line" />
        {arrows.map((arrow) => (
          <Arrow key={arrow.id} type={arrow.type} position={{ x: arrow.x, y: arrow.y || 0 }} />
        ))}
      </div>

      {positionedPlayers.map((_, index) =>
        feedback[index] ? (
          <div
            key={`fb-${index}`}
            className={`hit-feedback feedback-player-${index}`}
            style={{ color: feedback[index].color }}
          >
            {feedback[index].text}
          </div>
        ) : null
      )}

      <Canvas className="arrow-game-canvas" camera={{ position: [0, 0, 10], fov: 10 }}>
        <Background imagePath="/images/disco.jpg" />
        <ambientLight intensity={4} />
        {positionedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          const anim = localAnim[index] || {};
          const PlayerComponent = index === 0 ? PlayerMario : PlayerWaluigi;

          return (
            <PlayerComponent
              key={index}
              username={player.username}
              initialPosition={player.position}
              isPlayerPlayer={isLocal}
              jumpLow={anim.jumpLow}
              left={anim.left}
              right={anim.right}
              still={anim.still}
              click={anim.click}
              ws={ws}
              playerRef={controlledPlayerRefs.current[index]}
            />
          );
        })}
      </Canvas>
    </div>
  );
};

export default ArrowGame;
