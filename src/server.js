
let MockServer = {
  getPlayerInfo: () => {
    return [
      { username: "John", model: "Luigi", score: 100 },
      { username: "Junto", model: "Mario", score: 200 },
    ]
  }
};

let Server = MockServer;
export default Server;
