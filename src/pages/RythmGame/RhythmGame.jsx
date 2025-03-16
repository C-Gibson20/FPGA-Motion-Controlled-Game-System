import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import SpikeBallGame from "../../components/SpikeBall/SpikeBallGame.jsx";
import CoinGame from "../../components/Coin/CoinGame.jsx";
import ArrowGame from "../../components/Arrow/ArrowGame.jsx";
import Scoreboard from "./Scoreboard.jsx";
import "./RhythmGame.css";

// Game map: keys must match gameSel
const GAMES = {
  "Bullet Barrage": SpikeBallGame,
  "Coin Cascade": CoinGame,
  "Disco Dash": ArrowGame,
};

// --- Helper: Parse FPGA Control Data ---
const parseFpgaControl = (data) => {
  const controls = {
    jump: false,
    left: false,
    right: false,
    still: false,
    click: false,
  };

  switch (data) {
    case "J":
    case "B1":
      controls.jump = true;
      break;
    case "L":
      controls.left = true;
      break;
    case "R":
      controls.right = true;
      break;
    case "N":
      controls.still = true;
      break;
    case "B2":
      controls.click = true;
      break;
    default:
      break;
  }

  return controls;
};

// --- Custom Hook: Handle WebSocket Logic ---
const useWebSocket = ({
  ws,
  players,
  scores,
  onScoreIncrement,
  setFpgaControls,
  setGameObjects,
}) => {
  const latestScoresRef = useRef(scores);

  useEffect(() => {
    latestScoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      console.log("RhythmGame received message:", event.data);

      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch (err) {
        console.error("Error parsing message:", err);
        return;
      }

      if (payload.type === "data") {
        const controls = parseFpgaControl(payload.data);
        setFpgaControls((prev) => ({
          ...prev,
          [payload.player]: controls,
        }));
      }

      if (payload.type === "gameStart" || payload.type === "gameStateUpdate") {
        setGameObjects(payload.objects || []);
        
        // If it's a gameStateUpdate, update scores as well
        if (payload.type === "gameStateUpdate" && payload.scores && typeof onScoreIncrement === "function") {
          const serverScores = payload.scores;
          players.forEach((_, index) => {
            const playerId = index + 1;
            const newScore = serverScores[playerId] || 0;
            const localScore = latestScoresRef.current[index] || 0;
            const delta = newScore - localScore;

            if (delta !== 0) {
              console.log(`Score delta for P${index + 1}: ${delta}`);
              onScoreIncrement(index, delta);
            }
          });
        }
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, players, onScoreIncrement, setFpgaControls, setGameObjects]);
};

// --- Main Component ---
const RhythmGame = ({ gameSel, players = [], scores, onScoreIncrement, ws, onExit }) => {
  const [fpgaControls, setFpgaControls] = useState({});
  const [gameObjects, setGameObjects] = useState([]);

  useWebSocket({
    ws,
    players,
    scores,
    onScoreIncrement: onScoreIncrement || (() => {}),
    setFpgaControls,
    setGameObjects,
  });

  // Ensure that `gameSel` is valid before attempting to load the game
  const SelectedGame = GAMES[gameSel];

  return (
    <div className="game-container">
      {SelectedGame ? (
        <SelectedGame
          players={players}
          scores={scores}
          gameObjects={gameObjects}
          fpgaControls={fpgaControls}
          onScoreIncrement={onScoreIncrement}
          onCoinCollect={() => console.log("Coin collected callback")}
          localPlayerName={players[0]}
          ws={ws}
        />
      ) : (
        <div style={{ color: "white", textAlign: "center", marginTop: "20px" }}>
          No game selected.
        </div>
      )}

      <button onClick={onExit} className="exit-button">
        ✖
      </button>
    </div>
  );
};


export default RhythmGame;
