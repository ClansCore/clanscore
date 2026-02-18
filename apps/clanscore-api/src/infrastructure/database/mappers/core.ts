import mongoose from "mongoose";

export const toId = (x: unknown): string =>
    typeof x === "string" ? x : String((x as { _id?: unknown })._id);

// export const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : undefined);
// export const isoNull = (d?: Date | null) => (d ? new Date(d).toISOString() : null);

export const asObjectId = (v: string | mongoose.Types.ObjectId) =>
    typeof v === "string" ? new mongoose.Types.ObjectId(v) : v;
