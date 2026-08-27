import { create } from 'zustand';
import { produce, enableArrayMethods } from 'immer';

enableArrayMethods();

export const useUploadingStatus = create(() => ({
  statusInfo: [],
}));

/**
 * Function to update upload status for each submission
 * @function
 * @param {object} data - The object data
 * @param {string} data.submissionId - The submission id
 * @param {string} data.sessionId - The upload session id
 * @param {string} data.status - The status
 *
 */
export const setStatus = (data) => {
  useUploadingStatus.setState(
    produce((draft) => {
      const existing = draft.statusInfo.find((d) => d?.submissionId === data.submissionId);

      if (existing) {
        existing.status = data.status;
      } else {
        draft.statusInfo.push(data);
      }
    })
  );
};
