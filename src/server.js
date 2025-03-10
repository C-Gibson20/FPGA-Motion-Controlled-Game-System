
let MockServer = {
  getPlayerInfo: () => {
    return [
      { username: "John", model: "Luigi", avatar: "../public/images/mario.png", score: 100 },
      { username: "Junto", model: "Mario", avatar: "../public/images/luigi.png", score: 200 },
    ]
  }
};

let Server = MockServer;
export default Server;
