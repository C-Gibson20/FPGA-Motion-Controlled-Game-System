// import React, { useState, useEffect, useRef } from "react";
// import { Canvas } from "@react-three/fiber";
// import "./CoinGame.css"; 
// import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
// import PlayerMario from "../../components/Player/PlayerMario.jsx";
// import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
// import CoinSpawner from "../../components/Coin/CoinSpawner.jsx";
// import Background from "../../pages/RythmGame/Background.jsx";

// const CoinGame = ({
//   fpgaControls = {},
//   players = ["Mario", "Waluigi"],
//   scores, 
//   startPositions,
//   localPlayerName = "Mario",
//   onScoreIncrement
// }) => {
//   const processedPlayers = players.map((p) =>
//     typeof p === "string" ? { username: p } : p
//   );
//   const numPlayers = processedPlayers.length;
//   if (numPlayers === 0) return <div>No players</div>;

//   const safeScores = (scores && scores.length) ? scores : Array(numPlayers).fill(0);
  
//   // Create an array of refs for each player.
//   const controlledPlayerRefs = useRef([]);
//   useEffect(() => {
//     controlledPlayerRefs.current = Array(numPlayers)
//       .fill(null)
//       .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
//   }, [numPlayers]);

//   const handleCoinCollect = (playerIndex) => {
//     // Update score for the player who collected the coin.
//     onScoreIncrement(playerIndex, 1);
//     console.log("Coin collected by player:", playerIndex);
//     console.log(scores);
//   };

//   // Calculate positions for players so that they are evenly spread.
//   const updatedPlayers = processedPlayers.map((player, index) => {
//     const totalPlayers = processedPlayers.length;
//     const spacing = 10 / Math.max(1, totalPlayers);
//     let xPos = -3 + index * spacing;
//     xPos = xPos * 0.3;
//     return {
//       ...player,
//       position: [xPos, -0.7, 0],
//       score: safeScores[index] || 0,
//       avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
//     };
//   });

//   return (
//     <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
//       <Canvas shadows camera={{ position: [0, 0, 10], fov: 10 }}
//         onCreated={({ camera }) => {
//           camera.layers.enable(0);
//           camera.layers.enable(1);
//           camera.layers.enable(2);
//         }}
//         style={{ display: "block" }}
//       >
//         <Background imagePath={"/images/Castel.jpg"}/>
//         <directionalLight position={[10, 10, 5]} castShadow />
        
//         {updatedPlayers.map((player, index) => {
//           const isLocal = player.username === localPlayerName;
//           if (index === 0) {
//             return (
//               <PlayerMario
//                 key={`mario-${index}`}
//                 username={player.username}
//                 initialPosition={player.position}
//                 isPlayerPlayer={isLocal}
//                 jumpLow={fpgaControls?.[1]?.jump || false}
//                 left={fpgaControls?.[1]?.left || false}
//                 right={fpgaControls?.[1]?.right || false}
//                 still={fpgaControls?.[1]?.still || false}
//                 playerRef={controlledPlayerRefs.current[index]}
//               />
//             );
//           } else if (index === 1) {
//             return (
//               <PlayerWaluigi
//                 key={`waluigi-${index}`}
//                 username={player.username}
//                 initialPosition={player.position}
//                 isPlayerPlayer={isLocal}
//                 jumpLow={fpgaControls?.[2]?.jump || false}
//                 left={fpgaControls?.[2]?.left || false}
//                 right={fpgaControls?.[2]?.right || false}
//                 still={fpgaControls?.[2]?.still || false}
//                 playerRef={controlledPlayerRefs.current[index]}
//               />
//             );
//           } else {
//             return null;
//           }
//         })}
//         <CoinSpawner
//           startPositions={startPositions || updatedPlayers.map(p => p.position)}
//           playerRefs={controlledPlayerRefs.current}
//           onCoinCollect={(playerIndex) => handleCoinCollect(playerIndex)}
//         />
//       </Canvas>
//     </div>
//   );
// };

