import { db } from './database';
import { newId } from './ids';
import type { BlobRecord } from './schema';

/** Store a Blob and return its generated id. */
export async function putBlob(data: Blob): Promise<string> {
  const record: BlobRecord = { id: newId(), type: data.type, data };
  await db.blobs.put(record);
  return record.id;
}

export async function getBlob(id: string): Promise<BlobRecord | undefined> {
  return db.blobs.get(id);
}

/** Resolve a blob id to an object URL (caller must revoke when done). */
export async function getBlobUrl(id: string | undefined): Promise<string | undefined> {
  if (!id) return undefined;
  const rec = await db.blobs.get(id);
  if (!rec) return undefined;
  return URL.createObjectURL(rec.data);
}

export async function deleteBlob(id: string): Promise<void> {
  await db.blobs.delete(id);
}

/** Convert a Blob to a base64 data URL (used by world export). */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Convert a base64 data URL back to a Blob (used by world import). */
export async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
