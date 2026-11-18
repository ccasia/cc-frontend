import { useQueries } from '@tanstack/react-query';

import axiosInstance from 'src/utils/axios';

const extractScreenshot = async (file) => {
  const formData = new FormData();
  formData.append('screenshots', file);
  const res = await axiosInstance.post('/api/ai/insight-ocr', formData);
  const [image] = res.data.images;
  if (image.error) throw new Error(image.error);
  return image;
};

export function useInsightExtractions(items) {
  const results = useQueries({
    queries: items.map((item) => ({
      queryKey: ['insight-ocr', item.id],
      queryFn: () => extractScreenshot(item.file),
      staleTime: Infinity,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  return Object.fromEntries(items.map((item, index) => [item.id, results[index]]));
}
