import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

let connectedPeersSocket = [];

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("connection called", socket.id);
    connectedPeersSocket.push(socket.id);
    connectedPeersSocket = [...new Set(connectedPeersSocket)];
    socket.once("disconnect", () => {
      connectedPeersSocket = connectedPeersSocket.filter((x) => x != socket.id);
    });

    socket.on("pre-offer", (data) => {
      console.log("data", data);
      const { callType, otherPersonCode } = data;
      const connectedPeer = connectedPeersSocket.find(
        (x) => x == otherPersonCode
      );
      console.log("connected peer is", connectedPeer);
      console.log("connectedPeersSocket", connectedPeersSocket);

      if (connectedPeer) {
        const data = {
          callerSocketId: socket.id,
          callType,
        };

        io.to(otherPersonCode).emit("pre-offer", data);
      } else {
        console.log("SOcket id not found");
      }
    });

    socket.on("pre-offer-answer", (data) => {
      const connectedPeer = connectedPeersSocket.find(
        (x) => x == data.callerSocketId
      );

      if (connectedPeer) {
        io.to(data.callerSocketId).emit("pre-offer-answer", data);
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
