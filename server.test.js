const { server, io, rooms } = require("./server");
const Client = require("socket.io-client");

describe("Socket.IO Server", () => {
  let clientSocket;

  beforeAll((done) => {
    server.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on("connect", done);
    });
  });

  afterAll(() => {
    io.close();
    server.close();
    clientSocket.close();
  });

  test("should create a room and return a room ID", (done) => {
    clientSocket.emit("createRoom");
    clientSocket.on("roomCreated", (roomId) => {
      expect(roomId).toBeDefined();
      expect(typeof roomId).toBe("string");
      expect(rooms[roomId]).toBeDefined();
      expect(rooms[roomId].players[clientSocket.id]).toBeDefined();
      done();
    });
  });

  test("should notify other players when a new player joins a room", (done) => {
    let client2;
    clientSocket.emit("createRoom");
    clientSocket.on("roomCreated", (roomId) => {
      const port = server.address().port;
      client2 = new Client(`http://localhost:${port}`);
      client2.on("connect", () => {
        client2.emit("joinRoom", roomId);
        clientSocket.on("playerJoined", (data) => {
          expect(data.id).toBe(client2.id);
          client2.close();
          done();
        });
      });
    });
  });
});
