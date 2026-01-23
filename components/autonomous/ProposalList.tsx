import { useQuery } from "@tanstack/react-query";
import { visionAPI, API_KEYS } from "@/lib/api";
import { ProposalCard } from "./ProposalCard";
import { Proposal } from "@/types/proposal";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function ProposalList() {
    const { data: proposals, isLoading } = useQuery({
        queryKey: API_KEYS.proposals,
        queryFn: () => visionAPI.fetchPendingProposals(),
        refetchInterval: 10000, // Auto-refresh every 10s
    });

    if (isLoading) return null; // Or skeleton

    // If no proposals, don't show anything (to avoid clutter)
    if (!proposals || proposals.length === 0) return null;

    return (
        <div className="w-full mb-6">
            <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary">
                <Sparkles size={16} className="text-yellow-500 fill-yellow-500" />
                <span>AI Proposals ({proposals.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                    {proposals.map((proposal: Proposal) => (
                        <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
