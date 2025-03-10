const CoinSpawner = ({ players }) => {
    const [coins, setCoins] = useState([]);
  
    // Generate a random position within range
    const randomPosition = () => {
      return [Math.random() * 6 - 3, -0.7, Math.random() * 3 - 1.5]; // Adjust range
    };
  
    useEffect(() => {
      const spawnCoin = () => {
        setCoins((prevCoins) => [...prevCoins, { id: Date.now(), position: randomPosition() }]);
      };
  
      const interval = setInterval(spawnCoin, 3000); // Spawn a coin every 3 seconds
      return () => clearInterval(interval);
    }, []);
  
    const collectCoin = (coinId) => {
      setCoins((prevCoins) => prevCoins.filter((coin) => coin.id !== coinId));
      console.log("Coin collected!"); // You can update the score here
    };
  
    return (
      <>
        {coins.map((coin) => (
          <Coin key={coin.id} position={coin.position} onCollect={() => collectCoin(coin.id)} />
        ))}
      </>
    );
  };
  