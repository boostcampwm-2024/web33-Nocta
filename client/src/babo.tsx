import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useSocketStore } from "./stores/useSocketStore";

const PerformanceComparison = () => {
  const [performanceData, setPerformanceData] = useState({
    individualEvents: {
      latencies: [],
      totalEvents: 0,
      averageLatency: 0,
      eventCounts: {
        "insert/char": 0,
        "delete/char": 0,
        "update/char": 0,
        "insert/block": 0,
        "delete/block": 0,
        "update/block": 0,
      },
    },
    networkStats: {
      requestCount: 0,
      totalDataSent: 0,
      avgRequestPerSecond: 0,
    },
    timeSeriesData: [],
  });

  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    let requestsLastSecond = 0;
    let lastSecondTimestamp = Date.now();
    const operationStartTimes = new Map();

    const eventTypes = [
      "insert/char",
      "delete/char",
      "update/char",
      "insert/block",
      "delete/block",
      "update/block",
    ];

    const handleEvent = (eventType, data) => {
      const operationId = `${eventType}-${Date.now()}`;
      const startTime = performance.now();
      operationStartTimes.set(operationId, startTime);

      requestsLastSecond++;
      const requestSize = JSON.stringify(data).length;

      // 작업 완료 시점 측정
      const endTime = performance.now();
      const duration = endTime - startTime;

      setPerformanceData((prev) => {
        const timestamp = Date.now();
        const newLatencies = [...prev.individualEvents.latencies, duration].slice(-50);
        const totalEvents = prev.individualEvents.totalEvents + 1;
        const avgLatency = newLatencies.reduce((a, b) => a + b, 0) / newLatencies.length;

        // 초당 요청 수 계산
        if (timestamp - lastSecondTimestamp >= 1000) {
          prev.networkStats.avgRequestPerSecond = requestsLastSecond;
          requestsLastSecond = 0;
          lastSecondTimestamp = timestamp;
        }

        const eventCounts = {
          ...prev.individualEvents.eventCounts,
          [eventType]: (prev.individualEvents.eventCounts[eventType] || 0) + 1,
        };

        // 시계열 데이터 업데이트
        const newTimeSeriesData = [
          ...prev.timeSeriesData,
          {
            timestamp,
            latency: duration,
            requestsPerSecond: prev.networkStats.avgRequestPerSecond,
            eventType,
          },
        ].slice(-100);

        return {
          individualEvents: {
            latencies: newLatencies,
            totalEvents,
            averageLatency: avgLatency,
            eventCounts,
          },
          networkStats: {
            requestCount: prev.networkStats.requestCount + 1,
            totalDataSent: prev.networkStats.totalDataSent + requestSize,
            avgRequestPerSecond: prev.networkStats.avgRequestPerSecond,
          },
          timeSeriesData: newTimeSeriesData,
        };
      });

      operationStartTimes.delete(operationId);
    };

    // 이벤트 리스너 등록
    eventTypes.forEach((eventType) => {
      socket.on(eventType, (data) => handleEvent(eventType, data));
    });

    return () => {
      eventTypes.forEach((eventType) => {
        socket.off(eventType);
      });
    };
  }, [socket]);

  const chartData = performanceData.timeSeriesData.map((data, index) => ({
    name: index,
    latency: data.latency,
    requestsPerSecond: data.requestsPerSecond,
  }));

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">개별 이벤트 모드 성능 모니터링</h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">이벤트 통계</h3>
          <div className="space-y-2">
            <p>총 이벤트 수: {performanceData.individualEvents.totalEvents}</p>
            <p>평균 지연 시간: {performanceData.individualEvents.averageLatency.toFixed(2)}ms</p>
            <p>초당 요청 수: {performanceData.networkStats.avgRequestPerSecond}</p>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">네트워크 통계</h3>
          <div className="space-y-2">
            <p>총 요청 수: {performanceData.networkStats.requestCount}</p>
            <p>
              전송된 데이터: {(performanceData.networkStats.totalDataSent / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">이벤트 타입별 카운트</h3>
          <div className="space-y-2">
            {Object.entries(performanceData.individualEvents.eventCounts).map(([type, count]) => (
              <p key={type}>
                {type}: {count}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="h-80">
          <h3 className="text-lg font-semibold mb-3">지연 시간 & 요청 수 추이</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="latency"
                stroke="#8884d8"
                name="지연 시간 (ms)"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="requestsPerSecond"
                stroke="#82ca9d"
                name="초당 요청 수"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceComparison;
