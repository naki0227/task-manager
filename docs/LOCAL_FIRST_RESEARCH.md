# Privacy-First / Local-First Architecture Research

## Objective
To enable **Complete Offline Support** and **Enhanced Privacy** by moving the primary data store to the client device (Browser/Desktop), synchronizing with the server only when needed (or for cross-device sync).

## 1. Requirement Analysis
### Data Model & Sync Needs
| Model | Sync Priority | Conflict Risk | Notes |
|-------|---------------|---------------|-------|
| `User` | Low | Low | Profile data rarely changes. |
| `Task` | **High** | Medium | Edited frequently (drag/drop, status). |
| `Skill` | Medium | Low | Computed by AI, mostly append-only. |
| `Snapshot` | Medium | Low | Large JSON blobs. |
| `FocusSession` | Medium | None | Append-only logs. |
| `OAuthToken` | **Zero** | N/A | Server-side only (Security). |

### Constraints
- **Stack**: Next.js (Frontend) + FastAPI (Backend) + SQLite/Postgres (DB).
- **Environment**: Must work locally (SQLite) and in Cloud (Postgres).

## 2. Technology Metrics

### Option A: RxDB (Recommended)
- **Architecture**: NoSQL (PouchDB/Lokijs) on Client. REST/GraphQL replication to Server.
- **Pros**: 
    - Mature ecosystem for React.
    - Flexible schema.
    - "Pull-based" replication works well with simple REST endpoints.
- **Cons**: 
    - Requires mapping SQL (Backend) to JSON Document (Frontend).
    - Conflict resolution must be manually handled in backend endpoints.

### Option B: ElectricSQL
- **Architecture**: Postgres -> Electric Sync Service -> Client SQLite (WASM).
- **Pros**: 
    - "SQL on the Client".
    - Active-Active replication handled automatically.
- **Cons**:
    - Requires running a separate "Electric Service" (Infrastructure complexity).
    - Might be overkill for a simple Task app.
    - Python backend integration is less documented than Node.

### Option C: Custom Optimistic UI + Queue (Current Status+)
- **Architecture**: React Query + LocalStorage persistence.
- **Pros**: Zero infrastructure change.
- **Cons**: Not true "Local-First". If offline for days, data drift is hard to mange. No real "Offline Mode" logic.

## 3. Proposal: "Hybrid Sync" with RxDB

We recommend **RxDB** for this project because it integrates cleanly with the existing REST/FastAPI architecture without requiring new infrastructure components (like the Electric Sync Service).

### Architecture Design
1.  **Frontend (Client)**:
    - Replace `React Query` usage for Tasks/Skills with `RxDB` hooks.
    - Data reads happen instantly from local `IndexedDB`.
    - Writes apply locally, then push to backend via replication plugin.
2.  **Backend (Server)**:
    - Create `/api/sync/{collection}` endpoints for checkpoint-based replication.
    - `POST /pull`: Get changes since `last_checkpoint`.
    - `POST /push`: Receive batch changes from client.
3.  **Privacy**:
    - A "Privacy Mode" toggle can disable the `push` replication entirely, effectively making the app Local-Only.

### Migration Steps
1.  **POC**: Implement RxDB for `Tasks` only.
2.  **Backend**: Add `updated_at` (already exists) and `deleted` (soft delete) flags to `Task` model.
3.  **Sync**: Implement the `pull` endpoint logic.

## 4. Work Estimates
- **Phase 1 (POC)**: 1-2 Days. Set up RxDB + Sync for Tasks.
- **Phase 2 (Full Migration)**: 3-4 Days. Migrate Skills/Snapshots.
- **Phase 3 (Privacy Controls)**: 1 Day. UI toggles for sync.
