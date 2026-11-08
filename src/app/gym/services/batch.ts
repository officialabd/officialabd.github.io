import { writeBatch, type DocumentReference } from "firebase/firestore";
import { db } from "../../../../firebase";

/** Firestore allows 500 writes per batch; stay well below. */
const BATCH_LIMIT = 400;

export type WriteOp =
    | { kind: "set"; ref: DocumentReference; data: Record<string, unknown> }
    | { kind: "delete"; ref: DocumentReference };

/** Commit writes in order, in as many batches as needed. */
export async function commitInBatches(ops: WriteOp[]): Promise<void> {
    for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        ops.slice(i, i + BATCH_LIMIT).forEach((op) => (op.kind === "set" ? batch.set(op.ref, op.data) : batch.delete(op.ref)));
        await batch.commit();
    }
}
