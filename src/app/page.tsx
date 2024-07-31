"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";

export default function Home() {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [code, setcode] = useState("");
  const [otherPersonCode, setOtherPersonCode] = useState("");
  const [isStangerAllowed, setIsStrangerAllowed] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const [localStream, setLocalStream] = useState(null);
  const [remoteSteram, setRemoteStream] = useState(null);
  const [screenSharingStream, setScreenSharingSteram] = useState(null);
  const [screenSharingActive, setScreenSharingActive] = useState(false);

  useEffect(() => {

    socket.on("connect", () => {
      console.log("connnected",socket.id)
      setcode(socket.id ?? "");
    });
  }, []);

  const handleCopyButtonClick = () => {
    navigator.clipboard.writeText(code);
  };

  const handleStrangerAllowedChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsStrangerAllowed(e.target.checked);
  };
  return (
    <div className="w-screen h-screen grid grid-cols-12 gap-1">
      <div className="pl-2 col-span-3 pt-10">
        <div>Personal Code</div>
        <div className="flex mt-2">
          <div>{code}</div>
          <button className="bg-red-300 ml-2" onClick={handleCopyButtonClick}>
            Copy
          </button>
        </div>
        <div className="mt-10">
          <label
            htmlFor="other-person-code"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Other Person's Code
          </label>
          <input
            type="text"
            id="other-person-code"
            value={otherPersonCode}
            onChange={(e) => setOtherPersonCode(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
          />
        </div>
        <div className="flex mt-2">
          <button className="bg-yellow-400 p-2 border rounded-md">Chat</button>
          <button className="ml-2 bg-blue-400 p-2 rounded-md">
            Video Call
          </button>
        </div>

        <div className="mt-10">
          <div className="block mb-2 text-sm font-medium text-gray-900">
            Stanger
          </div>
        </div>
        <div className="flex mt-2">
          <button className="bg-yellow-400 p-2 border rounded-md">Chat</button>
          <button className="ml-2 bg-blue-400 p-2 rounded-md">
            Video Call
          </button>
        </div>

        <div className="mt-20 flex items-center">
          <input
            onChange={handleStrangerAllowedChange}
            checked={isStangerAllowed}
            id="isStangerAllowed"
            type="checkbox"
            value=""
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            htmlFor="isStangerAllowed"
            className="ms-2 text-sm font-medium text-gray-90"
          >
            Allow Stranger To Call
          </label>
        </div>
      </div>
      <div className="bg-yellow-100 col-span-6 relative">
        <div className="bg-slate-400 absolute h-full w-full">
          <video ref={remoteVideoRef} autoPlay={true}></video>
        </div>
        <div className="bg-red-400 absolute top-5 left-5 h-52 w-44 rounded-md">
          <video ref={localVideoRef} muted={true}></video>
        </div>

        <div className="absolute bottom-10 w-full flex justify-evenly">
          <button className="bg-yellow-400 p-2 border rounded-md">Mic</button>
          <button className="bg-yellow-400 p-2 border rounded-md">
            Camera
          </button>
          <button className="bg-yellow-400 p-2 border rounded-md">
            End Call
          </button>
          <button className="bg-yellow-400 p-2 border rounded-md">
            Switch Camera
          </button>
          <button className="bg-yellow-400 p-2 border rounded-md">
            {" "}
            Record
          </button>
        </div>
      </div>
      <div className="flex bg-blue-100 col-span-3 pb-10">
        <div className="flex h-10 self-end">
          <input
            value={chatMessage}
            className="rounded-md ml-2 w-100"
            onChange={(e) => setChatMessage(e.target.value)}
          />
          <button className="ml-1 bg-yellow-400 p-2 border rounded-md">
            {" "}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
