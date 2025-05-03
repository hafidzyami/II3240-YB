"use client";

import React, { useState } from "react";
import { Socket } from "socket.io-client";

interface LedControlProps {
  socket: Socket | null;
}

const LedControl: React.FC<LedControlProps> = ({ socket }) => {
  const [ledState, setLedState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toggleLed = () => {
    if (!socket || !socket.connected) {
      alert("Not connected to server");
      return;
    }

    setIsLoading(true);
    const newState = !ledState;
    
    // Send command through Socket.IO
    socket.emit("led_control", { state: newState ? 1 : 0 });
    
    // Optimistically update UI
    setLedState(newState);
    
    // Reset loading state after short delay
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">LED Control</h3>
          <p className="text-sm text-gray-500 mt-1">
            Toggle the LED on your IoT device
          </p>
        </div>
        <button
          onClick={toggleLed}
          disabled={isLoading || !socket?.connected}
          className={`
            relative px-6 py-3 rounded-lg font-medium transition-all duration-300 transform
            ${
              ledState
                ? "bg-green-500 hover:bg-green-600 text-white shadow-green-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }
            ${isLoading ? "opacity-75 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
            ${!socket?.connected ? "opacity-50 cursor-not-allowed" : ""}
            shadow-lg hover:shadow-xl
          `}
        >
          <div className="flex items-center space-x-2">
            {/* LED Indicator */}
            <div className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${ledState ? "bg-white animate-pulse" : "bg-gray-500"}
            `} />
            
            {/* Button Text */}
            <span>{ledState ? "Turn OFF" : "Turn ON"}</span>
            
            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </button>
      </div>
      
      {/* Status Indicator */}
      <div className="mt-4 flex items-center space-x-2">
        <div className={`
          w-2 h-2 rounded-full
          ${socket?.connected ? "bg-green-500 animate-pulse" : "bg-red-500"}
        `} />
        <span className="text-sm text-gray-600">
          {socket?.connected ? "Connected to server" : "Disconnected"}
        </span>
      </div>
    </div>
  );
};

export default LedControl;
