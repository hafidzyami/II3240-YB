"use client";

import React, { useState, useEffect } from "react";
import AnimatedRealtimeChart from "./AnimatedRealtimeChart";
import LedControlNative from "./LedControlNative";
import ServoControlNative from "./ServoControlNative";
import { IoTData } from "../types/iot";
import { fetchHistoricalData } from "../services/api";
import { WebSocketService } from "../services/websocket";

const IoTDashboardNative: React.FC = () => {
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [latestData, setLatestData] = useState<IoTData | null>(null);
  const [dataHistory, setDataHistory] = useState<IoTData[]>([]);
  const [wsService, setWsService] = useState<WebSocketService | null>(null);

  useEffect(() => {
    const loadHistoricalData = async () => {
      const historicalData = await fetchHistoricalData();
      setDataHistory(historicalData.slice(0, 50));
    };

    loadHistoricalData();
    
    // Initialize WebSocket service
    const service = new WebSocketService();
    setWsService(service);

    // Setup event listeners
    service.on("connected", (connected: boolean) => {
      setWsStatus(connected ? "connected" : "disconnected");
    });

    service.on("iot_data", (message: any) => {
      if (message.data) {
        setLatestData(message.data);
        setDataHistory((prev) => {
          const newHistory = [message.data, ...prev];
          return newHistory.slice(0, 50);
        });
      }
    });

    service.on("error", (error: any) => {
      console.error("WebSocket error:", error);
      setWsStatus("disconnected");
    });

    return () => {
      service.disconnect();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          IoT Monitoring Dashboard (Native WebSocket)
        </h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Connection Status */}
      <div
        className={`mb-6 p-4 rounded-lg ${
          wsStatus === "connected"
            ? "bg-green-100 text-green-800"
            : wsStatus === "connecting"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {wsStatus === "connected"
          ? "🟢 Connected to IoT server"
          : wsStatus === "connecting"
          ? "🟡 Connecting to IoT server..."
          : "🔴 Disconnected from IoT server - Reconnecting..."}
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LedControlNative socket={wsService} />
        <ServoControlNative socket={wsService} />
      </div>
      
      {/* Latest Reading Card */}
      {latestData && (
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Latest Readings</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {latestData.temperature.toFixed(1)}°
              </div>
              <div className="text-sm text-gray-500 mt-1">Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {latestData.humidity.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Humidity</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {latestData.pressure.toFixed(0)}
              </div>
              <div className="text-sm text-gray-500 mt-1">Pressure</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(latestData.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatedRealtimeChart
          data={dataHistory}
          dataKey="temperature"
          label="Temperature"
          borderColor="#3b82f6"
          backgroundColor="rgba(59, 130, 246, 0.1)"
          gradientFrom="rgba(59, 130, 246, 0.05)"
          gradientTo="rgba(59, 130, 246, 0.2)"
          unit="°C"
        />
        <AnimatedRealtimeChart
          data={dataHistory}
          dataKey="humidity"
          label="Humidity"
          borderColor="#22c55e"
          backgroundColor="rgba(34, 197, 94, 0.1)"
          gradientFrom="rgba(34, 197, 94, 0.05)"
          gradientTo="rgba(34, 197, 94, 0.2)"
          unit="%"
        />
        <AnimatedRealtimeChart
          data={dataHistory}
          dataKey="pressure"
          label="Atmospheric Pressure"
          borderColor="#a855f7"
          backgroundColor="rgba(168, 85, 247, 0.1)"
          gradientFrom="rgba(168, 85, 247, 0.05)"
          gradientTo="rgba(168, 85, 247, 0.2)"
          unit=" hPa"
        />
      </div>
    </div>
  );
};

export default IoTDashboardNative;
