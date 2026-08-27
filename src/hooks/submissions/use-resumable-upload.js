/* eslint-disable no-loop-func */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import axios from 'axios';

import axiosInstance from 'src/utils/axios';

const useResumableUpload = () => {
  const CHUNK_SIZE = 8 * 1024 * 1024; // must be a multiple of 256 * 1024

  // axios v1 gives AxiosHeaders (.get), older versions give a plain object
  const readRangeEnd = (headers) => {
    const raw = headers?.get?.('range') ?? headers?.range ?? null;
    if (!raw) return null;
    const end = parseInt(raw.split('-')[1], 10);
    return Number.isNaN(end) ? null : end;
  };

  // Ask GCS how far it actually got
  async function probeSession(uri, totalBytes) {
    const res = await axios.put(uri, null, {
      headers: { 'Content-Range': `bytes */${totalBytes}` },
      validateStatus: (s) => s === 308 || s === 404 || s === 410 || (s >= 200 && s < 300),
    });

    if (res.status === 404 || res.status === 410) return { state: 'gone' };
    if (res.status !== 308) return { state: 'complete' };

    const end = readRangeEnd(res.headers);
    return { state: 'partial', offset: end === null ? 0 : end + 1 };
  }

  async function uploadFrom({ uri, file, startAt, onProgress, signal }) {
    let offset = Number(startAt) || 0; // Number() guards the string bug
    let attempt = 0;

    while (offset < file.size) {
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const chunkStart = offset;
      const blob = file.slice(chunkStart, end);

      try {
        const res = await axios.put(uri, blob, {
          signal,
          headers: {
            'Content-Range': `bytes ${chunkStart}-${end - 1}/${file.size}`,
          },
          validateStatus: (s) => s === 308 || (s >= 200 && s < 300),
          onUploadProgress: (e) => onProgress(chunkStart + e.loaded),
        });

        attempt = 0;

        if (res.status !== 308) {
          onProgress(file.size);
          return;
        }

        const last = readRangeEnd(res.headers);
        offset = last === null ? end : last + 1;
        onProgress(offset);
      } catch (err) {
        if (axios.isCancel(err) || signal?.aborted) throw err;

        const status = err.response?.status;
        if (status === 404 || status === 410) throw new Error('SESSION_GONE');
        if (++attempt > 5) throw err;

        await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 16000)));

        // Re-sync before retrying — never trust our own counter after a failure
        const probe = await probeSession(uri, file.size);
        if (probe.state === 'gone') throw new Error('SESSION_GONE');
        if (probe.state === 'complete') {
          onProgress(file.size);
          return;
        }
        offset = probe.offset;
      }
    }
  }

  const isSameFile = (file, s) => Number(s.bytesTotal) === file.size && s.fileName === file.name;

  async function createSession(file, { campaignId, submissionId }) {
    const { data } = await axiosInstance.post('/api/upload-sessions/', {
      campaignId,
      submissionId,
      contentType: file.type,
      fileName: file.name,
      fileSize: file.size,
      lastModified: file.lastModified, // store this — needed to match on resume
    });

    const startRes = await fetch(data.signedUrl, {
      method: 'POST',
      headers: { 'x-goog-resumable': 'start', 'Content-Type': file.type },
    });
    if (!startRes.ok) throw new Error(`Session start failed: ${startRes.status}`);

    const sessionUri = startRes.headers.get('location');
    if (!sessionUri) throw new Error('No Location header — check bucket CORS');

    await axiosInstance.patch(`/api/upload-sessions/${data.uploadSessionId}/session-uri`, {
      sessionUri,
    });

    return { id: data.uploadSessionId, uri: sessionUri };
  }

  return {
    probeSession,
    uploadFrom,
    isSameFile,
    createSession,
  };
};

export default useResumableUpload;
