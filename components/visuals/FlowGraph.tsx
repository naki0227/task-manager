"use client";

import { useCallback } from "react";
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
} from "reactflow";
import "reactflow/dist/style.css";

const initialNodes: Node[] = [
    {
        id: "1",
        position: { x: 0, y: 0 },
        data: { label: "Project: Vision" },
        style: { background: "#0f172a", border: "1px solid #00f3ff", color: "#fff", width: 180 }
    },
    {
        id: "2",
        position: { x: 0, y: 100 },
        data: { label: "Frontend" },
        style: { background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", width: 150 }
    },
    {
        id: "3",
        position: { x: 200, y: 100 },
        data: { label: "Backend" },
        style: { background: "#0f172a", border: "1px solid #1e293b", color: "#94a3b8", width: 150 }
    },
];

const initialEdges: Edge[] = [
    { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "#00f3ff" } },
    { id: "e1-3", source: "1", target: "3", animated: true, style: { stroke: "#00f3ff" } },
];

export function FlowGraph() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="h-[400px] w-full rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono text-primary">LOGIC_TRACE_ACTIVE</span>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Background color="#1e293b" gap={20} />
                <Controls className="bg-background border border-white/10 fill-white" />
                <MiniMap
                    nodeColor={() => '#00f3ff'}
                    maskColor="rgba(0,0,0, 0.7)"
                    className="bg-background border border-white/10"
                />
            </ReactFlow>
        </div>
    );
}
