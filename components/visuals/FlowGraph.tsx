"use client";

import { useCallback } from "react";
import ReactFlow, {
    Background,
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
        data: { label: "VISION" },
        style: {
            background: "#0044ff",
            border: "none",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontSize: "24px",
            width: 160,
            padding: "20px",
            borderRadius: "100px",
            textAlign: "center",
            boxShadow: "0 20px 40px -10px rgba(0, 68, 255, 0.4)"
        }
    },
    {
        id: "2",
        position: { x: -100, y: 140 },
        data: { label: "Frontend" },
        style: {
            background: "rgba(255,255,255,0.8)",
            border: "1px solid #fff",
            color: "#0044ff",
            fontWeight: "bold",
            width: 120,
            padding: "10px",
            borderRadius: "30px",
            textAlign: "center",
            backdropFilter: "blur(10px)"
        }
    },
    {
        id: "3",
        position: { x: 100, y: 140 },
        data: { label: "Backend" },
        style: {
            background: "rgba(255,255,255,0.8)",
            border: "1px solid #fff",
            color: "#0044ff",
            fontWeight: "bold",
            width: 120,
            padding: "10px",
            borderRadius: "30px",
            textAlign: "center",
            backdropFilter: "blur(10px)"
        }
    },
];

const initialEdges: Edge[] = [
    { id: "e1-2", source: "1", target: "2", style: { stroke: "#0044ff", strokeWidth: 2 } },
    { id: "e1-3", source: "1", target: "3", style: { stroke: "#0044ff", strokeWidth: 2 } },
];

export function FlowGraph() {
    const [nodes, , onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="h-full w-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#0044ff" gap={40} size={1} style={{ opacity: 0.05 }} />
            </ReactFlow>
        </div>
    );
}