// export default CoinGame;

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./CoinGame.css";
import Scoreboard from "../../pages/RythmGame/Scoreboard.jsx";
import PlayerMario from "../../components/Player/PlayerMario.jsx";
import PlayerWaluigi from "../../components/Player/PlayerWaluigi.jsx";
import Coin from "./Coin.jsx";
import Background from "../../pages/RythmGame/Background.jsx";

const CoinGame = ({
  fpgaControls = {},
  players = ["Mario", "Waluigi"],
  scores = [],
  localPlayerName = "Mario",
  ws
}) => {
  const processedPlayers = players.map((p) =>
    typeof p === "string" ? { username: p } : p
  );
  const numPlayers = processedPlayers.length;
  if (numPlayers === 0) return <div>No players</div>;

  const [gameObjects, setGameObjects] = useState([]);
  const [remoteScores, setRemoteScores] = useState(Array(numPlayers).fill(0));

  // Player refs (for reporting position)
  const controlledPlayerRefs = useRef([]);
  useEffect(() => {
    controlledPlayerRefs.current = Array(numPlayers)
      .fill(null)
      .map((_, i) => controlledPlayerRefs.current[i] || React.createRef());
  }, [numPlayers]);

  // 🧠 Receive game state updates from server
  useEffect(() => {
    if (!ws) return;
    const handler = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "gameStateUpdate" && data.mode === "Coin Cascade") {
          setGameObjects(data.objects || []);
          const serverScores = data.scores || {};
          const newScores = players.map((_, index) => serverScores[index + 1] || 0);
          setRemoteScores(newScores);
        }
      } catch (err) {
        console.error("Error parsing gameStateUpdate:", err);
      }
    };
    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [ws]);

  // 🛰 Send player position to server every frame
  const ReportPosition = ({ playerIndex }) => {
    useFrame(() => {
      const ref = controlledPlayerRefs.current[playerIndex];
      if (ref?.current && ws?.readyState === WebSocket.OPEN) {
        const pos = new THREE.Vector3();
        ref.current.getWorldPosition(pos);
        ws.send(JSON.stringify({
          type: "player_position",
          player: playerIndex + 1,
          position: { x: pos.x, y: pos.y }
        }));
      }
    });
    return null;
  };

  const updatedPlayers = processedPlayers.map((player, index) => {
    const spacing = 10 / Math.max(1, numPlayers);
    let xPos = -3 + index * spacing;
    xPos = xPos * 0.3;
    return {
      ...player,
      position: [xPos, -0.7, 0],
      score: remoteScores[index] || 0,
      avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png",
    };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 10], fov: 10 }}
        onCreated={({ camera }) => {
          camera.layers.enable(0);
          camera.layers.enable(1);
          camera.layers.enable(2);
        }}
        style={{ display: "block" }}
      >
        <Background imagePath={"/images/Castel.jpg"} />
        <directionalLight position={[10, 10, 5]} castShadow />

        {/* 👥 Players */}
        {updatedPlayers.map((player, index) => {
          const isLocal = player.username === localPlayerName;
          const control = fpgaControls?.[index + 1] || {};
          const commonProps = {
            key: player.username,
            username: player.username,
            initialPosition: player.position,
            isPlayerPlayer: isLocal,
            jumpLow: control.jump || false,
            left: control.left || false,
            right: control.right || false,
            still: control.still || false,
            playerRef: controlledPlayerRefs.current[index],
          };

          return (
            <>
              {index === 0 ? (
                <PlayerMario {...commonProps} />
              ) : (
                <PlayerWaluigi {...commonProps} />
              )}
              <ReportPosition playerIndex={index} />
            </>
          );
        })}

        {/* 💰 Coins from server */}
        {gameObjects.map((obj) =>
          obj.type === "coin" ? (
            <Coin key={obj.id} position={[obj.x, obj.y, 0]} onCollect={() => {}} />
          ) : null
        )}
      </Canvas>

      <Scoreboard players={updatedPlayers} />
    </div>
  );
};

export default CoinGame;
