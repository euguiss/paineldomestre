import { useEffect, useState } from 'react';
import { getBlob } from './blobs';

/** Resolve a blob id to an object URL, revoking it on cleanup. */
export function useBlobUrl(blobId: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let revoked = false;
    let current: string | undefined;
    if (!blobId) {
      setUrl(undefined);
      return;
    }
    getBlob(blobId).then((rec) => {
      if (!rec || revoked) return;
      current = URL.createObjectURL(rec.data);
      setUrl(current);
    });
    return () => {
      revoked = true;
      if (current) URL.revokeObjectURL(current);
    };
  }, [blobId]);

  return url;
}
