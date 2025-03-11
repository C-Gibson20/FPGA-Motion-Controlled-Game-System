import React from 'react';

const GameSel = ({ setGameSel }) => {
  const games = [
    { name: 'Spike Ball', image: 'NEED AN IMAGE' },
    { name: 'Coin Beat', image: 'NEED ANOTHER IMAGE' },
    { name: 'Arrow Game', image: 'NEED A THIRD IMAGE' },
  ];

  const containerStyle = {
    display: 'flex',
    height: '100vh',
  };

  const blockStyle = {
    flex: 1,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    cursor: 'pointer',
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const h1Style = { color: '#fff', fontSize: '3rem', textAlign: 'center' };

  return (
    <div style={containerStyle}>
      {games.map((game, idx) => (
        <div
          key={idx}
          style={{ ...blockStyle, backgroundImage: `url(${game.image})` }}
          onClick={() => setGameSel(game.name)}
        >
          <div style={overlayStyle}>
            <h1 style={h1Style}>{game.name}</h1>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameSel;

