import { useMutation } from '@tanstack/react-query';

import axiosInstance from 'src/utils/axios';

import { snapFields } from './use-snapped-fields';

export const getSaveSignature = (items, resultsById) =>
  items.map((item) => `${item.id}:${resultsById[item.id]?.dataUpdatedAt ?? 0}`).join('|');

const buildRequest = async (items, resultsById, combined) => {
  const done = items.filter((item) => resultsById[item.id]?.isSuccess);
  const formData = new FormData();
  done.forEach((item) => formData.append('screenshots', item.file));

  const screenshots = await Promise.all(
    done.map(async (item) => {
      const { fields, screen, usage, durationMs } = resultsById[item.id].data;
      return { fileName: item.file.name, screen, usage, durationMs, fields: await snapFields(item.url, fields) };
    })
  );
  const values = Object.fromEntries(combined.map((field) => [field.key, field.number ?? field.value]));
  const conflicts = combined.filter((field) => field.conflict).length;

  formData.append('payload', JSON.stringify({ screenshots, values, conflicts }));
  return formData;
};

export function useSaveInsightOcr() {
  return useMutation({
    mutationFn: async ({ items, resultsById, combined }) => {
      const formData = await buildRequest(items, resultsById, combined);
      const res = await axiosInstance.post('/api/ai/insight-ocr/results', formData);
      return res.data;
    },
  });
}
