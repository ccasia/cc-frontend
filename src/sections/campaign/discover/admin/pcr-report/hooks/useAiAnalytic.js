import { useMutation } from '@tanstack/react-query';
import { useRef, useEffect, useCallback } from 'react';

import axiosInstance from 'src/utils/axios';

/**
 * Hook to generate AI analytics for a specific campaign
 * @param {string} campaignId - Campaign ID
 
 */
const useAiAnalytic = (campaignId) => {
  const controllerRef = useRef(null);

  const mutation = useMutation({
    mutationKey: ['analytic', campaignId],
    /**
     *
     * @param {'campaign_summary' |'engagement_interactions' |'views_analysis' |'audience_sentiment' |'top_creator_personas' |'campaign_recommendations'} sections - Section name
     */
    mutationFn: async (sections) => {
      // eslint-disable-next-line no-nested-ternary
      const s1 = sections
        ? Array.isArray(sections)
          ? { sections }
          : { sections: [sections] }
        : {};

      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const res = await axiosInstance.post(`/api/reports/generate/${campaignId}`, s1, {
        signal: controller.signal,
      });

      return res.data;
    },
    onSettled: () => {
      controllerRef.current = null;
    },
  });

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { ...mutation, cancel };
};

export default useAiAnalytic;

/**
 * AI-generated analytics report for a campaign.
 * Each field is a paragraph of text that may contain Markdown bold (`**text**`).
 *
 * @typedef {Object} AiAnalyticReport
 * @property {string} campaign_summary - Overview of the campaign period, creator count, total views, shares, and engagement rate
 * @property {string} engagement_interactions - Analysis of engagement rates and top-performing creators by engagement
 * @property {string} views_analysis - Cumulative views, weekly view range, and peak week
 * @property {string} audience_sentiment - Positive / negative / neutral split and the main reasons behind it
 * @property {string} top_creator_personas - Standout creators with their views, likes, comments, and engagement rate
 * @property {string} campaign_recommendations - Suggestions for future campaigns based on the results
 */

// The AI returns Markdown bold (**text**), but every consumer downstream (FormattedTextField's
// contentEditable innerHTML, the read-only dangerouslySetInnerHTML render) expects real HTML —
// sanitizeReportHtml's allow-list is <strong>/<b>, not raw asterisks. Convert once, here, so
// every field coming out of this hook is already HTML.
const markdownBoldToHtml = (text) =>
  typeof text === 'string' ? text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') : text;

/**
 * Function to format data received from AI Analytics
 * @param {[]} data
 * @returns {Partial<AiAnalyticReport> | null}
 */
export const formatAnalyticData = (data) => {
  if (!data) return null;

  const formattedData = data.reduce((acc, cur) => {
    const key = cur.section;

    if (!acc[key]) {
      acc[key] = markdownBoldToHtml(cur.summary);
    }

    return acc;
  }, {});

  return formattedData;
};
