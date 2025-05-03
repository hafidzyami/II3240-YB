"use client";

import React, { useState } from "react";
import { WebSocketService } from "../services/websocket";

interface LedControlProps {
  socket: WebSocketService | null;
}

const LedControlNative: React.FC<LedControlProps> = ({ socket }) => {
  const [ledState, setLedState] = useState<boolean>(false);
  const [isChanging, setIsChanging] = useState<boolean>(false);

  const handleLedToggle = () => {
    if (!socket) {
      console.warn("WebSocket not connected");
      return;
    }

    setIsChanging(true);
    const newState = !ledState;

    // Send LED control message
    socket.send({
      type: "led_control",
      state: newState ? 1 : 0,
    });

    // Listen for acknowledgment
    const handleAck = (data: any) => {
      if (data.type === "led_control_ack") {
        if (data.success) {
          setLedState(data.state === 1);
        }
        setIsChanging(false);
        // Remove listener after receiving
        socket.off("led_control_ack", handleAck);
      }
    };

    socket.on("led_control_ack", handleAck);

    // Timeout fallback
    setTimeout(() => {
      setIsChanging(false);
      socket.off("led_control_ack", handleAck);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">LED Control</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`w-6 h-6 rounded-full mr-3 ${
              ledState ? "bg-green-500" : "bg-gray-300"
            }`}
          />
          <span className="text-gray-700">
            LED is currently {ledState ? "ON" : "OFF"}
          </span>
        </div>
        <button
          onClick={handleLedToggle}
          disabled={isChanging}
          className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
            isChanging
              ? "bg-gray-400 cursor-not-allowed"
              : ledState
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isChanging ? "Changing..." : ledState ? "Turn OFF" : "Turn ON"}
        </button>
      </div>
    </div>
  );
};

export default LedControlNative;
