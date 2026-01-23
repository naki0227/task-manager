export interface Proposal {
    id: number;
    title: string;
    description: string;
    type: 'create_task' | 'email_reply' | 'advice' | string;
    payload: string; // JSON string
    status: 'pending' | 'approved' | 'rejected' | 'executed' | 'processing' | 'failed';
    created_at: string;
}
