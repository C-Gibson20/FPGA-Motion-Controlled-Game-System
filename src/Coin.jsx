const Coin = ({ position, onCollect }) => {
    const { scene } = useGLTF("/models/Coin.glb");
    const coinRef = useRef();
  
    // Rotate the coin
    useFrame(() => {
      if (coinRef.current) {
        coinRef.current.rotation.y += 0.05; // Spin effect
      }
    });
  
    return <primitive ref={coinRef} object={scene} position={position} scale={0.5} />;
  };
  