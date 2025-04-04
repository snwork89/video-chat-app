"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase, getUserId } from "@/lib/supabase"
import { CALL_ACTION, CALL_TYPE } from "@/constant"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  FlipHorizontal,
  RepeatIcon as Record,
  Copy,
  MessageSquare,
  VideoIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface MessageType {
  message: string
  isMessageOwner: boolean
}

export default function Home() {
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  const [code, setCode] = useState("")
  const codeRef = useRef(code)

  const [otherPersonCode, setOtherPersonCode] = useState("")
  const [isStangerAllowed, setIsStrangerAllowed] = useState(false)
  const [chatMessage, setChatMessage] = useState("")
  const [messageList, setMessageList] = useState<MessageType[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [localStreamWidth, setLocalStreamWidth] = useState(200)
  const [localStreamHeight, setLocalStreamHeight] = useState(80)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  
  const [screenSharingActive, setScreenSharingActive] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const remotePersonCode = useRef<string>("")
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const channelRef = useRef<any>(null)

  const [userMediaConstraints, setUserMediaConstraints] = useState({
    audio: true,
    video: true,
  })

  const peerConnectionConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:13902" }],
  }

  // Initialize Supabase Realtime channel
  const initializeChannel = useCallback(async () => {
    const userId = getUserId()

    console.log("userid is",userId);
    setCode(userId)
    codeRef.current = userId

    // Create a channel for this user's ID
    const channel = supabase.channel(`rtc:${userId}`, {
      config: {
        broadcast: { self: true },
      },
    })

    // Handle pre-offer messages
    channel
      .on("broadcast", { event: "pre-offer" }, (payload) => {
        console.log("Received pre-offer", payload)
        const data = payload.payload
        remotePersonCode.current = data.callerSocketId

        if (confirm(`Incoming ${data.callType}`)) {
          acceptCallHandler(data)
        } else {
          rejectCallHandler(data)
        }
      })
      .on("broadcast", { event: "pre-offer-answer" }, (payload) => {
        console.log("Received pre-offer-answer", payload)
        handleAnswer(payload.payload)
      })
      .on("broadcast", { event: "ice-candidate" }, (payload) => {
        console.log("Received ice-candidate", payload)
        handleReceiveIceCandidates(payload.payload)
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Subscribed to channel rtc:${userId}`)
        }
      })

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const createPeerConnection = async () => {
    console.log("create peer connection called")
    peerConnectionRef.current = new RTCPeerConnection(peerConnectionConfig)

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate through Supabase Realtime
        const targetChannel = supabase.channel(`rtc:${remotePersonCode.current}`)
        targetChannel.subscribe()
        targetChannel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: {
            socketId: codeRef.current,
            candidate: event.candidate,
          },
        })
      }
    }

    peerConnectionRef.current.ondatachannel = (e) => {
      console.log("Data channel received", e.channel)
      if (!dataChannelRef.current) {
        dataChannelRef.current = e.channel

        dataChannelRef.current.onmessage = (e) => {
          setMessageList((x) => [...x, { isMessageOwner: false, message: e.data }])
        }
      }
    }

    peerConnectionRef.current.onicecandidateerror = (event) => {
      console.log("on ice candidate error called", event)
    }

    peerConnectionRef.current.onconnectionstatechange = (event) => {
      console.log("connection state changed")
    }

    setRemoteStream(new MediaStream())

    if (localStream != null) {
      for (const track of localStream?.getTracks()) {
        peerConnectionRef.current.addTrack(track, localStream)
      }
    }

    console.log("create peer connection called", peerConnectionRef.current)
  }

  const handleCreateOffer = async (pc: RTCPeerConnection) => {
    if (pc != null) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      return offer
    }
  }

  const handleAnswer = async (data: any) => {
    if (peerConnectionRef.current != null && data.answerData) {
      await peerConnectionRef.current?.setRemoteDescription(data.answerData)
    }
  }

  const handleReceiveIceCandidates = async (data: any) => {
    if (peerConnectionRef.current != null) {
      await peerConnectionRef.current?.addIceCandidate(data.candidate)
    }
  }

  useEffect(() => {
    // Initialize Supabase Realtime channel
    const cleanup = initializeChannel()

    return () => {
      // Execute cleanup function if it exists
      cleanup.then(cleanupFn => {
        if (cleanupFn) cleanupFn()
      })
    }
  }, [initializeChannel])

  useEffect(() => {
    codeRef.current = code
  }, [code])

  const handleCopyButtonClick = () => {
    navigator.clipboard.writeText(code)
  }

  const handleStrangerAllowedChange = () => {
    setIsStrangerAllowed(!isStangerAllowed)
  }

  const handleOtherPersonChatClicked = () => {
    console.log("chat")
  }

  const handleAcceptOffer = async (e: any) => {
    if (peerConnectionRef.current == null) {
      return
    }
    const offerObject = e.offerData

    await peerConnectionRef.current.setRemoteDescription(offerObject)
    const answer = await peerConnectionRef.current.createAnswer()
    await peerConnectionRef.current.setLocalDescription(answer)
    return answer
  }

  const acceptCallHandler = async (e: any) => {
    console.log("accept called with code", codeRef.current)
    console.log("socket object is", e)
    if (peerConnectionRef.current == null) {
      await createPeerConnection()
    }

    const createdAnswer = await handleAcceptOffer(e)

    // Send pre-offer-answer through Supabase Realtime
    const targetChannel = supabase.channel(`rtc:${e.callerSocketId}`)
    targetChannel.subscribe()
    targetChannel.send({
      type: "broadcast",
      event: "pre-offer-answer",
      payload: {
        callerSocketId: e.callerSocketId,
        callAction: CALL_ACTION.CALL_ACCEPTED,
        answerData: createdAnswer,
      },
    })
  }

  const rejectCallHandler = (e: any) => {
    // Send pre-offer-answer through Supabase Realtime
    const targetChannel = supabase.channel(`rtc:${e.callerSocketId}`)
    targetChannel.subscribe()
    targetChannel.send({
      type: "broadcast",
      event: "pre-offer-answer",
      payload: {
        callerSocketId: codeRef.current,
        callAction: CALL_ACTION.CALL_REJECTED,
      },
    })
  }

  const handleOtherPersonVideoCallClicked = async () => {
    console.log("button clicked", peerConnectionRef.current)
    if (peerConnectionRef.current == null) {
      await createPeerConnection()
    }

    dataChannelRef.current = peerConnectionRef.current!.createDataChannel("dc")

    dataChannelRef.current.onmessage = (e) => {
      setMessageList((x) => [...x, { isMessageOwner: false, message: e.data }])
    }

    const createdOffer = await handleCreateOffer(peerConnectionRef.current!)

    // Send pre-offer through Supabase Realtime
    const targetChannel = supabase.channel(`rtc:${otherPersonCode}`)
    targetChannel.subscribe()
    targetChannel.send({
      type: "broadcast",
      event: "pre-offer",
      payload: {
        callType: CALL_TYPE.PERSONAL_CALL,
        callerSocketId: codeRef.current,
        offerData: createdOffer,
      },
    })
  }

  const setLocalPreview = () => {
    console.log("naiv", navigator.mediaDevices.getSupportedConstraints())
    navigator.mediaDevices
      .getDisplayMedia(userMediaConstraints)
      .then((stream: any) => {
        console.log("stream ", stream)
        setLocalStream(stream)
      })
      .catch((err) => {
        console.log("not getting access to camera", err)
      })
  }

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream

      const videoSetting = localStream.getVideoTracks()[0].getSettings()

      if (videoSetting.aspectRatio) {
        setLocalStreamHeight(Math.round(localStreamWidth / videoSetting.aspectRatio / 4) * 4)
      }
      localVideoRef.current.addEventListener("loadedmetadata", () => {
        localVideoRef.current?.play()
      })

      if (peerConnectionRef.current == null) {
        createPeerConnection()
      }
    }
  }, [localStream, localVideoRef, remoteStream])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream

      remoteVideoRef.current.addEventListener("loadedmetadata", () => {
        remoteVideoRef.current?.play()
      })
    }
    if (remoteStream && peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = (event) => {
        console.log("track coming", event.track)
        remoteStream.addTrack(event.track)
      }
    }
  }, [remoteStream, remoteVideoRef])

  useEffect(() => {
    if (navigator.mediaDevices) {
      setLocalPreview()
    }
  }, [navigator.mediaDevices])

  const handleMessageSend = () => {
    if (dataChannelRef.current) {
      setMessageList((x) => [...x, { isMessageOwner: true, message: chatMessage }])
      dataChannelRef.current.send(chatMessage)
      setChatMessage("")
    }
  }

  const handleKeyDown = (e: any) => {
    if (e.key == "Enter") {
      handleMessageSend()
    }
  }

  const toggleMic = () => {
    setIsMicOn(!isMicOn)
  }

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn)
  }

  return (
    <div className="w-screen h-screen grid grid-cols-12 gap-4 bg-white text-gray-900 p-4">
      {/* Sidebar */}
      <div className="col-span-2 pt-6 px-4 border-r border-gray-200">
        <div className="font-medium text-lg">Personal Code</div>
        <div className="flex mt-2 items-center">
          <div className="bg-gray-100 px-3 py-2 rounded-lg flex-1 font-mono">{code}</div>
          <Button variant="outline" size="icon" className="ml-2" onClick={handleCopyButtonClick}>
            <Copy size={18} />
          </Button>
        </div>

        <div className="mt-8">
          <label htmlFor="other-person-code" className="block mb-2 text-sm font-medium">
            Other Person's Code
          </label>
          <Input
            type="text"
            id="other-person-code"
            value={otherPersonCode}
            onChange={(e) => {
              remotePersonCode.current = e.target.value
              setOtherPersonCode(e.target.value)
            }}
            className="bg-white"
          />
        </div>

        <div className="flex mt-3 gap-2">
          <Button variant="outline" className="flex items-center gap-1" onClick={handleOtherPersonChatClicked}>
            <MessageSquare size={18} />
            Chat
          </Button>
          <Button variant="outline" className="flex items-center gap-1" onClick={handleOtherPersonVideoCallClicked}>
            <VideoIcon size={18} />
            Video Call
          </Button>
        </div>

        <div className="mt-8">
          <div className="block mb-2 text-sm font-medium">Stranger</div>
        </div>

        <div className="flex mt-2 gap-2">
          <Button variant="outline" className="flex items-center gap-1">
            <MessageSquare size={18} />
            Chat
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <VideoIcon size={18} />
            Video Call
          </Button>
        </div>

        <div className="mt-12 flex items-center">
          <Checkbox id="isStrangerAllowed" checked={isStangerAllowed} onCheckedChange={handleStrangerAllowedChange} />
          <label htmlFor="isStrangerAllowed" className="ml-2 text-sm">
            Allow Stranger To Call
          </label>
        </div>
      </div>

      {/* Video Area */}
      <div className="col-span-8 relative rounded-xl overflow-hidden border border-gray-200 shadow-md">
        <div className="absolute h-full w-full bg-gray-100">
          <video className="h-full w-full object-cover" ref={remoteVideoRef}></video>
        </div>

        <div className="absolute top-5 left-5">
          <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <video
              height={localStreamHeight}
              width={localStreamWidth}
              ref={localVideoRef}
              className="bg-gray-800"
            ></video>
          </div>
        </div>

        <div className="absolute bottom-6 w-full flex justify-center gap-3">
          <Button
            variant={isMicOn ? "outline" : "secondary"}
            size="icon"
            className="rounded-full h-12 w-12 bg-white hover:bg-gray-100"
            onClick={toggleMic}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </Button>

          <Button
            variant={isCameraOn ? "outline" : "secondary"}
            size="icon"
            className="rounded-full h-12 w-12 bg-white hover:bg-gray-100"
            onClick={toggleCamera}
          >
            {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </Button>

          <Button variant="destructive" size="icon" className="rounded-full h-12 w-12">
            <PhoneOff size={20} />
          </Button>

          <Button variant="outline" size="icon" className="rounded-full h-12 w-12 bg-white hover:bg-gray-100">
            <FlipHorizontal size={20} />
          </Button>

          <Button variant="outline" size="icon" className="rounded-full h-12 w-12 bg-white hover:bg-gray-100">
            <Record size={20} />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="col-span-2 flex flex-col border-l border-gray-200 h-full">
        <div className="flex-1 overflow-y-auto p-4">
          {messageList.map((x, i) => (
            <div
              key={i}
              className={cn(
                "mb-2 p-3 rounded-lg max-w-[80%]",
                i % 2 === 0 ? "bg-gray-100 text-gray-900 self-start" : "bg-gray-800 text-white self-end ml-auto",
              )}
            >
              {x.message}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              value={chatMessage}
              className="flex-1"
              placeholder="Type a message..."
              onKeyDown={handleKeyDown}
              onChange={(e) => setChatMessage(e.target.value)}
            />
            <Button onClick={handleMessageSend}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

