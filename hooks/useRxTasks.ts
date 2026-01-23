import { useState, useEffect } from 'react';
import { initDB, RxTaskCollection, TaskDocType } from '@/lib/rxdb';
import { Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export type RxTask = TaskDocType & {
    // Helper accessors if needed
};

export function useRxTasks() {
    const [tasks, setTasks] = useState<RxTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState<RxTaskCollection | null>(null);

    useEffect(() => {
        let sub: Subscription | null = null;

        const init = async () => {
            try {
                const db = await initDB();
                setCollection(db.tasks);

                // Initial Query: Not deleted, sorted by position
                const query = db.tasks.find({
                    selector: {
                        deleted: { $eq: false }
                    },
                    sort: [{ position: 'asc' }]
                });

                sub = query.$.subscribe(docs => {
                    setTasks(docs.map(d => d.toJSON()) as RxTask[]);
                    setLoading(false);
                });
            } catch (err) {
                console.error("RxDB Init Error:", err);
                setLoading(false);
            }
        };

        init();

        return () => {
            sub?.unsubscribe();
        };
    }, []);

    // Actions
    const addTask = async (title: string, description: string = "", source: string = "manual") => {
        if (!collection) return;
        const now = new Date().toISOString();
        await collection.insert({
            id: uuidv4(), // Client-side ID
            title,
            description,
            status: "ready",
            source,
            estimated_time: "15m",
            prepared_items: "[]",
            position: tasks.length,
            deleted: false,
            updated_at: now,
            created_at: now
        });
    };

    const updateTask = async (id: string, data: Partial<RxTask>) => {
        if (!collection) return;
        const doc = await collection.findOne(id).exec();
        if (doc) {
            await doc.patch({
                ...data,
                updated_at: new Date().toISOString()
            });
        }
    };

    const startTask = async (id: string | number) => {
        // Handle ID string/number mismatch. Hook expects string, but existing code uses number.
        // For POC, we assume ID is string (RxDB).
        // If we fetch from backend, IDs are numbers (1, 2, 3...). 
        // RxDB schema says ID is string.
        // Backend sync logic sends `str(t.id)`. So IDs are strings "1", "2".
        await updateTask(String(id), { status: "in-progress" });
    };

    const completeTask = async (id: string | number) => {
        await updateTask(String(id), { status: "completed" });
    };

    const deleteTask = async (id: string | number) => {
        // Soft delete
        await updateTask(String(id), { deleted: true });
    };

    const reorderTasks = async (newOrder: RxTask[]) => {
        if (!collection) return;
        // Batch update positions
        // This can be heavy if many tasks. DND-kit gives new array.
        // We update the 'position' field for all affected tasks.

        // Optimistic UI handled by RxDB subscription update?
        // Yes, but we need to write to DB.

        // Simple approach: Iterate and update.
        // Better: atomicUpdate if possible, or Promise.all
        const now = new Date().toISOString();
        const promises = newOrder.map((task, index) => {
            if (task.position !== index) {
                return collection.findOne(task.id).exec().then(doc => {
                    if (doc) return doc.patch({ position: index, updated_at: now });
                });
            }
            return Promise.resolve();
        });
        await Promise.all(promises);
    };

    return {
        tasks,
        loading,
        addTask,
        updateTask,
        startTask,
        completeTask,
        deleteTask,
        reorderTasks
    };
}
