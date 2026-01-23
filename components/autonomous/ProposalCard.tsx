import { Proposal } from "@/types/proposal";
import { visionAPI, API_KEYS } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Clock, Zap, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

interface ProposalCardProps {
    proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const approveMutation = useMutation({
        mutationFn: async () => await visionAPI.approveProposal(proposal.id),
        onSuccess: () => {
            showToast("success", "Proposal Approved");
            queryClient.invalidateQueries({ queryKey: API_KEYS.proposals });
        },
        onError: () => {
            showToast("error", "Failed to approve proposal.");
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async () => await visionAPI.rejectProposal(proposal.id),
        onSuccess: () => {
            showToast("info", "Proposal Rejected");
            queryClient.invalidateQueries({ queryKey: API_KEYS.proposals });
        }
    });

    // If status is "processing" (from polling), show loader
    if (proposal.status === 'processing') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border rounded-lg p-4 shadow-sm flex flex-col items-center justify-center min-h-[150px] gap-3"
            >
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Executing Action...</span>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border rounded-lg p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />

            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${proposal.type === 'create_task' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        <Zap size={16} />
                    </div>
                    <div>
                        <h3 className="font-medium text-sm">{proposal.title}</h3>
                        <p className="text-xs text-muted-foreground">{proposal.description}</p>
                    </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(proposal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {/* Payload Preview (Optional) */}
            {proposal.type === 'create_task' && (
                <div className="bg-muted/50 p-2 rounded text-xs font-mono text-muted-foreground">
                    {proposal.payload}
                </div>
            )}
            {proposal.type === 'email_reply' && (() => {
                try {
                    const payload = JSON.parse(proposal.payload);
                    return (
                        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground space-y-1">
                            <div className="font-semibold">To: {payload.to}</div>
                            <div>Subject: {payload.subject}</div>
                            <div className="italic border-l-2 pl-1 border-primary/20 mt-1 line-clamp-3">{payload.body}</div>
                        </div>
                    );
                } catch { return null }
            })()}
            {proposal.type === 'slack_message' && (() => {
                try {
                    const payload = JSON.parse(proposal.payload);
                    return (
                        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground space-y-1">
                            <div className="font-semibold">Channel: {payload.channel_id}</div>
                            <div className="italic border-l-2 pl-1 border-primary/20 mt-1 line-clamp-3">{payload.text}</div>
                        </div>
                    );
                } catch { return null }
            })()}

            <div className="flex gap-2 justify-end mt-2">
                <button
                    className="flex items-center px-3 py-1.5 rounded-md text-xs border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                    <X size={14} className="mr-1" />
                    Reject
                </button>
                <button
                    className="flex items-center px-3 py-1.5 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    onClick={() => approveMutation.mutate()}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                >
                    <Check size={14} className="mr-1" />
                    Approve
                </button>
            </div>
        </motion.div>
    );
}
