"use client";

import { useCallback, useState } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Brain, Sparkles } from "lucide-react";

const initialNodes: Node[] = [
    {
        id: "dream",
        type: "input",
        position: { x: 250, y: 0 },
        data: { label: "🎯 目標: フルスタックエンジニア" },
        style: {
            background: "linear-gradient(135deg, #3ea8ff, #60c5ff)",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            padding: "16px 24px",
            borderRadius: "12px",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(62, 168, 255, 0.3)",
        },
    },
    {
        id: "frontend",
        position: { x: 100, y: 120 },
        data: { label: "Frontend\n(React/Next.js)" },
        style: {
            background: "#1e293b",
            border: "1px solid #334155",
            color: "#f8fafc",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
        },
    },
    {
        id: "backend",
        position: { x: 400, y: 120 },
        data: { label: "Backend\n(Python/FastAPI)" },
        style: {
            background: "#1e293b",
            border: "1px solid #334155",
            color: "#f8fafc",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "12px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
        },
    },
    {
        id: "task1",
        position: { x: 0, y: 240 },
        data: { label: "📚 React Query 学習" },
        style: {
            background: "#22c55e20",
            border: "1px solid #22c55e",
            color: "#22c55e",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "11px",
        },
    },
    {
        id: "task2",
        position: { x: 150, y: 240 },
        data: { label: "🔧 API連携実装" },
        style: {
            background: "#f59e0b20",
            border: "1px solid #f59e0b",
            color: "#f59e0b",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "11px",
        },
    },
    {
        id: "task3",
        position: { x: 320, y: 240 },
        data: { label: "🐍 FastAPI入門" },
        style: {
            background: "#8b5cf620",
            border: "1px solid #8b5cf6",
            color: "#8b5cf6",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "11px",
        },
    },
    {
        id: "task4",
        position: { x: 470, y: 240 },
        data: { label: "🗄️ DB設計" },
        style: {
            background: "#ec489920",
            border: "1px solid #ec4899",
            color: "#ec4899",
            padding: "10px 16px",
            borderRadius: "8px",
            fontSize: "11px",
        },
    },
    {
        id: "today",
        type: "output",
        position: { x: 200, y: 360 },
        data: { label: "✨ 今日やること: React Query 学習 (30分)" },
        style: {
            background: "linear-gradient(135deg, #22c55e, #10b981)",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)",
        },
    },
];

const initialEdges: Edge[] = [
    { id: "e-dream-frontend", source: "dream", target: "frontend", animated: true, style: { stroke: "#3ea8ff" } },
    { id: "e-dream-backend", source: "dream", target: "backend", animated: true, style: { stroke: "#3ea8ff" } },
    { id: "e-frontend-task1", source: "frontend", target: "task1", style: { stroke: "#334155" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" } },
    { id: "e-frontend-task2", source: "frontend", target: "task2", style: { stroke: "#334155" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" } },
    { id: "e-backend-task3", source: "backend", target: "task3", style: { stroke: "#334155" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" } },
    { id: "e-backend-task4", source: "backend", target: "task4", style: { stroke: "#334155" }, markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" } },
    { id: "e-task1-today", source: "task1", target: "today", animated: true, style: { stroke: "#22c55e" } },
];

export function FlowSynergy() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="card h-[500px] relative">
            {/* Header */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Flow Synergy</h3>
                <span className="text-xs text-muted-foreground">思考の可視化</span>
            </div>

            {/* AI Suggestion */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                <Sparkles className="w-3 h-3 text-accent" />
                <span className="text-xs text-accent font-medium">AIが最短ルートを提案中</span>
            </div>

            {/* React Flow Canvas */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                proOptions={{ hideAttribution: true }}
                className="rounded-xl"
            >
                <Background color="#334155" gap={20} size={1} />
                <Controls className="!bg-card !border-border !rounded-lg" />
                <MiniMap
                    nodeColor={() => "#3ea8ff"}
                    maskColor="rgba(15, 23, 42, 0.8)"
                    className="!bg-card !border-border !rounded-lg"
                />
            </ReactFlow>
        </div>
    );
}
