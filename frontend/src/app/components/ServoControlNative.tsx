"use client";

import React, { useState } from "react";
import { WebSocketService } from "../services/websocket";

interface ServoControlProps {
  socket: WebSocketService | null;
}

const ServoControlNative: React.FC<ServoControlProps> = ({ socket }) => {
  const [servoAngle, setServoAngle] = useState<number>(90);
  const [currentAngle, setCurrentAngle] = useState<number>(90);
  const [isChanging, setIsChanging] = useState<boolean>(false);

  const handleServoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAngle = parseInt(e.target.value);
    setServoAngle(newAngle);
  };

  const handleServoSet = () => {
    if (!socket) {
      console.warn("WebSocket not connected");
      return;
    }

    setIsChanging(true);

    // Send Servo control message
    socket.send({
      type: "servo_control",
      angle: servoAngle,
    });

    // Listen for acknowledgment
    const handleAck = (data: any) => {
      if (data.type === "servo_control_ack") {
        if (data.success) {
          setCurrentAngle(data.angle);
        }
        setIsChanging(false);
        // Remove listener after receiving
        socket.off("servo_control_ack", handleAck);
      }
    };

    socket.on("servo_control_ack", handleAck);

    // Timeout fallback
    setTimeout(() => {
      setIsChanging(false);
      socket.off("servo_control_ack", handleAck);
    }, 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Servo Control</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Current Angle: {currentAngle}°</span>
          <span className="text-gray-700">Target: {servoAngle}°</span>
        </div>
        
        <div className="relative pt-1">
          <input
            type="range"
            min="0"
            max="180"
            value={servoAngle}
            onChange={handleServoChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
          </div>
        </div>

        <button
          onClick={handleServoSet}
          disabled={isChanging || currentAngle === servoAngle}
          className={`w-full px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
            isChanging
              ? "bg-gray-400 cursor-not-allowed"
              : currentAngle === servoAngle
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-purple-500 hover:bg-purple-600"
          }`}
        >
          {isChanging ? "Setting..." : "Set Angle"}
        </button>
      </div>
    </div>
  );
};

export default ServoControlNative;
