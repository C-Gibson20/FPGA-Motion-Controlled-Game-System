// import { StrictMode, useState } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import Menu from "./pages/Menu/Menu.jsx";
// import GameSel from "./pages/GameSel/GameSel.jsx";
// import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
// import "./pages/Menu/Menu.css";
// import "./pages/RythmGame/RhythmGame.css";
// import CoinGame from "./components/Coin/CoinGame.jsx";

// function Root() {
//   const [gameStarted, setGameStarted] = useState(false);
//   const [gameSel, setGameSel] = useState(null);
//   const [players, setPlayers] = useState([]);
//   const [showPopup, setShowPopup] = useState(false);
//   const [wsInstance, setWsInstance] = useState(null);
//   const [scores, setScores] = useState([]); // Global score state

//   // When starting, initialize scores for each player.
//   const handleStart = (selectedPlayers, ws) => {
//     setPlayers(selectedPlayers);
//     setWsInstance(ws);
//     setScores(selectedPlayers.map(() => 0)); // Initialize scores for all players
//     setGameSel(null);
//     setShowPopup(true);
//   };

//   // Global score updater function.
//   const updateScore = (playerIndex, points) => {
//     setScores(prevScores => {
//       const newScores = [...prevScores];
//       newScores[playerIndex] += points;
//       return newScores;
//     });
//   };

//   return (
//     <StrictMode>
//       <div className="container">
//         {!gameStarted && !showPopup ? (
//           <Menu onStart={handleStart} />
//         ) : !gameStarted && !gameSel ? (
//           <GameSel
//             scores={scores} // Pass scores to GameSel so they can be displayed
//             players={players} // Pass player names too
//             setGameSel={(selectedGame) => {
//               setGameSel(selectedGame);
//               setGameStarted(true); // Immediately start game when selected
//             }}
//             onExit={() => setShowPopup(true)}
//           />
//         ) : gameStarted ? (
//           // Always render RhythmGame as the wrapper.
//           <RhythmGame
//             gameSel={gameSel}
//             players={players}
//             scores={scores} // Use the global scores here
//             onScoreIncrement={updateScore} // Pass the updater
//             ws={wsInstance}
//             onExit={() => {
//               setGameStarted(false);
//               setGameSel(null);
//             }}
//           />
//         ) : null}
//       </div>
//     </StrictMode>
//   );
// }

// createRoot(document.getElementById("root")).render(<Root />);

import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Menu from "./pages/Menu/Menu.jsx";
import GameSel from "./pages/GameSel/GameSel.jsx";
import RhythmGame from "./pages/RythmGame/RhythmGame.jsx";
import "./pages/Menu/Menu.css";
import "./pages/RythmGame/RhythmGame.css";
import CoinGame from "./components/Coin/CoinGame.jsx";

function Root() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSel, setGameSel] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [wsInstance, setWsInstance] = useState(null);
  const [scores, setScores] = useState([]); // Global score state

  // Automatically simulate a start (skip Menu)
  // useEffect(() => {
  //   const simulatedPlayers = ["Player 1", "Player 2"];
  //   const simulatedWs = null; // You can replace this with a mock or real WebSocket if needed

  //   setPlayers(simulatedPlayers);
  //   setWsInstance(simulatedWs);
  //   setScores(simulatedPlayers.map(() => 0));
  //   setShowPopup(true); // This shows GameSel directly
  // }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8765");

    ws.onopen = () => {
      console.log("Connected to WebSocket server");
      simulatedPlayers = ["Player 1", "Player 2"];
      setPlayers(simulatedPlayers);
      setScores(simulatedPlayers.map(() => 0));

      ws.send(JSON.stringify({ type: "init", names: simulatedPlayers, numPlayers: 2 }));
      setShowPopup(true);
    };
  
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "startGame":
          console.log("Starting game", data.mode);
          setGameSel(data.mode);
          setGameStarted(true);
          break;
        
        case "score_data":
          break;

        default:
          console.log("Unknown message type", data.type);
        
      }
    };

    ws.onclose = () => console.log("Disconnected from WebSocket server");
  
    setWsInstance(ws);
    return () => ws.close();
  }, []);
  
  // Global score updater function.
  const updateScore = (playerIndex, points) => {
    setScores(prevScores => {
      const newScores = [...prevScores];
      newScores[playerIndex] += points;
      return newScores;
    });
  };

  return (
    <StrictMode>
      <div className="container">
        {!gameStarted && !gameSel ? (
          <GameSel
            scores={scores}
            players={players}
            setGameSel={(selectedGame) => {
              if (wsInstance) {
                wsInstance.send(JSON.stringify({
                  type: "game_selection",
                  mode: selectedGame
                }));
              }
            }}
            onExit={() => setShowPopup(true)}
          />        
        ) : gameStarted ? (
          <RhythmGame
            gameSel={gameSel}
            players={players}
            scores={scores}
            onScoreIncrement={updateScore}
            ws={wsInstance}
            onExit={() => {
              setGameStarted(false);
              setGameSel(null);
            }}
          />
        ) : null}
      </div>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
