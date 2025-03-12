import React from "react";

const Scoreboard = ({ playerNames = [], scores = [] }) => {
  // Prepare player data for the Scoreboard
  const updatedPlayers = playerNames.map((name, index) => ({
    username: name,
    score: scores[index] || 0,
    avatar: index === 0 ? "/images/mario.png" : "/images/waluigi.png"
  }));

  return (
    <div className="scoreboard">
      <ul>
        {updatedPlayers.map((p, index) => (
          <li key={`${p.username}-${index}`} className="leaderboard-entry">
            <img src={p.avatar} alt={p.username} className="player-avatar" />
            <div className="score-box">
              <span className="player-name">{p.username}</span>
              <span className="player-score">{p.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scoreboard;