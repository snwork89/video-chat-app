"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { socket } from "../socket";
import { CALL_ACTION, CALL_TYPE } from "@/constant";

export default function Home() {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [code, setcode] = useState("");
  const codeRef = useRef(code);

  const [otherPersonCode, setOtherPersonCode] = useState("");
  const [isStangerAllowed, setIsStrangerAllowed] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localStreamWidth, setLocalStreamWidth] = useState(200);
  const [localStreamHeight, setLocalStreamHeight] = useState(80);
  const [remoteSteram, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenSharingStream, setScreenSharingSteram] = useState(null);
  const [screenSharingActive, setScreenSharingActive] = useState(false);

  const [userMediaConstraints, setUserMediaConstraints] = useState({
    audio: true,
    video: true,
  });

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection();

    peerConnection.onicecandidate = (event) => {
      console.log("on ice candidarte", event);
    };

    peerConnection.onconnectionstatechange = (event) => {
      console.log("connection state changed");
    };
    const tempRemoteSteam = new MediaStream();
    setRemoteStream(tempRemoteSteam);

    peerConnection.ontrack = (event)=>{
      remoteSteram?.addTrack(event.track);
    }
  };

  useEffect(() => {
    socket.connect();
    socket.on("connect", () => {
      setcode(socket.id ?? "");
    });
    socket.on("pre-offer", (e) => {
      if (confirm(`Incoming ${e.callType}`)) {
        acceptCallHandler(e);
      } else {
        rejectCallHandler(e);
      }
    });

    socket.on("pre-offer-answer", (data) => {
      console.log("data", data);
    });

    return () => {
      socket.off("pre-offer");
    };
  }, []);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  const handleCopyButtonClick = () => {
    navigator.clipboard.writeText(code);
  };

  const handleStrangerAllowedChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setIsStrangerAllowed(e.target.checked);
  };

  const handleOtherPersonChatClicked = () => {
    console.log("chat");
  };

  const acceptCallHandler = (e: any) => {
    console.log("accept called with code", codeRef.current);
    socket.emit("pre-offer-answer", {
      callerSocketId: e.callerSocketId,
      callAction: CALL_ACTION.CALL_ACCEPTED,
    });
  };

  const rejectCallHandler = (e: any) => {
    socket.emit("pre-offer-answer", {
      callerSocketId: e.callerSocketId,
      callAction: CALL_ACTION.CALL_REJECTED,
    });
  };

  const handleOtherPersonVideoCallClicked = () => {
    console.log("called");
    const data = {
      callType: CALL_TYPE.PERSONAL_CALL,
      otherPersonCode: otherPersonCode,
    };
    socket.emit("pre-offer", data);
  };

  const setLocalPreview = () => {
    console.log("naiv", navigator.mediaDevices.getSupportedConstraints());
    navigator.mediaDevices
      .getDisplayMedia(userMediaConstraints)
      .then((stream: any) => {
        console.log("stream ", stream);
        setLocalStream(stream);
      })
      .catch((err) => {
        console.log("not getting access to camera", err);
      });
  };

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;

      const videoSetting = localStream.getVideoTracks()[0].getSettings();

      if (videoSetting.aspectRatio) {
        setLocalStreamHeight(
          Math.round(localStreamWidth / videoSetting.aspectRatio / 4) * 4
        );
      }
      localVideoRef.current.addEventListener("loadedmetadata", () => {
        localVideoRef.current?.play();
      });
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    if (remoteSteram && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteSteram;

    
      remoteVideoRef.current.addEventListener("loadedmetadata", () => {
        remoteVideoRef.current?.play();
      });
    }
  }, [remoteSteram, remoteVideoRef]);

  useEffect(() => {
    if (navigator.mediaDevices) {
      setLocalPreview();
    }
  }, [navigator.mediaDevices]);

  useEffect(() => {
    console.log("use effect");
  }, []);
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
          <button
            className="bg-yellow-400 p-2 border rounded-md"
            onClick={handleOtherPersonChatClicked}
          >
            Chat
          </button>
          <button
            className="ml-2 bg-blue-400 p-2 rounded-md"
            onClick={handleOtherPersonVideoCallClicked}
          >
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
          <video ref={remoteVideoRef}></video>
        </div>
        <div className={`bg-red-400 absolute top-5 left-5 rounded-md`}>
          <video
            height={localStreamHeight}
            width={localStreamWidth}
            ref={localVideoRef}
          ></video>
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
