
let MockServer = {
  getPlayerInfo: () => {
    return [
      { username: "John", model: "Luigi", avatar: "/images/mario.png", score: 100 },
      { username: "Junto", model: "Mario", avatar: "/images/luigi.png", score: 200 },
    ]
  }
};

let Server = MockServer;
export default Server;
