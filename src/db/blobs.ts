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

/**
 * Convert a Blob to a base64 data URL (used by world export).
 * Uses arrayBuffer() so it works both in the browser and under jsdom (whose
 * FileReader.readAsDataURL is unreliable).
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  // Some environments (e.g. fake-indexeddb under jsdom) return a Blob-like
  // without arrayBuffer(); normalize through Response in that case.
  const buffer =
    typeof blob.arrayBuffer === 'function' ? await blob.arrayBuffer() : await new Response(blob).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);
  return `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
}

/** Convert a base64 data URL back to a Blob (used by world import). */
export async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const match = /^data:([^;]*);base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error('data URL inválida');
  const type = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}
