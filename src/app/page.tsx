'use client';

import {socket} from "../socket";

export default function Home() {
  socket.on("connect", ()=>{
    console.log("connectewd",process.env.MONGODB_URI);
  });
  return (
    <div>Home Page</div>
  );
}
