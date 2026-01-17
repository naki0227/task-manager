"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
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
import { Brain, Sparkles, Loader2 } from "lucide-react";
import { DreamStep } from "@/lib/api";
import { useDream } from "@/contexts/DreamContext";

// Color palette for steps
const STEP_COLORS = [
    { bg: "#22c55e20", border: "#22c55e", text: "#22c55e" },
    { bg: "#f59e0b20", border: "#f59e0b", text: "#f59e0b" },
    { bg: "#8b5cf620", border: "#8b5cf6", text: "#8b5cf6" },
    { bg: "#ec489920", border: "#ec4899", text: "#ec4899" },
    { bg: "#3ea8ff20", border: "#3ea8ff", text: "#3ea8ff" },
    { bg: "#14b8a620", border: "#14b8a6", text: "#14b8a6" },
    { bg: "#f4364420", border: "#f43644", text: "#f43644" },
];

const DURATION_OPTIONS = [
    { value: "1ヶ月", label: "1ヶ月" },
    { value: "3ヶ月", label: "3ヶ月" },
    { value: "6ヶ月", label: "6ヶ月" },
    { value: "1年", label: "1年" },
    { value: "2年", label: "2年" },
];

interface FlowSynergyProps {
    showInput?: boolean;
}

export function FlowSynergy({ showInput = true }: FlowSynergyProps) {
    const {
        dream,
        setDream,
        targetDuration,
        setTargetDuration,
        steps,
        isAnalyzing,
        analyzeDream,
        updateStepStatus
    } = useDream();

    const [selectedStep, setSelectedStep] = useState<DreamStep | null>(null);

    // Generate nodes and edges from steps
    const { generatedNodes, generatedEdges } = useMemo(() => {
        if (!dream && steps.length === 0) {
            return { generatedNodes: [], generatedEdges: [] };
        }

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        // Dream/Goal node at top
        if (dream) {
            nodes.push({
                id: "dream",
                type: "input",
                position: { x: 300, y: 0 },
                data: { label: `🎯 ${dream}` },
                style: {
                    background: "linear-gradient(135deg, #3ea8ff, #60c5ff)",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    boxShadow: "0 10px 30px rgba(62, 168, 255, 0.3)",
                    maxWidth: "300px",
                    textAlign: "center",
                },
            });
        }

        // Step nodes
        const stepSpacing = 180;
        const startX = Math.max(0, 300 - ((steps.length - 1) * stepSpacing) / 2);

        steps.forEach((step, index) => {
            const color = STEP_COLORS[index % STEP_COLORS.length];
            const x = startX + index * stepSpacing;
            const y = 120;

            // Adjust color based on status
            const statusColor = step.status === "completed"
                ? { bg: "#22c55e30", border: "#22c55e", text: "#22c55e" }
                : step.status === "active"
                    ? { bg: "#3ea8ff30", border: "#3ea8ff", text: "#3ea8ff" }
                    : color;

            nodes.push({
                id: `step-${step.id}`,
                position: { x, y },
                data: {
                    label: `${step.status === "completed" ? "✓ " : ""}${index + 1}. ${step.title}`,
                    step: step,
                },
                style: {
                    background: statusColor.bg,
                    border: `2px solid ${statusColor.border}`,
                    color: statusColor.text,
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: "500",
                    cursor: "pointer",
                    maxWidth: "160px",
                    textAlign: "center",
                },
            });

            // Edge from dream to step
            if (dream) {
                const isActive = step.status === "active";
                const isCompleted = step.status === "completed";
                edges.push({
                    id: `e-dream-step-${step.id}`,
                    source: "dream",
                    target: `step-${step.id}`,
                    animated: isActive,
                    style: {
                        stroke: isCompleted ? "#22c55e" : isActive ? "#3ea8ff" : "#334155",
                        strokeWidth: isActive ? 2 : 1,
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: isCompleted ? "#22c55e" : isActive ? "#3ea8ff" : "#334155"
                    },
                });
            }

            // Sub-task nodes (only for first 2 steps to avoid clutter)
            if (step.subTasks && step.subTasks.length > 0 && index < 2) {
                const subTaskY = y + 100;
                step.subTasks.slice(0, 3).forEach((subTask, subIndex) => {
                    const subX = x - 60 + subIndex * 80;
                    const subId = `subtask-${step.id}-${subIndex}`;

                    nodes.push({
                        id: subId,
                        position: { x: subX, y: subTaskY + subIndex * 30 },
                        data: { label: subTask.week },
                        style: {
                            background: "#1e293b",
                            border: "1px solid #334155",
                            color: "#94a3b8",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            fontSize: "9px",
                        },
                    });

                    edges.push({
                        id: `e-step-${step.id}-subtask-${subIndex}`,
                        source: `step-${step.id}`,
                        target: subId,
                        style: { stroke: "#334155", strokeDasharray: "4 2" },
                    });
                });
            }
        });

        // "Today" node - first active step
        const activeStep = steps.find(s => s.status === "active");
        if (activeStep) {
            const todayY = steps.some(s => s.subTasks && s.subTasks.length > 0) ? 350 : 250;
            nodes.push({
                id: "today",
                type: "output",
                position: { x: 250, y: todayY },
                data: { label: `✨ 次にやること: ${activeStep.title}` },
                style: {
                    background: "linear-gradient(135deg, #22c55e, #10b981)",
                    border: "none",
                    color: "#fff",
                    fontWeight: "bold",
                    padding: "12px 20px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 10px 30px rgba(34, 197, 94, 0.3)",
                    maxWidth: "280px",
                    textAlign: "center",
                },
            });

            edges.push({
                id: "e-step-today",
                source: `step-${activeStep.id}`,
                target: "today",
                animated: true,
                style: { stroke: "#22c55e" },
            });
        }

        // Progress indicator
        const completedCount = steps.filter(s => s.status === "completed").length;
        if (steps.length > 0) {
            nodes.push({
                id: "progress",
                position: { x: 550, y: 0 },
                data: { label: `📊 ${completedCount}/${steps.length} 完了` },
                style: {
                    background: "#1e293b",
                    border: "1px solid #334155",
                    color: "#94a3b8",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "11px",
                },
            });
        }

        return { generatedNodes: nodes, generatedEdges: edges };
    }, [dream, steps]);

    const [nodes, setNodes, onNodesChange] = useNodesState(generatedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(generatedEdges);

    // Update nodes/edges when data changes
    useEffect(() => {
        setNodes(generatedNodes);
        setEdges(generatedEdges);
    }, [generatedNodes, generatedEdges, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const handleAnalyze = async () => {
        if (!dream.trim()) return;
        await analyzeDream();
    };

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (node.data?.step) {
            setSelectedStep(node.data.step);
        }
    }, []);

    const handleStepComplete = (stepId: number) => {
        updateStepStatus(stepId, "completed");
        // Activate next pending step
        const currentIndex = steps.findIndex(s => s.id === stepId);
        if (currentIndex < steps.length - 1) {
            updateStepStatus(steps[currentIndex + 1].id, "active");
        }
        setSelectedStep(null);
    };

    return (
        <div className="card h-[500px] relative">
            {/* Header */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Flow Synergy</h3>
                <span className="text-xs text-muted-foreground">思考の可視化</span>
            </div>

            {/* Input (if enabled) */}
            {showInput && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <input
                        type="text"
                        value={dream}
                        onChange={(e) => setDream(e.target.value)}
                        placeholder="目標を入力..."
                        className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm w-40"
                    />
                    <select
                        value={targetDuration}
                        onChange={(e) => setTargetDuration(e.target.value)}
                        className="px-2 py-1.5 bg-muted border border-border rounded-lg text-sm"
                    >
                        {DURATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !dream.trim()}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        分析
                    </button>
                </div>
            )}

            {/* React Flow Canvas */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
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

            {/* Selected Step Detail */}
            {selectedStep && (
                <div className="absolute bottom-4 left-4 right-4 z-10 p-4 bg-card/95 backdrop-blur border border-border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm">{selectedStep.title}</h4>
                        <div className="flex items-center gap-2">
                            {selectedStep.status !== "completed" && (
                                <button
                                    onClick={() => handleStepComplete(selectedStep.id)}
                                    className="text-xs px-2 py-1 bg-accent text-white rounded hover:opacity-90"
                                >
                                    完了にする
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedStep(null)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    {selectedStep.description && (
                        <p className="text-xs text-muted-foreground mb-2">{selectedStep.description}</p>
                    )}
                    {selectedStep.subTasks && selectedStep.subTasks.length > 0 && (
                        <div className="space-y-1">
                            {selectedStep.subTasks.slice(0, 3).map((st, i) => (
                                <div key={i} className="text-xs flex gap-2">
                                    <span className="text-primary font-medium">{st.week}:</span>
                                    <span className="text-muted-foreground">{st.task.slice(0, 60)}...</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {nodes.length === 0 && !isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>目標を入力して「分析」をクリック</p>
                    </div>
                </div>
            )}
        </div>
    );
}
