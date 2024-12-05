import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useSocketStore } from "./stores/useSocketStore";

const BatchEfficiencyMonitor = () => {
  // 네트워크 효율성과 처리 성능을 분리하여 저장
  const [metrics, setMetrics] = useState({
    network: {
      totalRequests: 0,
      savedRequests: 0, // 배치 처리로 절약된 요청 수
      totalDataSent: 0,
      totalDataReceived: 0,
      averageLatency: 0,
      latencyHistory: [],
    },
    processing: {
      operationsProcessed: 0,
      batchesProcessed: 0,
      averageBatchSize: 0,
      processingTimeHistory: [],
      operationsPerSecond: 0,
    },
    resourceUsage: {
      memoryUsage: [],
      cpuUsage: [],
      timestamp: [],
    },
    batchEfficiency: {
      networkSavingsPercent: 0,
      processingEfficiencyGain: 0,
      timeHistory: [],
    },
  });

  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    let operationCount = 0;
    let batchStartTime = 0;
    let operationsThisSecond = 0;
    let lastSecondTimestamp = Date.now();

    // 네트워크 지연시간 측정
    const measureNetworkLatency = async () => {
      const start = performance.now();
      return new Promise((resolve) => {
        socket.emit("ping", () => {
          const latency = performance.now() - start;
          resolve(latency);
        });
      });
    };

    // 주기적으로 네트워크 지연시간 측정
    const latencyInterval = setInterval(async () => {
      const latency = await measureNetworkLatency();
      setMetrics((prev) => ({
        ...prev,
        network: {
          ...prev.network,
          latencyHistory: [...prev.network.latencyHistory.slice(-30), latency],
          averageLatency: prev.network.averageLatency * 0.9 + latency * 0.1,
        },
      }));
    }, 2000);

    // 배치 작업 모니터링
    socket.on("batch/operations", (batch) => {
      const batchSize = batch.length;
      const timestamp = Date.now();
      const processingTime = performance.now() - batchStartTime;

      // 배치 처리로 인한 네트워크 요청 절감 계산
      const savedRequests = batchSize - 1; // 배치로 절약된 요청 수
      const dataSize = new TextEncoder().encode(JSON.stringify(batch)).length;

      setMetrics((prev) => {
        // 초당 작업 수 계산
        operationsThisSecond += batchSize;
        if (timestamp - lastSecondTimestamp >= 1000) {
          operationsThisSecond = 0;
          lastSecondTimestamp = timestamp;
        }

        // 효율성 계산
        const networkSavingsPercent = (savedRequests / batchSize) * 100;
        const processingEfficiencyGain =
          ((batchSize * prev.network.averageLatency - processingTime) /
            (batchSize * prev.network.averageLatency)) *
          100;

        return {
          network: {
            ...prev.network,
            totalRequests: prev.network.totalRequests + 1,
            savedRequests: prev.network.savedRequests + savedRequests,
            totalDataSent: prev.network.totalDataSent + dataSize,
          },
          processing: {
            ...prev.processing,
            operationsProcessed: prev.processing.operationsProcessed + batchSize,
            batchesProcessed: prev.processing.batchesProcessed + 1,
            averageBatchSize:
              (prev.processing.averageBatchSize * prev.processing.batchesProcessed + batchSize) /
              (prev.processing.batchesProcessed + 1),
            processingTimeHistory: [
              ...prev.processing.processingTimeHistory.slice(-30),
              { time: processingTime / batchSize, operations: batchSize },
            ],
            operationsPerSecond: operationsThisSecond,
          },
          batchEfficiency: {
            ...prev.batchEfficiency,
            networkSavingsPercent,
            processingEfficiencyGain,
            timeHistory: [
              ...prev.batchEfficiency.timeHistory.slice(-30),
              {
                timestamp,
                savings: networkSavingsPercent,
                efficiency: processingEfficiencyGain,
              },
            ],
          },
          resourceUsage: {
            ...prev.resourceUsage,
            timestamp: [...prev.resourceUsage.timestamp.slice(-30), timestamp],
          },
        };
      });
    });

    // 개별 작업 시작 시점 기록
    const handleOperationStart = () => {
      batchStartTime = performance.now();
      operationCount++;
    };

    // 이벤트 리스너 등록
    socket.on("operation/start", handleOperationStart);

    return () => {
      clearInterval(latencyInterval);
      socket.off("batch/operations");
      socket.off("operation/start");
    };
  }, [socket]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg space-y-8">
      <h2 className="text-2xl font-bold">배치 처리 효율성 모니터링</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* 네트워크 효율성 */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">네트워크 효율성</h3>
          <div className="space-y-2">
            <p>총 네트워크 요청 수: {metrics.network.totalRequests}</p>
            <p>절약된 요청 수: {metrics.network.savedRequests}</p>
            <p>
              요청 절감률:{" "}
              {(
                (metrics.network.savedRequests /
                  (metrics.network.totalRequests + metrics.network.savedRequests)) *
                100
              ).toFixed(2)}
              %
            </p>
            <p>평균 네트워크 지연시간: {metrics.network.averageLatency.toFixed(2)}ms</p>
            <p>전송된 총 데이터: {(metrics.network.totalDataSent / 1024).toFixed(2)}KB</p>
          </div>
        </div>

        {/* 처리 효율성 */}
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">처리 효율성</h3>
          <div className="space-y-2">
            <p>처리된 총 작업 수: {metrics.processing.operationsProcessed}</p>
            <p>처리된 배치 수: {metrics.processing.batchesProcessed}</p>
            <p>평균 배치 크기: {metrics.processing.averageBatchSize.toFixed(2)}</p>
            <p>초당 처리 작업 수: {metrics.processing.operationsPerSecond}</p>
            <p>처리 효율 향상: {metrics.batchEfficiency.processingEfficiencyGain.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      {/* 효율성 추이 차트 */}
      <div className="h-80">
        <h3 className="text-lg font-semibold mb-3">효율성 지표 추이</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metrics.batchEfficiency.timeHistory}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip labelFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} />
            <Legend />
            <Line
              type="monotone"
              dataKey="savings"
              name="네트워크 요청 절감률 (%)"
              stroke="#8884d8"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="efficiency"
              name="처리 효율 향상률 (%)"
              stroke="#82ca9d"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 작업 처리 시간 분포 */}
      <div className="h-80">
        <h3 className="text-lg font-semibold mb-3">배치 크기별 처리 시간</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics.processing.processingTimeHistory}>
            <XAxis dataKey="operations" label="배치 크기" />
            <YAxis label="처리 시간 (ms)" />
            <Tooltip />
            <Legend />
            <Bar dataKey="time" name="작업당 처리 시간 (ms)" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BatchEfficiencyMonitor;
