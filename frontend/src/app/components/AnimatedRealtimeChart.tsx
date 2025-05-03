"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { IoTData } from "../types/iot";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface AnimatedRealtimeChartProps {
  data: IoTData[];
  dataKey: keyof Pick<IoTData, "temperature" | "humidity" | "pressure">;
  label: string;
  borderColor: string;
  backgroundColor: string;
  gradientFrom?: string;
  gradientTo?: string;
  unit?: string;
}

const AnimatedRealtimeChart: React.FC<AnimatedRealtimeChartProps> = ({
  data,
  dataKey,
  label,
  borderColor,
  backgroundColor,
  gradientFrom,
  gradientTo,
  unit = "",
}) => {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);



  // Create a moving window of 3 minutes for better visibility
  const windowMinutes = 3;
  const minTime = new Date(currentTime.getTime() - windowMinutes * 60 * 1000);
  const maxTime = new Date(currentTime.getTime() + 5000); // Add 5 seconds buffer to the right
  
  // Filter data to only show within the time window
  const filteredData = data.filter(item => {
    const itemTime = new Date(item.timestamp);
    return itemTime >= minTime && itemTime <= maxTime;
  });
  
  // Always include the current time in the chart even if there's no data
  const chartData: ChartData<"line"> = {
    labels: filteredData.map((item) => new Date(item.timestamp)),
    datasets: [
      {
        label,
        data: filteredData.length > 0 ? filteredData.map((item) => ({
          x: new Date(item.timestamp),
          y: item[dataKey],
        })) : [],
        borderColor,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          
          if (!chartArea) {
            return backgroundColor;
          }
          
          // Create gradient
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, gradientFrom || backgroundColor);
          gradient.addColorStop(1, gradientTo || borderColor);
          
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: borderColor,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverBackgroundColor: borderColor,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animation for smoother real-time updates
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (tooltipItems) => {
            const date = new Date(tooltipItems[0].parsed.x);
            return date.toLocaleString();
          },
          label: (context) => {
            return `${label}: ${context.parsed.y.toFixed(2)}${unit}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        min: minTime.getTime(),
        max: maxTime.getTime(),
        time: {
          unit: "second",
          stepSize: 20,
          displayFormats: {
            second: "HH:mm:ss",
            minute: "HH:mm",
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          maxRotation: 0,
          autoSkip: false,
          maxTicksLimit: 10,
          font: {
            size: 11,
          },
          color: 'rgba(0, 0, 0, 0.6)',
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
          },
          callback: (value) => `${value}${unit}`,
        },
      },
    },
  };

  // Update chart when data changes or time updates
  useEffect(() => {
    if (chartRef.current) {
      // Only update the scales without animation for smoother experience
      chartRef.current.options.scales!.x!.min = minTime.getTime();
      chartRef.current.options.scales!.x!.max = maxTime.getTime();
      chartRef.current.update('none');
    }
  }, [data, currentTime, minTime, maxTime]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
        <div className="flex items-center space-x-4">
          {data.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold" style={{ color: borderColor }}>
                {data[0][dataKey].toFixed(1)}{unit}
              </span>
              <span className="text-sm text-gray-500">Current</span>
            </div>
          )}
          <div className="text-sm text-gray-400">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>
      <div className="h-64 relative">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
};

export default AnimatedRealtimeChart;
