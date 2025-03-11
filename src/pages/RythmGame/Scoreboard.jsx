import React from "react";

const Scoreboard = ({ players }) => {
  // Always use these icons for the two players.
  const defaultAvatars = [
    "/images/mario.png",    // Mario icon for player 1
    "/images/waluigi.png"   // Waluigi icon for player 2
  ];

  return (
    <div className="scoreboard">
      <ul>
        {players.map((player, index) => (
          <li key={`${player.username}-${index}`} className="leaderboard-entry">
            <img
              src={defaultAvatars[index]}
              alt={player.username}
              className="player-avatar"
            />
            <div className="score-box">
              <span className="player-name">{player.username}</span>
              <span className="player-score">{player.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Scoreboard;
