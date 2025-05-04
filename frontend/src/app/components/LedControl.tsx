"use client";

import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

interface LedControlProps {
  socket: Socket | null;
}

const LedControl: React.FC<LedControlProps> = ({ socket }) => {
  const [ledState, setLedState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>("");
  const [voiceSupported, setVoiceSupported] = useState<boolean>(false);

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

  // Check if Web Speech API is supported
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
    }
  }, []);

  const startVoiceControl = () => {
    if (!voiceSupported) {
      alert("Voice control is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Try to detect user's preferred language, fallback to English
    recognition.lang = navigator.language.startsWith('id') ? 'id-ID' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceText("Listening...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setVoiceText(`Heard: "${transcript}"`);
      
      // Process voice command (English and Indonesian)
      if (transcript.includes("turn on") || transcript.includes("led on") || 
          transcript.includes("nyalakan") || transcript.includes("hidupkan")) {
        if (!ledState) {
          toggleLed();
        }
      } else if (transcript.includes("turn off") || transcript.includes("led off") || 
                 transcript.includes("matikan") || transcript.includes("padamkan")) {
        if (ledState) {
          toggleLed();
        }
      } else {
        setVoiceText(`Command not recognized: "${transcript}"`);
      }
    };

    recognition.onerror = (event: any) => {
      setVoiceText(`Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setVoiceText(""), 3000);
    };

    recognition.start();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">LED Control</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Toggle the LED on your IoT device - Use button or voice control
          </p>
        </div>
        <button
          onClick={toggleLed}
          disabled={isLoading || !socket?.connected}
          className={`
            relative px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 transform w-full sm:w-auto
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
        
        {/* Voice Control Button */}
        {voiceSupported && (
          <button
            onClick={startVoiceControl}
            disabled={isListening || !socket?.connected}
            className={`
              px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 transform w-full sm:w-auto mt-4 sm:mt-0
              ${isListening ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}
              ${isListening || !socket?.connected ? "opacity-75 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
              shadow-lg hover:shadow-xl
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{isListening ? "Listening..." : "Voice Control"}</span>
            </div>
          </button>
        )}
      </div>
      
      {/* Voice Feedback Text */}
      {voiceText && (
        <div className="mt-3 text-xs sm:text-sm text-gray-600 text-center">
          {voiceText}
        </div>
      )}
      
      {/* Status Indicator */}
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
        <div className={`
          w-2 h-2 rounded-full
          ${socket?.connected ? "bg-green-500 animate-pulse" : "bg-red-500"}
        `} />
        <span className="text-xs sm:text-sm text-gray-600">
          {socket?.connected ? "Connected to server" : "Disconnected"}
        </span>
        </div>
        {voiceSupported && (
          <div className="mt-2 sm:mt-0 text-xs sm:text-sm text-gray-500">
            🎤 Say "Turn on/off LED" or "Nyalakan/Matikan LED"
          </div>
        )}
      </div>
    </div>
  );
};

export default LedControl;
