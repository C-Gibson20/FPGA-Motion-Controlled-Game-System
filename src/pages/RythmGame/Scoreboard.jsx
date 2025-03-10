import React from "react";

const Scoreboard = ({ players }) => {
    return (
      <div className="scoreboard">
        <ul>
          {players
            .map((player) => (
              <li key={player.username} className="leaderboard-entry">
                <img src={player.avatar} alt={player.username} className="player-avatar" />
                <div className="score-box">
                  {/* <span className="player-name">{player.username}</span> */}
                  <span className="player-score">{player.score}</span>
                </div>
              </li>
            ))}
        </ul>
      </div>
    );
  };
  

export default Scoreboard;
