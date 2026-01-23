import { createRxDatabase, RxDatabase, RxCollection, RxJsonSchema, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { v4 as uuidv4 } from 'uuid';

// Enable dev mode if needed for debugging (check node_env)
// import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
// addRxPlugin(RxDBDevModePlugin);

// Schema for Tasks
const taskSchema: RxJsonSchema<any> = {
    title: 'task schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        title: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        status: {
            type: 'string'
        },
        source: {
            type: 'string'
        },
        estimated_time: {
            type: 'string'
        },
        prepared_items: {
            type: 'string' // JSON string
        },
        position: {
            type: 'number'
        },
        deleted: {
            type: 'boolean'
        },
        updated_at: {
            type: 'string'
        }
    },
    required: ['id', 'title', 'updated_at']
};

export type TaskDocType = {
    id: string;
    title: string;
    description: string;
    status: string;
    source: string;
    estimated_time: string;
    prepared_items: string; // JSON string
    position: number;
    deleted: boolean;
    updated_at: string;
    created_at: string; // Added created_at
};

export type RxTaskCollection = RxCollection<TaskDocType>;
export type RxMyDatabase = RxDatabase<{ tasks: RxTaskCollection }>;

let dbPromise: Promise<RxMyDatabase> | null = null;

export const initDB = async (): Promise<RxMyDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        console.log("Initializing RxDB...");

        const db = await createRxDatabase<RxMyDatabase>({
            name: 'dreamcatcher_db',
            storage: getRxStorageDexie(),
            ignoreDuplicate: true // For hot reload
        });

        await db.addCollections({
            tasks: {
                schema: taskSchema
            }
        });

        console.log("RxDB Initialized. Starting Replication...");
        setupReplication(db.tasks);

        return db;
    })();

    return dbPromise;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function setupReplication(collection: RxTaskCollection) {
    const replicationState = replicateRxCollection({
        collection,
        replicationIdentifier: 'task-sync-v1',
        pull: {
            async handler(lastCheckpoint, batchSize) {
                const minUpdatedAt = lastCheckpoint ? (lastCheckpoint as any).updated_at : null;
                const url = new URL(`${API_URL}/api/sync/tasks`);
                if (minUpdatedAt) url.searchParams.set('min_updated_at', minUpdatedAt);
                url.searchParams.set('limit', batchSize.toString());

                const token = localStorage.getItem('vision-token');
                const response = await fetch(url.toString(), {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                const data = await response.json();

                return {
                    documents: data.documents,
                    checkpoint: data.checkpoint
                };
            }
        },
        push: {
            async handler(docs) {
                const token = localStorage.getItem('vision-token');
                const response = await fetch(`${API_URL}/api/sync/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(docs)
                });
                // Assuming success means no conflicts for POC
                return [];
            }
        }
    });

    replicationState.error$.subscribe(err => {
        console.error('Replication error:', err);
    });
}
