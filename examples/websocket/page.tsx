"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area"; // ScrollBar isn't used in the component, so you can remove it if not needed

type Message = {
  text: string;
  senderId: string;
  timestamp: string; // ISO string
};

// Define the formatTime function, but we'll use it conditionally
const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

// Create a new component for the timestamp that only renders on the client
function ClientOnlyTimestamp({ isoString }: { isoString: string }) {
  const [displayTime, setDisplayTime] = useState("");

  // This useEffect will run *only* on the client side after the initial render
  useEffect(() => {
    setDisplayTime(formatTime(isoString));
  }, [isoString]);

  // During the server render (hydration phase), displayTime will be empty.
  // On the client, it will be populated. This avoids the mismatch.
  return <span className="text-xs text-gray-500">{displayTime}</span>;
}

export default function SocketDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Effect to scroll to the bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const socketInstance = io({
      path: "/api/socketio",
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (socket && inputMessage.trim()) {
      const currentTime = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          text: inputMessage.trim(),
          senderId: socket.id || "user",
          timestamp: currentTime,
        },
      ]);
      socket.emit("message", {
        text: inputMessage.trim(),
        senderId: socket.id || "user",
        timestamp: currentTime,
      });
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Demo
            <span
              className={`text-sm px-2 py-1 rounded ${
                isConnected
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-80 w-full border rounded-md p-4">
            <div className="space-y-2" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center">No messages yet</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {msg.senderId}
                        </p>
                        <p className="text-gray-900">{msg.text}</p>
                      </div>
                      {/* Use the new ClientOnlyTimestamp component here */}
                      <ClientOnlyTimestamp isoString={msg.timestamp} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!isConnected || !inputMessage.trim()}
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
