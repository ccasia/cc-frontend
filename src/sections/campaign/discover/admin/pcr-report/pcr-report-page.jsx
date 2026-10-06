import useSWR from 'swr';
import axios from 'axios';
// eslint-disable-next-line new-cap
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useShallow } from 'zustand/react/shallow';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import {
  useSensor,
  DndContext,
  useSensors,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { alpha } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import {
  Box,
  Grid,
  Link,
  Button,
  Avatar,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { useSocialInsights } from 'src/hooks/use-social-insights';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';
import { usePostEngagementSnapshots } from 'src/hooks/use-post-engagement-snapshots';

import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import {
  formatNumber,
  getMetricValue,
  calculateSummaryStats,
  calculateEngagementRate,
} from 'src/utils/socialMetricsCalculator';

import { useAuthContext } from 'src/auth/hooks';
import { HEADER } from 'src/layouts/config-layout';

import Iconify from 'src/components/iconify';

import useAiAnalytic, {
  formatAnalyticData,
  markdownBoldToHtml,
} from 'src/sections/campaign/discover/admin/pcr-report/hooks/useAiAnalytic';

import Error from './components/Error';
import Overlay from './components/Overlay';
import usePcrData from './hooks/usePcrData';
import usePcrExport from './hooks/usePcrExport';
import usePcrHistory from './hooks/usePcrHistory';

import SectionHeader from './components/SectionHeader';
import PersonaCardEdit from './charts/StrategiesCardEdit';
import SortableSection from './components/SortableSection';
import TopEngagementCard from './charts/TopEngagementCard';
import ReportReviewModal from './dialog/ReportReviewModal';
import PersonaCardDisplay from './charts/StrategiesDisplay';
import AddSectionButtons from './components/AddSectionButtons';
import CustomEmojiPicker from './components/CustomEmojiPicker';
import TopCreatorViewsChart from './charts/TopCreatorViewsChart';
import { sanitizeReportHtml } from './utils/sanitize-report-html';
import EngagementRateHeatmap from './charts/EngagementRateHeatmap';
import TopCreatorViews48HChart from './charts/TopCreatorViews48HChart';
import CreatorStrategyChartEdit from './charts/CreatorStrategyChartEdit';
import PlatformInteractionsChart from './charts/PlatformInteractionsChart';
import EditableDescriptionField from './components/EditableDescriptionField';
import usePcrAutosave, { getPcrEditorSessionId } from './hooks/usePcrAutosave';
import CreatorStrategyChartDisplay from './charts/CreatorStrategyChartDisplay';
import {
  DEFAULT_SECTION_ORDER,
  DEFAULT_EDITABLE_CONTENT,
  DEFAULT_SECTION_VISIBILITY,
} from './utils/constants';
import {
  usePcrStore,
  setCampaignId,
  setIsEditMode,
  setShowThirdCard,
  setShowFifthCard,
  setShowFourthCard,
  setShowEducatorCard,
} from './store/usePcrStore';
import { useAiPrompt } from './store/useAiPrompt';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from 'src/utils/axios';
import socket from 'src/hooks/socket';

const getImprovedInsightBgColor = (index) => {
  if (index === 0) return '#1340FFD9';
  if (index === 1) return '#1340FFBF';
  return '#1340FFA6';
};

const MotionBox = m(Box);

const getWorkedWellInsightBgColor = (index) => {
  if (index === 0) return 'linear-gradient(0deg, #8A5AFE, #8A5AFE)';
  if (index === 1) return 'linear-gradient(0deg, #8A5AFE, #8A5AFE)';
  return 'linear-gradient(0deg, #8A5AFE, #8A5AFE)';
};

const getWorkedWellOpacity = (index) => {
  if (index === 0) return 0.85;
  if (index === 1) return 0.75;
  return 0.65;
};

// Utility function to handle paste events and strip formatting
const handlePlainTextPaste = (e) => {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');

  // For contentEditable elements
  if (e.target.contentEditable === 'true') {
    document.execCommand('insertText', false, text);
  } else {
    // For regular input/textarea elements
    const { target } = e;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const { value } = target;

    // Insert plain text at cursor position
    const newValue = value.substring(0, start) + text + value.substring(end);
    target.value = newValue;

    // Set cursor position after pasted text
    const newCursorPos = start + text.length;
    target.setSelectionRange(newCursorPos, newCursorPos);

    // Trigger change event
    const event = new Event('input', { bubbles: true });
    target.dispatchEvent(event);
  }
};

// Resolve tier for PCR Creator Tiers table (matches agreements / pitches fallback chain)
const getTierForShortlisted = (shortlisted, campaign) => {
  if (!shortlisted) return null;

  if (shortlisted.creditTier) {
    return shortlisted.creditTier;
  }

  if (shortlisted.user?.creator?.creditTier) {
    return shortlisted.user.creator.creditTier;
  }

  const pitch = campaign?.pitch?.find((p) => p.userId === shortlisted.userId);
  if (pitch?.user?.creator?.creditTier) {
    return pitch.user.creator.creditTier;
  }

  return null;
};

const PCRReportPage = ({ campaign, onBack, isClientView = false, onCampaignUpdate }) => {
  const { user } = useAuthContext();

  const isEditMode = usePcrStore((state) => state.isEditMode);

  const promptValue = useAiPrompt((state) => state.prompt);

  const { showEducatorCard, showFifthCard, showFourthCard, showThirdCard } = usePcrStore(
    useShallow((state) => ({
      showEducatorCard: state.showEducatorCard,
      showFifthCard: state.showFifthCard,
      showFourthCard: state.showFourthCard,
      showThirdCard: state.showThirdCard,
    }))
  );

  // Helper function to format campaign period (matching campaign detail view format)
  const formatCampaignPeriod = () => {
    const startDate = campaign?.startDate || campaign?.campaignBrief?.startDate;
    const endDate = campaign?.endDate || campaign?.campaignBrief?.endDate;

    if (!startDate || !endDate) {
      return 'CAMPAIGN PERIOD NOT SET';
    }

    const formatDate = (dateString) => {
      if (!dateString) return '';
      return format(new Date(dateString), 'MMMM d, yyyy');
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Edit mode state
  // const [isEditMode, setIsEditMode] = useState(false);
  // const [isEditMode, setIsEditMode] = useState({ type: '', state: false });
  const shouldReduceMotion = useReducedMotion();

  // Bumped once when an autosave draft is restored. It feeds the `key` of every
  // FormattedTextField, forcing a remount so the restored text actually paints:
  // that component is an uncontrolled contentEditable that seeds innerHTML only
  // on its first render (see the isInitialized latch above).
  const [hydrationVersion, setHydrationVersion] = useState(0);
  const bumpHydrationVersion = useCallback(() => setHydrationVersion((v) => v + 1), []);

  // When client view, always show read-only (no editing)
  const effectiveEditMode = isClientView ? false : isEditMode.state;

  // Individual section edit states
  const [sectionEditStates, setSectionEditStates] = useState({
    campaignDescription: false,
    engagement: false,
    platformBreakdown: false,
    views: false,
    audienceSentiment: false,
    creatorTiers: false,
    strategies: false,
    recommendations: false,
  });

  // Section visibility states (which sections are shown)
  const [sectionVisibility, setSectionVisibility] = useState(DEFAULT_SECTION_VISIBILITY);

  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTION_ORDER);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSectionOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const [editableContent, setEditableContent] = useState(DEFAULT_EDITABLE_CONTENT);

  // Emoji picker state
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [emojiPickerType, setEmojiPickerType] = useState(null);

  const reportRef = useRef(null);
  const toolbarSentinelRef = useRef(null);
  const creatorTiersEditorRef = useRef(null);

  const [isToolbarFloating, setIsToolbarFloating] = useState(false);
  const [floatingToolbarBounds, setFloatingToolbarBounds] = useState(null);
  const [autosaveConflict, setAutosaveConflict] = useState(null);

  const updateFloatingToolbarBounds = useCallback(() => {
    const sentinel = toolbarSentinelRef.current;
    const scrollContainer = sentinel?.closest('main');
    const appBar = scrollContainer?.parentElement?.querySelector('.MuiAppBar-root');

    if (!scrollContainer) return;

    const mainRect = scrollContainer.getBoundingClientRect();
    const appBarRect = appBar?.getBoundingClientRect();
    setFloatingToolbarBounds({
      left: mainRect.left,
      width: mainRect.width,
      top: appBarRect?.bottom || HEADER.H_MOBILE,
    });
  }, []);

  // Main is the dashboard scroll container. Observe a sentinel in that
  // container instead of window scroll so the compact toolbar starts only
  // after the original toolbar passes beneath the global AppBar.
  useEffect(() => {
    const sentinel = toolbarSentinelRef.current;
    const scrollContainer = sentinel?.closest('main');

    if (!sentinel || !scrollContainer || typeof IntersectionObserver === 'undefined')
      return undefined;

    updateFloatingToolbarBounds();
    const headerOffset = window.matchMedia('(min-width: 1200px)').matches
      ? HEADER.H_DESKTOP
      : HEADER.H_MOBILE;
    const observer = new IntersectionObserver(
      ([entry]) => setIsToolbarFloating(!entry.isIntersecting),
      {
        root: scrollContainer,
        rootMargin: `-${headerOffset}px 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    const resizeObserver = new ResizeObserver(updateFloatingToolbarBounds);
    resizeObserver.observe(scrollContainer);
    if (scrollContainer.parentElement) resizeObserver.observe(scrollContainer.parentElement);
    window.addEventListener('resize', updateFloatingToolbarBounds);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateFloatingToolbarBounds);
    };
  }, [updateFloatingToolbarBounds]);

  const submissions = useMemo(() => campaign?.submission || [], [campaign?.submission]);
  const postingSubmissions = useMemo(() => extractPostingSubmissions(submissions), [submissions]);
  const campaignId = campaign?.id;
  const userId = user?.id;
  const editorSessionId = useMemo(
    () => getPcrEditorSessionId(userId, campaignId),
    [campaignId, userId]
  );

  // Fetch manual creator entries
  const { data: manualEntriesData } = useSWR(
    campaignId ? `/api/campaign/${campaignId}/manual-creators` : null,
    async (url) => {
      const response = await axios.get(url);
      return response.data;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const manualEntries = useMemo(() => {
    const entries = manualEntriesData?.data || [];
    return entries;
  }, [manualEntriesData]);

  const {
    data: insightsData,
    isLoading: loadingInsights,
    error: insightsError,
    failedUrls: missingInsightSnapshots,
  } = useSocialInsights(postingSubmissions, campaignId);

  // Fetch post engagement snapshots (Day 7, 15, 30 ER tracking)
  const { snapshots: postSnapshots } = usePostEngagementSnapshots(campaignId);

  const manualInsightsData = useMemo(() => {
    const transformed = manualEntries.map((entry) => ({
      id: entry.id,
      submissionId: entry.id,
      platform: entry.platform,
      insight: [
        { name: 'views', value: entry.views || 0 },
        { name: 'likes', value: entry.likes || 0 },
        { name: 'shares', value: entry.shares || 0 },
        { name: 'saved', value: entry.saved || 0 },
        { name: 'comments', value: entry.comments || 0 },
        { name: 'reach', value: 0 },
        { name: 'engagementRate', value: entry.engagementRate || 0 },
      ],
    }));
    return transformed;
  }, [manualEntries]);

  const manualSubmissions = useMemo(() => {
    const transformed = manualEntries.map((entry) => ({
      id: entry.id,
      platform: entry.platform,
      postingLink: entry.postUrl || null,
      user: {
        id: entry.id,
        name: entry.creatorName,
        creator: {
          instagram: entry.platform === 'Instagram' ? entry.creatorUsername : null,
          tiktok: entry.platform === 'TikTok' ? entry.creatorUsername : null,
        },
      },
      insightData: {
        insight: [
          { name: 'views', value: entry.views || 0 },
          { name: 'likes', value: entry.likes || 0 },
          { name: 'shares', value: entry.shares || 0 },
          { name: 'saved', value: entry.saved || 0 },
          { name: 'comments', value: entry.comments || 0 },
          { name: 'reach', value: 0 },
          { name: 'engagementRate', value: entry.engagementRate || 0 },
        ],
      },
      engagementRate: entry.engagementRate || 0,
    }));
    return transformed;
  }, [manualEntries]);

  const filteredInsightsData = useMemo(() => {
    const combined = [...(insightsData || []), ...manualInsightsData];
    return combined;
  }, [insightsData, manualInsightsData]);

  const filteredSubmissions = useMemo(() => {
    const regularSubmissions = postingSubmissions.filter((sub) => sub && sub.platform);
    const combined = [...regularSubmissions, ...manualSubmissions];
    return combined;
  }, [postingSubmissions, manualSubmissions]);

  const uniqueCreatorsCount = useMemo(() => {
    const uniqueCreatorIds = new Set();

    const allSubmissions = campaign?.submission || [];

    const approvedAgreements = allSubmissions.filter((sub) => {
      const isAgreement = sub.submissionType?.type === 'AGREEMENT_FORM';
      const isApproved = sub.status === 'APPROVED';
      return isAgreement && isApproved;
    });

    approvedAgreements.forEach((sub) => {
      const agreementUserId =
        sub.userId || sub.creatorId || (typeof sub.user === 'string' ? sub.user : sub.user?.id);

      if (agreementUserId) {
        uniqueCreatorIds.add(agreementUserId);
      }
    });

    return uniqueCreatorIds.size;
  }, [campaign?.submission]);

  const summaryStats = useMemo(() => {
    if (filteredInsightsData.length === 0) {
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalSaved: 0,
        totalReach: 0,
        totalPosts: 0,
        avgEngagementRate: 0,
      };
    }

    const stats = calculateSummaryStats(filteredInsightsData);
    return stats;
  }, [filteredInsightsData]);

  const {
    isExportingPDF,
    isPreviewOpen,
    setIsPreviewOpen,
    previewImages,
    setIsPreviewCached,
    handleGeneratePreview,
    handleExportPDF,
  } = usePcrExport({
    editableContent,
    sectionVisibility,
    sectionOrder,
    isEditMode,
    setIsEditMode,
    reportRef,
    campaign,
  });

  const { history, historyIndex, handleUndo, handleRedo, resetHistory } = usePcrHistory({
    editableContent,
    setEditableContent,
    sectionVisibility,
    setSectionVisibility,
    sectionOrder,
    setSectionOrder,
    isEditMode,
    setIsPreviewCached,
  });

  const mutation = useAiAnalytic(campaign.id);

  // usePcrData needs clearDraft and usePcrAutosave needs isLoadingPCR, so the two
  // hooks depend on each other. A ref breaks the cycle; Save only fires on a
  // click, long after the assignment effect below has run.
  const clearDraftRef = useRef(null);
  const clearDraft = useCallback((savedJson) => clearDraftRef.current?.(savedJson), []);
  const discardStaleDraftRef = useRef(null);
  const discardStaleDraft = useCallback(
    (staleDraft) => discardStaleDraftRef.current?.(staleDraft),
    []
  );
  const getDraftStateRef = useRef(null);
  const getDraftState = useCallback(() => getDraftStateRef.current?.(), []);
  const applyConflictCopy = useCallback(
    (content) => {
      setEditableContent({ ...DEFAULT_EDITABLE_CONTENT, ...content });
      setSectionOrder(content.sectionOrder || DEFAULT_SECTION_ORDER);
      setSectionVisibility({ ...DEFAULT_SECTION_VISIBILITY, ...(content.sectionVisibility || {}) });
      setShowEducatorCard(
        content.showEducatorCard ?? Boolean(content.educatorTitle || content.educatorContentStyle)
      );
      setShowThirdCard(
        content.showThirdCard ?? Boolean(content.thirdTitle || content.thirdContentStyle)
      );
      setShowFourthCard(
        content.showFourthCard ?? Boolean(content.fourthTitle || content.fourthContentStyle)
      );
      setShowFifthCard(
        content.showFifthCard ?? Boolean(content.fifthTitle || content.fifthContentStyle)
      );
      bumpHydrationVersion();
    },
    [bumpHydrationVersion, setEditableContent, setSectionOrder, setSectionVisibility]
  );

  const {
    isLoadingPCR,
    isSaving,
    setIsSaving,
    isPCRReady,
    pcrRevision,
    setPcrRevision,
    loadedDraftRevision,
    loadError,
    draftConflictPayload,
    clearDraftConflict,
    restoredRemoteDraft,
    retryLoad,
    handleSavePCR,
    handleMarkAsReady,
    handleMarkAsUnready,
  } = usePcrData({
    campaign,
    userId,
    editorSessionId,
    onCampaignUpdate,
    isClientView,
    bumpHydrationVersion,
    clearDraft,
    getDraftState,
    editableContent,
    setEditableContent,
    sectionOrder,
    setSectionOrder,
    sectionVisibility,
    setSectionVisibility,
    setShowEducatorCard,
    setShowThirdCard,
    setShowFourthCard,
    setShowFifthCard,
    setIsEditMode,
    setSectionEditStates,
    resetHistory,
    onDraftConflict: setAutosaveConflict,
    onStaleDraft: discardStaleDraft,
  });

  const {
    lastAutosavedAt,
    clearDraft: clearAutosaveDraft,
    getDraftState: getAutosaveDraftState,
    isAutosaveBlocked,
    discardStaleDraft: clearStaleAutosaveDraft,
  } = usePcrAutosave({
    campaignId: campaign?.id,
    userId,
    editorSessionId,
    isClientView,
    isLoadingPCR,
    isLoadError: Boolean(loadError),
    pcrRevision,
    initialDraftRevision: loadedDraftRevision,
    restoredRemoteDraft,
    editableContent,
    sectionOrder,
    sectionVisibility,
    onPcrRevisionUpdate: setPcrRevision,
    onDraftConflict: setAutosaveConflict,
    initialConflict: draftConflictPayload || autosaveConflict,
    onRecoverAsCopy: applyConflictCopy,
    onDiscardConflict: () => {
      clearDraftConflict();
      setAutosaveConflict(null);
    },
  });

  useEffect(() => {
    clearDraftRef.current = clearAutosaveDraft;
    discardStaleDraftRef.current = clearStaleAutosaveDraft;
    getDraftStateRef.current = getAutosaveDraftState;
  }, [clearAutosaveDraft, clearStaleAutosaveDraft, getAutosaveDraftState]);

  // Global paste event listener to strip formatting from all pasted content
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Only apply to inputs, textareas, and contentEditable elements within the report
      const { target } = e;
      const isInReport = reportRef.current?.contains(target);

      if (
        isInReport &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true')
      ) {
        handlePlainTextPaste(e);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);

    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  // Keep the Creator Tiers contentEditable in sync with external changes (e.g. Undo/Redo)
  // when it isn't focused, so it doesn't drift from editableContent.creatorTiersDescription.
  useEffect(() => {
    if (creatorTiersEditorRef.current && editableContent.creatorTiersDescription) {
      const isEditorFocused = document.activeElement === creatorTiersEditorRef.current;

      if (!isEditorFocused) {
        creatorTiersEditorRef.current.innerHTML = editableContent.creatorTiersDescription;
      }
    }
  }, [isEditMode, editableContent.creatorTiersDescription]);

  // Calculate most likes creator
  const mostLikesCreator = useMemo(() => {
    let result = null;
    let maxLikes = 0;

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      const likes = getMetricValue(insightData.insight, 'likes');
      if (likes > maxLikes) {
        maxLikes = likes;
        result = {
          submission,
          insightData,
          likes,
          platform: insightData.platform || submission.platform,
        };
      }
    });

    return result;
  }, [filteredInsightsData, filteredSubmissions]);

  // Calculate most shares creator
  const mostSharesCreator = useMemo(() => {
    let result = null;
    let maxShares = 0;

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      const shares = getMetricValue(insightData.insight, 'shares');
      if (shares > maxShares) {
        maxShares = shares;
        result = {
          submission,
          insightData,
          shares,
          platform: insightData.platform || submission.platform,
        };
      }
    });

    return result;
  }, [filteredInsightsData, filteredSubmissions]);

  const mostLikesUserId =
    typeof mostLikesCreator?.submission?.user === 'string'
      ? mostLikesCreator?.submission?.user
      : mostLikesCreator?.submission?.user?.id;

  const mostSharesUserId =
    typeof mostSharesCreator?.submission?.user === 'string'
      ? mostSharesCreator?.submission?.user
      : mostSharesCreator?.submission?.user?.id;

  // Check if they are manual entries (userId equals submission.id)
  const isLikesManual = mostLikesUserId === mostLikesCreator?.submission?.id;
  const isSharesManual = mostSharesUserId === mostSharesCreator?.submission?.id;

  const { data: mostLikesCreatorData } = useGetCreatorById(!isLikesManual ? mostLikesUserId : null);

  const { data: mostSharesCreatorData } = useGetCreatorById(
    !isSharesManual ? mostSharesUserId : null
  );

  const aiAnalyticsData = useMemo(
    () => formatAnalyticData(mutation.data?.report?.sections),
    [mutation.data?.report?.sections]
  );

  useEffect(() => {
    if (!aiAnalyticsData) return;

    setEditableContent((prev) => ({
      ...prev,
      campaignDescription: aiAnalyticsData.campaign_summary,
      engagementDescription: aiAnalyticsData.engagement_interactions,
      platformBreakdownDescription: aiAnalyticsData.platform_breakdown,
      viewsDescription: aiAnalyticsData.views_analysis,
    }));
  }, [aiAnalyticsData]);

  useEffect(() => {
    setCampaignId(campaign.id);
  }, [campaign?.id]);

  // const aiMutation = useMutation({
  //   mutationKey: ['ai'],
  //   mutationFn: async () => {
  //     const val = Object.fromEntries(promptValue);
  //     const res = await axiosInstance.post(`/api/reports/generate/${campaign.id}/stream`, {
  //       humanPrompts: val,
  //       sections: Object.keys(val),
  //     });

  //     console.log(res.data);

  //     return res.data;
  //   },
  //   onSuccess: (data) => {
  //     const sanitizedData = formatAnalyticData(data?.report?.sections);
  //     setEditableContent((prev) => ({
  //       ...prev,
  //       campaignDescription: sanitizedData.campaign_summary,
  //     }));
  //   },
  // });

  const aiMutation = useMutation({
    mutationKey: ['ai'],
    mutationFn: async () => {
      const val = Object.fromEntries(promptValue);

      const res = await fetch(`http://localhost/api/reports/generate/${campaign.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ humanPrompts: val, sections: Object.keys(val) }),
      });

      if (!res.body) throw new Error('Streaming not supported by this response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sections = [];
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Frames are separated by a blank line and can arrive split across chunks — only
        // consume complete frames, keep any partial one buffered for the next read.
        let sepIndex;
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          const line = frame.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;

          const event = JSON.parse(line.slice('data: '.length));

          if (event.type === 'section:completed') {
            sections.push({ section: event.section, summary: event.summary, data: event.data });
          } else if (event.type === 'section:failed') {
            console.error(`Section ${event.section} failed:`, event.error);
          } else if (event.type === 'report:failed') {
            throw new Error(event.error);
          }
        }
      }

      return sections;
    },
    onSuccess: (sections) => {
      const sanitizedData = formatAnalyticData(sections);
      setEditableContent((prev) => ({
        ...prev,
        campaignDescription: sanitizedData.campaign_summary,
        engagementDescription: sanitizedData.engagement_interactions,
      }));
    },
  });

  const [text, setText] = useState('');
  const controllerRef = useRef(null);

  const stream = useMutation({
    mutationKey: ['ai', 'response'],
    mutationFn: async () => {
      controllerRef?.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch(`http://localhost/api/reports/test/${campaign.id}/stream`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        signal: controller.signal,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const { value, done } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setEditableContent((prev) => ({
          ...prev,
          campaignDescription: markdownBoldToHtml(prev.campaignDescription.concat(chunk)),
        }));
      }
    },
  });

  useEffect(() => {
    if (!effectiveEditMode || aiMutation.isPending) return;

    const handleEnter = (event) => {
      if (event.key === 'Enter') {
        stream.mutate();
        // aiMutation.mutate();
      }
    };

    document.addEventListener('keydown', handleEnter);

    // eslint-disable-next-line consistent-return
    return () => {
      document.removeEventListener('keydown', handleEnter);
    };
  }, [effectiveEditMode, promptValue, aiMutation.isPending, stream]);

  return (
    <>
      {/* Top bar - Ready/Unready - above the PCR blue border */}
      {!isClientView && (
        <Box
          sx={{
            width: '1078px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Button
            sx={{
              width: 260,
              height: 40,
              pt: '6px',
              pr: '12px',
              pb: '9px',
              pl: '12px',
              gap: '6px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E7E7E7',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              color: isPCRReady ? '#1ABF66' : '#8E8E93',
              textTransform: 'none',
              fontFamily: 'Inter Display, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              whiteSpace: 'nowrap',
              '& .MuiButton-startIcon': { color: 'inherit', flexShrink: 0 },
              '& .MuiButton-startIcon *': { color: 'inherit' },
              '&:hover': {
                background: '#F9FAFB',
                border: '1px solid #E7E7E7',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              },
            }}
            onClick={isPCRReady ? handleMarkAsUnready : handleMarkAsReady}
            startIcon={
              isPCRReady ? (
                <Box
                  component="img"
                  src="/assets/greentick.svg"
                  alt=""
                  sx={{ width: 24, height: 24 }}
                />
              ) : (
                <Box
                  component="img"
                  src="/assets/greentick.svg"
                  alt=""
                  sx={{
                    width: 24,
                    height: 24,
                    filter:
                      'brightness(0) saturate(100%) invert(55%) sepia(8%) saturate(1200%) hue-rotate(200deg) brightness(92%) contrast(88%)',
                  }}
                />
              )
            }
          >
            Ready for Client Viewing
          </Button>
        </Box>
      )}

      {!loadingInsights && insightsError && <Error type="insightsError" />}

      {!loadingInsights && !insightsError && missingInsightSnapshots.length > 0 && (
        <Error type="missingSnapshots" count={missingInsightSnapshots.length} />
      )}

      {loadError && !isLoadingPCR && <Error type="loadError" onRetry={retryLoad} />}

      <Box
        id="pcr-report-main"
        sx={{
          width: '1078px',
          padding: '16px',
          paddingBottom: '32px',
          gap: '10px',
          background: 'linear-gradient(180deg, #1340FF 0%, #8A5AFE 100%)',
          margin: '0 auto',
          position: 'relative',
          borderRadius: 1,
        }}
      >
        {/* Loading overlay */}
        {isLoadingPCR && <Overlay type="loading" />}

        {/* Saving overlay */}
        {isSaving && <Overlay type="saving" />}

        {/* PDF Capture Wrapper - includes gradient border */}
        <Box ref={reportRef}>
          {/* Inner content container - transparent background */}
          <Box
            sx={{
              borderRadius: '12px',
              padding: '16px',
              minHeight: 'calc(100% - 32px)',
              opacity: isLoadingPCR ? 0.5 : 1,
              pointerEvents: isLoadingPCR || loadError ? 'none' : 'auto',
            }}
          >
            {/* Header with Back Button */}
            <Box
              className="hide-in-pdf"
              sx={{
                mb: 2,
                // Reserve the toolbar's normal space while its fixed state is active.
                minHeight: { xs: 120, lg: 68 },
              }}
            >
              <Box ref={toolbarSentinelRef} className="hide-in-pdf" sx={{ height: '1px' }} />
              {/* Back Button and Undo/Redo/Save Row */}
              <AnimatePresence initial={false} mode="wait">
                <MotionBox
                  key={isToolbarFloating ? 'pcr-toolbar-floating' : 'pcr-toolbar-inline'}
                  initial={{
                    opacity: shouldReduceMotion ? 1 : 0,
                    y: shouldReduceMotion ? 0 : -6,
                    x: 0,
                  }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : -4 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.16, ease: 'easeOut' }}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: { xs: 'wrap', lg: 'nowrap' },
                    rowGap: 1,
                    mb: 2,
                    position: isToolbarFloating ? 'fixed' : 'relative',
                    top: isToolbarFloating
                      ? floatingToolbarBounds?.top || { xs: HEADER.H_MOBILE, lg: HEADER.H_DESKTOP }
                      : 'auto',
                    // Keep the banner in the AppBar's stacking layer, not above it.
                    // Its measured top is the AppBar's actual bottom edge.
                    zIndex: isToolbarFloating ? (theme) => theme.zIndex.appBar : 'auto',
                    left: isToolbarFloating ? floatingToolbarBounds?.left || 0 : 'auto',
                    width: isToolbarFloating
                      ? floatingToolbarBounds?.width || { xs: 'calc(100vw - 16px)', lg: '100%' }
                      : 'auto',
                    maxWidth: isToolbarFloating ? '100vw' : 'none',
                    mx: isToolbarFloating ? 0 : 'auto',
                    px: isToolbarFloating ? { xs: 1, sm: 2 } : 0,
                    py: isToolbarFloating ? 0.75 : 0,
                    // Match the dashboard Header's bgBlur(theme.palette.background.paper)
                    // values exactly: alpha 0.8 with a 6px backdrop blur.
                    backgroundColor: isToolbarFloating
                      ? (theme) => alpha(theme.palette.background.paper, 0.8)
                      : 'transparent',
                    backdropFilter: isToolbarFloating ? 'blur(6px)' : 'none',
                    WebkitBackdropFilter: isToolbarFloating ? 'blur(6px)' : 'none',
                    borderBottom: isToolbarFloating ? 1 : 0,
                    borderBottomColor: isToolbarFloating
                      ? (theme) => theme.palette.divider
                      : 'transparent',
                    boxShadow: 'none',
                  }}
                >
                  <Button
                    onClick={onBack}
                    sx={{
                      width: '73px',
                      height: '44px',
                      borderRadius: '8px',
                      gap: '6px',
                      padding: '10px 16px 13px 16px',
                      background: '#3A3A3C',
                      boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 600,
                      fontStyle: 'normal',
                      fontSize: '16px',
                      lineHeight: '20px',
                      letterSpacing: '0%',
                      '&:hover': {
                        background: '#2A2A2C',
                        boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.55) inset',
                      },
                      '&:active': {
                        boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.45) inset',
                        transform: 'translateY(1px)',
                      },
                    }}
                  >
                    Back
                  </Button>

                  {!isClientView && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        flexWrap: { xs: 'wrap', lg: 'nowrap' },
                        justifyContent: { xs: 'flex-end', lg: 'flex-start' },
                      }}
                    >
                      {text}
                      {isEditMode.state ? (
                        <>
                          {isEditMode.type === 'ai' && (
                            <Button
                              disabled={mutation.isPending}
                              sx={{
                                borderRadius: '8px',
                                position: 'relative',
                                gap: '6px',
                                padding: '10px 16px 13px 16px',
                                bgcolor: 'rgba(138, 90, 254, 1)',
                                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                                color: 'rgba(255, 255, 255, 1)',
                                textTransform: 'none',
                                fontFamily: 'Inter Display, sans-serif',
                                fontWeight: 600,
                                fontStyle: 'normal',
                                fontSize: '16px',
                                lineHeight: '20px',
                                letterSpacing: '0%',
                                whiteSpace: 'nowrap',
                                paddingLeft: 4,
                                '&:hover': {
                                  background: alpha('rgba(138, 90, 254, 1)', 0.7),
                                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                                },
                                '&:active': {
                                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                                  transform: 'translateY(1px)',
                                },
                                '&:disabled': {
                                  color: 'rgba(255, 255, 255, 1)',
                                },
                              }}
                              // onClick={mutation.mutate}
                              onClick={() => {
                                handleStream();
                              }}
                              startIcon={
                                <img
                                  src="/assets/star.svg"
                                  alt="star"
                                  style={{
                                    backgroundColor: 'transparent',
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                  }}
                                  draggable="false"
                                />
                              }
                            >
                              Generate with AI
                            </Button>
                          )}
                          <Button
                            sx={{
                              width: '90px',
                              height: '44px',
                              borderRadius: '8px',
                              gap: '6px',
                              padding: '10px 16px 13px 16px',
                              background: '#FFFFFF',
                              border: '1px solid #E7E7E7',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              color: '#374151',
                              textTransform: 'none',
                              fontFamily: 'Inter Display, sans-serif',
                              fontWeight: 600,
                              fontStyle: 'normal',
                              fontSize: '16px',
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                background: '#F9FAFB',
                                border: '1px solid #D1D5DB',
                                boxShadow: '0px -3px 0px 0px #D1D5DB inset',
                              },
                              '&:active': {
                                boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                                transform: 'translateY(1px)',
                              },
                              '&:disabled': {
                                background: '#F3F4F6',
                                color: '#9CA3AF',
                                border: '1px solid #E5E7EB',
                              },
                            }}
                            onClick={handleGeneratePreview}
                          >
                            Preview
                          </Button>
                          <Button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            endIcon={
                              <Box
                                component="img"
                                src="/assets/icons/components/undo.svg"
                                alt="Undo"
                                sx={{
                                  width: '19px',
                                  height: '18px',
                                  opacity: historyIndex <= 0 ? 0.4 : 1,
                                }}
                              />
                            }
                            sx={{
                              height: '44px',
                              borderRadius: '8px',
                              padding: '10px 16px 13px 16px',
                              background: '#FFFFFF',
                              border: '1px solid #E7E7E7',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              color: '#374151',
                              textTransform: 'none',
                              fontFamily: 'Inter Display, sans-serif',
                              fontWeight: 600,
                              fontStyle: 'normal',
                              fontSize: '16px',
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              '&:hover': {
                                background: '#F9FAFB',
                                border: '1px solid #D1D5DB',
                                boxShadow: '0px -3px 0px 0px #D1D5DB inset',
                              },
                              '&:active': {
                                boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                                transform: 'translateY(1px)',
                              },
                              '&:disabled': {
                                background: '#F3F4F6',
                                color: '#9CA3AF',
                              },
                            }}
                          >
                            Undo
                          </Button>
                          <Button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            endIcon={
                              <Box
                                component="img"
                                src="/assets/icons/components/redo.svg"
                                alt="Redo"
                                sx={{
                                  width: '19px',
                                  height: '18px',
                                  opacity: historyIndex >= history.length - 1 ? 0.4 : 1,
                                }}
                              />
                            }
                            sx={{
                              height: '44px',
                              borderRadius: '8px',
                              padding: '10px 16px 13px 16px',
                              background: '#FFFFFF',
                              border: '1px solid #E7E7E7',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              color: '#374151',
                              textTransform: 'none',
                              fontFamily: 'Inter Display, sans-serif',
                              fontWeight: 600,
                              fontStyle: 'normal',
                              fontSize: '16px',
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              '&:hover': {
                                background: '#F9FAFB',
                                border: '1px solid #D1D5DB',
                                boxShadow: '0px -3px 0px 0px #D1D5DB inset',
                              },
                              '&:active': {
                                boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                                transform: 'translateY(1px)',
                              },
                              '&:disabled': {
                                background: '#F3F4F6',
                                color: '#9CA3AF',
                              },
                            }}
                          >
                            Redo
                          </Button>

                          {lastAutosavedAt && (
                            <Typography
                              sx={{
                                alignSelf: 'center',
                                fontSize: '12px',
                                color: '#9CA3AF',
                                fontFamily: 'Inter Display, sans-serif',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Autosaved {format(lastAutosavedAt, 'HH:mm')}
                            </Typography>
                          )}

                          <Button
                            onClick={handleSavePCR}
                            disabled={isSaving || Boolean(loadError) || !pcrRevision}
                            sx={{
                              height: '44px',
                              borderRadius: '8px',
                              padding: '10px 16px 13px 16px',
                              background: '#3A3A3C',
                              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                              color: '#FFFFFF',
                              textTransform: 'none',
                              fontFamily: 'Inter Display, sans-serif',
                              fontWeight: 600,
                              fontStyle: 'normal',
                              fontSize: '16px',
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              '&:hover': {
                                background: '#2A2A2C',
                                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.55) inset',
                              },
                              '&:active': {
                                boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.45) inset',
                                transform: 'translateY(1px)',
                              },
                              '&:disabled': {
                                background: '#9CA3AF',
                                color: '#D1D5DB',
                              },
                            }}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            disabled={isExportingPDF}
                            sx={{
                              width: '100px',
                              height: '44px',
                              borderRadius: '8px',
                              gap: '6px',
                              padding: '10px 16px 13px 16px',
                              background: '#FFFFFF',
                              border: '1px solid #E7E7E7',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              color: '#374151',
                              textTransform: 'none',
                              fontFamily: 'Inter Display, sans-serif',
                              fontWeight: 600,
                              fontStyle: 'normal',
                              fontSize: '16px',
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                background: '#F9FAFB',
                                border: '1px solid #D1D5DB',
                                boxShadow: '0px -3px 0px 0px #D1D5DB inset',
                              },
                              '&:active': {
                                boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                                transform: 'translateY(1px)',
                              },
                              '&:disabled': {
                                background: '#F3F4F6',
                                color: '#9CA3AF',
                                border: '1px solid #E5E7EB',
                              },
                            }}
                            onClick={handleGeneratePreview}
                          >
                            Preview
                          </Button>

                          {!isEditMode.state && (
                            <Button
                              sx={{
                                borderRadius: '8px',
                                position: 'relative',
                                gap: '6px',
                                padding: '10px 16px 13px 16px',
                                bgcolor: 'rgba(138, 90, 254, 1)',
                                boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                                color: 'rgba(255, 255, 255, 1)',
                                textTransform: 'none',
                                fontFamily: 'Inter Display, sans-serif',
                                fontWeight: 600,
                                fontStyle: 'normal',
                                fontSize: '16px',
                                lineHeight: '20px',
                                letterSpacing: '0%',
                                whiteSpace: 'nowrap',
                                paddingLeft: 4,
                                '&:hover': {
                                  background: alpha('rgba(138, 90, 254, 1)', 0.7),
                                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                                },
                                '&:active': {
                                  boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
                                  transform: 'translateY(1px)',
                                },
                                '&:disabled': {
                                  color: 'rgba(255, 255, 255, 1)',
                                },
                              }}
                              disabled={Boolean(loadError) || isLoadingPCR || !pcrRevision}
                              onClick={() => setIsEditMode({ type: 'ai', state: true })}
                              startIcon={
                                <img
                                  src="/assets/star.svg"
                                  alt="star"
                                  style={{
                                    backgroundColor: 'transparent',
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                  }}
                                  draggable="false"
                                />
                              }
                            >
                              Edit with AI
                            </Button>
                          )}

                          <Button
                            sx={{
                              width: '117px',
                              height: '44px',
                              borderRadius: '8px',
                              gap: '6px',
                              padding: '10px 16px 13px 16px',
                              background: '#FFFFFF',
                              border: '1px solid #E7E7E7',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              color: '#374151',
                              textTransform: 'none',
                              fontFamily: 'Inter Display, sans-serif',
                              fontWeight: 600,
                              fontStyle: 'normal',
                              fontSize: '16px',
                              lineHeight: '20px',
                              letterSpacing: '0%',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                background: '#F9FAFB',
                                border: '1px solid #D1D5DB',
                                boxShadow: '0px -3px 0px 0px #D1D5DB inset',
                              },
                              '&:active': {
                                boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                                transform: 'translateY(1px)',
                              },
                            }}
                            disabled={Boolean(loadError) || isLoadingPCR || !pcrRevision}
                            onClick={() => setIsEditMode({ type: 'normal', state: true })}
                          >
                            Edit Report
                          </Button>
                          <Button
                            onClick={handleExportPDF}
                            sx={{
                              minWidth: '44px',
                              width: '44px',
                              height: '44px',
                              borderRadius: '8px',
                              padding: '10px',
                              background: '#FFFFFF',
                              border: '1px solid #E7E7E7',
                              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                              color: '#1340FF',
                              '&:hover': {
                                background: '#F9FAFB',
                                border: '1px solid #D1D5DB',
                                boxShadow: '0px -3px 0px 0px #D1D5DB inset',
                              },
                              '&:active': {
                                boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                                transform: 'translateY(1px)',
                              },
                            }}
                          >
                            <Iconify icon="material-symbols:download-rounded" width={20} />
                          </Button>
                        </>
                      )}
                    </Box>
                  )}
                </MotionBox>
              </AnimatePresence>

              {/* Add Section Buttons - Only show in edit mode */}
              {effectiveEditMode && (
                <AddSectionButtons
                  sectionVisibility={sectionVisibility}
                  setSectionVisibility={setSectionVisibility}
                />
              )}
            </Box>

            {/* Report Header */}
            <Box
              className="pcr-section"
              sx={{
                mb: 2,
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
              }}
            >
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '16px',
                        lineHeight: '20px',
                        letterSpacing: '0%',
                        textTransform: 'uppercase',
                        color: '#231F20',
                        mb: 1,
                        display: 'block',
                      }}
                    >
                      POST CAMPAIGN REPORT: {formatCampaignPeriod()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontFamily: 'Inter Display, sans-serif',
                          fontWeight: 700,
                          fontStyle: 'normal',
                          fontSize: '56px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          color: '#231F20',
                        }}
                      >
                        {campaign?.name || 'Crafting Unforgettable Nights'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ position: 'relative', right: '-5px' }}>
                    <Box
                      component="img"
                      src="/cc_logo.png"
                      alt="Cult Creative"
                      sx={{
                        width: '187px',
                        opacity: 0.8,
                        aspectRatio: '3/2 auto',
                      }}
                    />
                  </Box>
                </Box>

                <EditableDescriptionField
                  label="Campaign Description"
                  fieldKey="campaignDescription"
                  hydrationVersion={hydrationVersion}
                  value={editableContent.campaignDescription}
                  onChange={(v) => {
                    setEditableContent({ ...editableContent, campaignDescription: v });
                  }}
                  rows={3}
                  mb={2}
                  isClientView={isClientView}
                  isLoading={effectiveEditMode && (mutation.isPending || aiMutation.isPending)}
                  loadingTitle="Overview"
                  // onCancelLoading={mutation.cancel}
                  onCancelLoading={() => {
                    controllerRef.current?.abort();

                    setEditableContent({ ...editableContent, campaignDescription: '' });
                  }}
                  isStreamRunning={stream.isPending}
                  aiSection="campaign_summary"
                />
              </Box>

              {/* Metrics Cards */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {/* Engagement Card */}
                <Grid item xs={6} md={2.4}>
                  <Box
                    sx={{
                      background: 'linear-gradient(0deg, #026D54 0%, rgba(2, 109, 84, 0) 107.14%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '46px !important',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                        mb: 0.5,
                      }}
                    >
                      {summaryStats.avgEngagementRate ? `${summaryStats.avgEngagementRate}%` : '0%'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                      }}
                    >
                      Engagement
                    </Typography>
                  </Box>
                </Grid>

                {/* Total Creators Card */}
                <Grid item xs={6} md={2.4}>
                  <Box
                    sx={{
                      background:
                        'linear-gradient(359.86deg, #8A5AFE 0.13%, rgba(138, 90, 254, 0) 109.62%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '46px !important',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                        mb: 0.5,
                      }}
                    >
                      {formatNumber(uniqueCreatorsCount || 0)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                      }}
                    >
                      Total Creators
                    </Typography>
                  </Box>
                </Grid>

                {/* Total Views Card */}
                <Grid item xs={6} md={2.4}>
                  <Box
                    sx={{
                      background:
                        'linear-gradient(180deg, rgba(255, 53, 0, 0) -9.77%, #FF3500 100%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '46px !important',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                        mb: 0.5,
                      }}
                    >
                      {formatNumber(summaryStats.totalViews) || '0'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                      }}
                    >
                      Total Views
                    </Typography>
                  </Box>
                </Grid>

                {/* Total Interactions Card */}
                <Grid item xs={6} md={2.4}>
                  <Box
                    sx={{
                      background:
                        'linear-gradient(180deg, rgba(19, 64, 255, 0) -8.65%, #1340FF 100%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '46px !important',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                        mb: 0.5,
                      }}
                    >
                      {formatNumber(
                        (summaryStats.totalLikes || 0) +
                          (summaryStats.totalComments || 0) +
                          (summaryStats.totalShares || 0) +
                          (summaryStats.totalSaved || 0)
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                      }}
                    >
                      Total Interactions
                    </Typography>
                  </Box>
                </Grid>

                {/* Total Shares Card */}
                <Grid item xs={6} md={2.4}>
                  <Box
                    sx={{
                      background: 'linear-gradient(180deg, rgba(255, 199, 2, 0) 0%, #FFC702 100%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '46px !important',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                        mb: 0.5,
                      }}
                    >
                      {formatNumber(summaryStats.totalShares) || '0'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '12px',
                        lineHeight: '16px',
                        letterSpacing: '0%',
                        color: '#FFFFFF',
                      }}
                    >
                      Total Shares
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Draggable Sections - Wrapped with DnD Context */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sectionOrder.filter((id) => sectionVisibility[id])}
                strategy={verticalListSortingStrategy}
              >
                {sectionOrder.map((sectionId) => {
                  if (!sectionVisibility[sectionId]) return null;

                  switch (sectionId) {
                    case 'engagement':
                      return (
                        <SortableSection
                          key="engagement"
                          id="engagement"
                          isEditMode={effectiveEditMode}
                        >
                          {/* Engagement & Interactions Section */}
                          <Box
                            className="pcr-section"
                            sx={{
                              mb: 2,
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '24px',
                              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <Box sx={{ mb: 4 }}>
                              <SectionHeader
                                title="Engagements"
                                sectionKey="engagement"
                                effectiveEditMode={effectiveEditMode}
                                sectionEditStates={sectionEditStates}
                                setSectionEditStates={setSectionEditStates}
                                sectionVisibility={sectionVisibility}
                                setSectionVisibility={setSectionVisibility}
                                handleSavePCR={handleSavePCR}
                                setIsSaving={setIsSaving}
                              />

                              <EditableDescriptionField
                                label="Engagement"
                                fieldKey="engagementDescription"
                                hydrationVersion={hydrationVersion}
                                isEditingSection={
                                  effectiveEditMode && !sectionEditStates.engagement
                                }
                                isLoading={
                                  effectiveEditMode && (mutation.isPending || aiMutation.isPending)
                                }
                                value={
                                  aiAnalyticsData?.engagement_interactions ||
                                  editableContent.engagementDescription
                                }
                                onChange={(v) =>
                                  setEditableContent({
                                    ...editableContent,
                                    engagementDescription: v,
                                  })
                                }
                                rows={4}
                                mb={3}
                                isClientView={isClientView}
                                readOnlySx={{
                                  '& strong': {
                                    fontFamily: 'Inter Display, sans-serif',
                                    fontWeight: 700,
                                    fontStyle: 'normal',
                                    fontSize: '20px',
                                    lineHeight: '24px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                  },
                                }}
                                aiSection="engagement_interactions"
                              />

                              {/* Analytics Grid */}
                              <Grid container spacing={2} sx={{ my: 3 }}>
                                {/* Top 5 Creator Engagement Rate */}
                                <Grid item xs={12} md={6}>
                                  <TopEngagementCard
                                    filteredInsightsData={filteredInsightsData}
                                    filteredSubmissions={filteredSubmissions}
                                  />
                                </Grid>

                                {/* Top 5 Creator ER Across Campaign Phases */}
                                <Grid item xs={12} md={6}>
                                  <EngagementRateHeatmap
                                    filteredInsightsData={filteredInsightsData}
                                    filteredSubmissions={filteredSubmissions}
                                    campaign={campaign}
                                    postSnapshots={postSnapshots}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        </SortableSection>
                      );

                    case 'platformBreakdown':
                      return (
                        <SortableSection
                          key="platformBreakdown"
                          id="platformBreakdown"
                          isEditMode={effectiveEditMode}
                        >
                          {/* Platform Breakdown Section */}
                          <Box
                            className="pcr-section"
                            sx={{
                              mb: 2,
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '24px',
                              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <Box sx={{ mb: 4 }}>
                              <SectionHeader
                                title="Platform Breakdown"
                                sectionKey="platformBreakdown"
                                effectiveEditMode={effectiveEditMode}
                                sectionEditStates={sectionEditStates}
                                setSectionEditStates={setSectionEditStates}
                                sectionVisibility={sectionVisibility}
                                setSectionVisibility={setSectionVisibility}
                                handleSavePCR={handleSavePCR}
                                setIsSaving={setIsSaving}
                              />

                              <EditableDescriptionField
                                label="Platform Breakdown"
                                fieldKey="platformBreakdownDescription"
                                hydrationVersion={hydrationVersion}
                                isEditingSection={
                                  effectiveEditMode && !sectionEditStates.platformBreakdown
                                }
                                isLoading={effectiveEditMode && mutation.isPending}
                                value={
                                  aiAnalyticsData?.platform_breakdown ||
                                  editableContent.platformBreakdownDescription
                                }
                                // value={editableContent.platformBreakdownDescription || ''}
                                onChange={(v) =>
                                  setEditableContent({
                                    ...editableContent,
                                    platformBreakdownDescription: v,
                                  })
                                }
                                rows={2}
                                mb={3}
                                isClientView={isClientView}
                              />

                              {/* Platform Breakdown Grid */}
                              <Grid container spacing={3} my={3}>
                                {/* Platform Interactions Chart - Left */}
                                <Grid item xs={12} md={4}>
                                  <PlatformInteractionsChart
                                    filteredInsightsData={filteredInsightsData}
                                    filteredSubmissions={filteredSubmissions}
                                  />
                                </Grid>

                                {/* Right side cards */}
                                <Grid item xs={12} md={8}>
                                  <Grid container spacing={2}>
                                    {/* Most Likes Card */}
                                    {(() => {
                                      const views = mostLikesCreator
                                        ? getMetricValue(
                                            mostLikesCreator.insightData.insight,
                                            'views'
                                          )
                                        : 0;
                                      const shares = mostLikesCreator
                                        ? getMetricValue(
                                            mostLikesCreator.insightData.insight,
                                            'shares'
                                          )
                                        : 0;
                                      const maxLikes = mostLikesCreator
                                        ? mostLikesCreator.likes
                                        : 0;
                                      const engagementRate = mostLikesCreator
                                        ? calculateEngagementRate(
                                            mostLikesCreator.insightData.insight
                                          )
                                        : 0;

                                      // Get username based on platform
                                      let username = '';
                                      if (mostLikesCreator) {
                                        const { platform } = mostLikesCreator;
                                        if (platform === 'Instagram') {
                                          username =
                                            mostLikesCreatorData?.user?.creator?.instagram ||
                                            mostLikesCreator?.submission?.user?.creator
                                              ?.instagram ||
                                            mostLikesCreator?.submission?.user?.username ||
                                            mostLikesCreator?.submission?.user?.name ||
                                            '';
                                        } else if (platform === 'TikTok') {
                                          username =
                                            mostLikesCreatorData?.user?.creator?.tiktok ||
                                            mostLikesCreator?.submission?.user?.creator?.tiktok ||
                                            mostLikesCreator?.submission?.user?.username ||
                                            mostLikesCreator?.submission?.user?.name ||
                                            '';
                                        }
                                      }

                                      return (
                                        mostLikesCreator && (
                                          <Grid item xs={12} md={12}>
                                            <Box
                                              sx={{
                                                padding: '16px',
                                                bgcolor: '#FFFFFF',
                                                borderRadius: '8px',
                                                border: '1px solid #EBEBEB',
                                                boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                                                position: 'relative',
                                                width: '611px',
                                                height: '112px',
                                                gap: '4px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                marginLeft: 'auto',
                                              }}
                                            >
                                              {/* Most Likes Badge */}
                                              <Box
                                                sx={{
                                                  position: 'absolute',
                                                  top: '-10px',
                                                  left: '16px',
                                                  bgcolor: '#DBFAE6',
                                                  borderRadius: '4px',
                                                  px: 2,
                                                  py: 0.5,
                                                  fontFamily: 'Aileron',
                                                  fontSize: '10px',
                                                  fontWeight: 600,
                                                  color: '#1ABF66',
                                                }}
                                              >
                                                Most Likes
                                              </Box>

                                              {/* Creator Info */}
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  mb: 0,
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                  <Avatar
                                                    sx={{
                                                      width: 40,
                                                      height: 40,
                                                      mr: 1.5,
                                                      bgcolor: '#E4405F',
                                                    }}
                                                  >
                                                    {(
                                                      mostLikesCreatorData?.user?.name ||
                                                      mostLikesCreator?.submission?.user?.name
                                                    )?.charAt(0) || 'U'}
                                                  </Avatar>
                                                  <Box>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '16px',
                                                        color: '#231F20',
                                                        lineHeight: '18px',
                                                      }}
                                                    >
                                                      {mostLikesCreatorData?.user?.name ||
                                                        mostLikesCreator?.submission?.user?.name ||
                                                        'Unknown'}
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontSize: '14px',
                                                        color: '#636366',
                                                        lineHeight: '16px',
                                                      }}
                                                    >
                                                      {username}
                                                    </Typography>
                                                  </Box>
                                                </Box>

                                                {/* Metrics - Inline */}
                                                <Box sx={{ display: 'flex', gap: 5 }}>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Engage. Rate
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {engagementRate}%
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Views
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {formatNumber(views)}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Likes
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {formatNumber(maxLikes)}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Shares
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {formatNumber(shares)}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              </Box>
                                            </Box>
                                          </Grid>
                                        )
                                      );
                                    })()}

                                    {/* Most Shares Card */}
                                    {(() => {
                                      const views = mostSharesCreator
                                        ? getMetricValue(
                                            mostSharesCreator.insightData.insight,
                                            'views'
                                          )
                                        : 0;
                                      const likes = mostSharesCreator
                                        ? getMetricValue(
                                            mostSharesCreator.insightData.insight,
                                            'likes'
                                          )
                                        : 0;
                                      const maxShares = mostSharesCreator
                                        ? mostSharesCreator.shares
                                        : 0;
                                      const engagementRate = mostSharesCreator
                                        ? calculateEngagementRate(
                                            mostSharesCreator.insightData.insight
                                          )
                                        : 0;

                                      // Get username based on platform
                                      let username = '';
                                      if (mostSharesCreator) {
                                        const { platform } = mostSharesCreator;
                                        if (platform === 'Instagram') {
                                          username =
                                            mostSharesCreatorData?.user?.creator?.instagram ||
                                            mostSharesCreator?.submission?.user?.creator
                                              ?.instagram ||
                                            mostSharesCreator?.submission?.user?.username ||
                                            mostSharesCreator?.submission?.user?.name ||
                                            '';
                                        } else if (platform === 'TikTok') {
                                          username =
                                            mostSharesCreatorData?.user?.creator?.tiktok ||
                                            mostSharesCreator?.submission?.user?.creator?.tiktok ||
                                            mostSharesCreator?.submission?.user?.username ||
                                            mostSharesCreator?.submission?.user?.name ||
                                            '';
                                        }
                                      }

                                      return (
                                        mostSharesCreator && (
                                          <Grid item xs={12} md={12}>
                                            <Box
                                              sx={{
                                                padding: '16px',
                                                bgcolor: '#FFFFFF',
                                                borderRadius: '8px',
                                                border: '1px solid #EBEBEB',
                                                boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                                                position: 'relative',
                                                width: '611px',
                                                height: '112px',
                                                gap: '4px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center',
                                                marginLeft: 'auto',
                                              }}
                                            >
                                              {/* Most Shares Badge */}
                                              <Box
                                                sx={{
                                                  position: 'absolute',
                                                  top: '-10px',
                                                  left: '16px',
                                                  bgcolor: '#DBFAE6',
                                                  borderRadius: '4px',
                                                  px: 2,
                                                  py: 0.5,
                                                  fontFamily: 'Aileron',
                                                  fontSize: '10px',
                                                  fontWeight: 600,
                                                  color: '#1ABF66',
                                                }}
                                              >
                                                Most Shares
                                              </Box>

                                              {/* Creator Info */}
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between',
                                                  mb: 0,
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                  <Avatar
                                                    sx={{
                                                      width: 40,
                                                      height: 40,
                                                      mr: 1.5,
                                                      bgcolor: '#E4405F',
                                                    }}
                                                  >
                                                    {(
                                                      mostSharesCreatorData?.user?.name ||
                                                      mostSharesCreator?.submission?.user?.name
                                                    )?.charAt(0) || 'U'}
                                                  </Avatar>
                                                  <Box>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '16px',
                                                        color: '#231F20',
                                                        lineHeight: '18px',
                                                      }}
                                                    >
                                                      {mostSharesCreatorData?.user?.name ||
                                                        mostSharesCreator?.submission?.user?.name ||
                                                        'Unknown'}
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontSize: '14px',
                                                        color: '#636366',
                                                        lineHeight: '16px',
                                                      }}
                                                    >
                                                      {username}
                                                    </Typography>
                                                  </Box>
                                                </Box>

                                                {/* Metrics - Inline */}
                                                <Box sx={{ display: 'flex', gap: 5 }}>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Engage. Rate
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {engagementRate}%
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Views
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {formatNumber(views)}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Likes
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {formatNumber(likes)}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ textAlign: 'left' }}>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        lineHeight: '14px',
                                                        color: '#636366',
                                                      }}
                                                    >
                                                      Shares
                                                    </Typography>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Instrument Serif',
                                                        fontWeight: 400,
                                                        fontSize: '28px',
                                                        lineHeight: '30px',
                                                        color: '#1340FF',
                                                      }}
                                                    >
                                                      {formatNumber(maxShares)}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              </Box>
                                            </Box>
                                          </Grid>
                                        )
                                      );
                                    })()}
                                  </Grid>
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        </SortableSection>
                      );

                    case 'views':
                      return (
                        <SortableSection key="views" id="views" isEditMode={effectiveEditMode}>
                          {/* Views Section */}
                          <Box
                            className="pcr-section"
                            sx={{
                              mb: 2,
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '24px',
                              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <Box sx={{ mb: 4 }}>
                              <SectionHeader
                                title="Views"
                                sectionKey="views"
                                effectiveEditMode={effectiveEditMode}
                                sectionEditStates={sectionEditStates}
                                setSectionEditStates={setSectionEditStates}
                                sectionVisibility={sectionVisibility}
                                setSectionVisibility={setSectionVisibility}
                                handleSavePCR={handleSavePCR}
                                setIsSaving={setIsSaving}
                              />

                              <EditableDescriptionField
                                label="Views"
                                fieldKey="viewsDescription"
                                hydrationVersion={hydrationVersion}
                                isEditingSection={effectiveEditMode && !sectionEditStates.views}
                                value={
                                  aiAnalyticsData?.views_analysis ||
                                  editableContent.viewsDescription ||
                                  ''
                                }
                                onChange={(v) =>
                                  setEditableContent({ ...editableContent, viewsDescription: v })
                                }
                                rows={3}
                                mb={3}
                                isClientView={isClientView}
                                isLoading={effectiveEditMode && mutation.isPending}
                              />

                              {/* Views Charts Grid */}
                              <Grid container spacing={3}>
                                {/* Top 5 Creator Total Views - Left */}
                                <Grid item xs={12} md={6}>
                                  <TopCreatorViewsChart
                                    filteredInsightsData={filteredInsightsData}
                                    filteredSubmissions={filteredSubmissions}
                                  />
                                </Grid>

                                {/* Top 5 Creator Views after 48H of Posting - Right */}
                                <Grid item xs={12} md={6}>
                                  <TopCreatorViews48HChart
                                    filteredInsightsData={filteredInsightsData}
                                    filteredSubmissions={filteredSubmissions}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        </SortableSection>
                      );

                    case 'audienceSentiment':
                      return (
                        <SortableSection
                          key="audienceSentiment"
                          id="audienceSentiment"
                          isEditMode={effectiveEditMode}
                        >
                          {/* Audience Sentiment */}
                          <Box
                            className="pcr-section"
                            sx={{
                              mb: 2,
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '24px',
                              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <Box sx={{ mb: 6, mt: 0 }}>
                              <SectionHeader
                                title="Audience Sentiment"
                                sectionKey="audienceSentiment"
                                effectiveEditMode={effectiveEditMode}
                                sectionEditStates={sectionEditStates}
                                setSectionEditStates={setSectionEditStates}
                                sectionVisibility={sectionVisibility}
                                setSectionVisibility={setSectionVisibility}
                                handleSavePCR={handleSavePCR}
                                setIsSaving={setIsSaving}
                              />

                              <EditableDescriptionField
                                label="Audience Sentiment"
                                fieldKey="audienceSentimentDescription"
                                hydrationVersion={hydrationVersion}
                                isEditingSection={
                                  effectiveEditMode && !sectionEditStates.audienceSentiment
                                }
                                value={editableContent.audienceSentimentDescription}
                                onChange={(v) =>
                                  setEditableContent({
                                    ...editableContent,
                                    audienceSentimentDescription: v,
                                  })
                                }
                                rows={3}
                                mb={3}
                                isClientView={isClientView}
                              />

                              {/* Positive Comments */}
                              {(effectiveEditMode ||
                                editableContent.positiveComments.length > 0) && (
                                <Box sx={{ mb: 3, position: 'relative', mt: 3 }}>
                                  <Box
                                    sx={{
                                      p: 3,
                                      border: '2px solid #10B981',
                                      borderRadius: '12px',
                                      bgcolor: 'white',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '-10px',
                                        left: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        bgcolor: '#D1FAE5',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: '4px',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          fontFamily: 'Aileron',
                                          fontWeight: 600,
                                          fontSize: '14px',
                                          lineHeight: '18px',
                                          color: '#10B981',
                                        }}
                                      >
                                        Positive Comments
                                      </Typography>
                                    </Box>
                                    {effectiveEditMode && !sectionEditStates.audienceSentiment ? (
                                      <>
                                        <Grid container spacing={2}>
                                          {editableContent.positiveComments.map(
                                            (comment, index) => (
                                              <Grid item xs={12} sm={6} md={3} key={index}>
                                                <Box
                                                  sx={{
                                                    p: 1.5,
                                                    bgcolor: '#F3F4F6',
                                                    borderRadius: '8px',
                                                    position: 'relative',
                                                  }}
                                                >
                                                  <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                      const newComments =
                                                        editableContent.positiveComments.filter(
                                                          (_, i) => i !== index
                                                        );
                                                      setEditableContent({
                                                        ...editableContent,
                                                        positiveComments: newComments,
                                                      });
                                                    }}
                                                    sx={{
                                                      position: 'absolute',
                                                      top: 4,
                                                      right: 4,
                                                      color: '#6B7280',
                                                    }}
                                                  >
                                                    <DeleteIcon fontSize="small" />
                                                  </IconButton>
                                                  <Typography
                                                    sx={{
                                                      fontFamily: 'Aileron',
                                                      fontSize: '12px',
                                                      fontWeight: 600,
                                                      color: '#6B7280',
                                                      mb: 0.5,
                                                      pr: 3,
                                                    }}
                                                  >
                                                    {comment.username}
                                                  </Typography>
                                                  <Typography
                                                    sx={{
                                                      fontFamily: 'Aileron',
                                                      fontSize: '14px',
                                                      color: '#374151',
                                                      lineHeight: 1.4,
                                                    }}
                                                  >
                                                    {comment.comment}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            )
                                          )}
                                        </Grid>
                                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                          <TextField
                                            placeholder="Social media username"
                                            sx={{ flex: 1 }}
                                            id="positive-username-input"
                                            disabled={editableContent.positiveComments.length >= 4}
                                            defaultValue="@"
                                            onFocus={(e) => {
                                              if (e.target.value === '') {
                                                e.target.value = '@';
                                              }
                                            }}
                                            onChange={(e) => {
                                              let { value } = e.target;
                                              // Remove spaces
                                              value = value.replace(/\s/g, '');
                                              // Ensure it always starts with @
                                              if (!value.startsWith('@')) {
                                                value = `@${value}`;
                                              }
                                              // Prevent deleting the @
                                              if (value === '') {
                                                value = '@';
                                              }
                                              e.target.value = value;
                                            }}
                                            onKeyPress={(e) => {
                                              // Prevent space key
                                              if (e.key === ' ') {
                                                e.preventDefault();
                                              }
                                              if (
                                                e.key === 'Enter' &&
                                                editableContent.positiveComments.length < 4
                                              ) {
                                                const username =
                                                  document.getElementById(
                                                    'positive-username-input'
                                                  ).value;
                                                const comment =
                                                  document.getElementById(
                                                    'positive-comment-input'
                                                  ).value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [
                                                    ...editableContent.positiveComments,
                                                    { username, comment },
                                                  ];
                                                  setEditableContent({
                                                    ...editableContent,
                                                    positiveComments: newComments,
                                                  });
                                                  document.getElementById(
                                                    'positive-username-input'
                                                  ).value = '@';
                                                  document.getElementById(
                                                    'positive-postlink-input'
                                                  ).value = '';
                                                  document.getElementById(
                                                    'positive-comment-input'
                                                  ).value = '';
                                                }
                                              }
                                            }}
                                          />
                                          <TextField
                                            placeholder="Post link"
                                            sx={{ flex: 1 }}
                                            id="positive-postlink-input"
                                            disabled={editableContent.positiveComments.length >= 4}
                                            onKeyPress={(e) => {
                                              if (
                                                e.key === 'Enter' &&
                                                editableContent.positiveComments.length < 4
                                              ) {
                                                const username =
                                                  document.getElementById(
                                                    'positive-username-input'
                                                  ).value;
                                                const comment =
                                                  document.getElementById(
                                                    'positive-comment-input'
                                                  ).value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [
                                                    ...editableContent.positiveComments,
                                                    { username, comment },
                                                  ];
                                                  setEditableContent({
                                                    ...editableContent,
                                                    positiveComments: newComments,
                                                  });
                                                  document.getElementById(
                                                    'positive-username-input'
                                                  ).value = '@';
                                                  document.getElementById(
                                                    'positive-postlink-input'
                                                  ).value = '';
                                                  document.getElementById(
                                                    'positive-comment-input'
                                                  ).value = '';
                                                }
                                              }
                                            }}
                                          />
                                        </Box>
                                        <TextField
                                          fullWidth
                                          placeholder="User comments"
                                          sx={{ mt: 2 }}
                                          id="positive-comment-input"
                                          disabled={editableContent.positiveComments.length >= 4}
                                          onKeyPress={(e) => {
                                            if (
                                              e.key === 'Enter' &&
                                              editableContent.positiveComments.length < 4
                                            ) {
                                              const username =
                                                document.getElementById(
                                                  'positive-username-input'
                                                ).value;
                                              const postlink =
                                                document.getElementById(
                                                  'positive-postlink-input'
                                                ).value;
                                              const comment =
                                                document.getElementById(
                                                  'positive-comment-input'
                                                ).value;

                                              if (username && username !== '@' && comment) {
                                                const newComments = [
                                                  ...editableContent.positiveComments,
                                                  { username, comment, postlink },
                                                ];
                                                setEditableContent({
                                                  ...editableContent,
                                                  positiveComments: newComments,
                                                });
                                                document.getElementById(
                                                  'positive-username-input'
                                                ).value = '@';
                                                document.getElementById(
                                                  'positive-postlink-input'
                                                ).value = '';
                                                document.getElementById(
                                                  'positive-comment-input'
                                                ).value = '';
                                              }
                                            }
                                          }}
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <IconButton
                                                  onClick={() => {
                                                    const username =
                                                      document.getElementById(
                                                        'positive-username-input'
                                                      ).value;
                                                    const comment =
                                                      document.getElementById(
                                                        'positive-comment-input'
                                                      ).value;

                                                    if (username && username !== '@' && comment) {
                                                      const newComments = [
                                                        ...editableContent.positiveComments,
                                                        { username, comment },
                                                      ];
                                                      setEditableContent({
                                                        ...editableContent,
                                                        positiveComments: newComments,
                                                      });
                                                      document.getElementById(
                                                        'positive-username-input'
                                                      ).value = '@';
                                                      document.getElementById(
                                                        'positive-postlink-input'
                                                      ).value = '';
                                                      document.getElementById(
                                                        'positive-comment-input'
                                                      ).value = '';
                                                    }
                                                  }}
                                                  disabled={
                                                    editableContent.positiveComments.length >= 4
                                                  }
                                                  edge="end"
                                                  sx={{
                                                    color: '#1ABF66',
                                                    '&:hover': {
                                                      backgroundColor: 'rgba(26, 191, 102, 0.08)',
                                                    },
                                                    '&.Mui-disabled': {
                                                      color: 'rgba(0, 0, 0, 0.12)',
                                                    },
                                                  }}
                                                >
                                                  <SendIcon />
                                                </IconButton>
                                              </InputAdornment>
                                            ),
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        {editableContent.positiveComments.length > 0 ? (
                                          <Grid container spacing={2}>
                                            {editableContent.positiveComments.map(
                                              (comment, index) => (
                                                <Grid item xs={12} sm={6} md={3} key={index}>
                                                  <Box
                                                    sx={{
                                                      p: 2,
                                                      bgcolor: '#F3F4F6',
                                                      borderRadius: '8px',
                                                    }}
                                                  >
                                                    <Link
                                                      href={comment.postlink || '#'}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      sx={{
                                                        textDecoration: 'none',
                                                        '&:hover': {
                                                          textDecoration: 'underline',
                                                        },
                                                      }}
                                                    >
                                                      <Typography
                                                        sx={{
                                                          fontFamily: 'Aileron',
                                                          fontSize: '12px',
                                                          fontWeight: 600,
                                                          color: '#6B7280',
                                                          mb: 1,
                                                          cursor: 'pointer',
                                                          '&:hover': {
                                                            color: '#1340FF',
                                                          },
                                                        }}
                                                      >
                                                        {comment.username}
                                                      </Typography>
                                                    </Link>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontSize: '14px',
                                                        color: '#374151',
                                                      }}
                                                    >
                                                      {comment.comment}
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              )
                                            )}
                                          </Grid>
                                        ) : null}
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              )}

                              {/* Neutral Comments */}
                              {(effectiveEditMode ||
                                editableContent.neutralComments.length > 0) && (
                                <Box sx={{ mb: 3, position: 'relative', mt: 3 }}>
                                  <Box
                                    sx={{
                                      p: 3,
                                      border: '2px solid #F59E0B',
                                      borderRadius: '12px',
                                      bgcolor: 'white',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '-10px',
                                        left: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        bgcolor: '#FEF3C7',
                                        px: 2,
                                        py: 0.5,
                                        borderRadius: '4px',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          fontFamily: 'Aileron',
                                          fontWeight: 600,
                                          fontSize: '14px',
                                          lineHeight: '18px',
                                          color: '#F59E0B',
                                        }}
                                      >
                                        Neutral Comments
                                      </Typography>
                                    </Box>
                                    {effectiveEditMode && !sectionEditStates.audienceSentiment ? (
                                      <>
                                        <Grid container spacing={2}>
                                          {editableContent.neutralComments.map((comment, index) => (
                                            <Grid item xs={12} sm={6} md={3} key={index}>
                                              <Box
                                                sx={{
                                                  p: 2,
                                                  bgcolor: '#F3F4F6',
                                                  borderRadius: '8px',
                                                  position: 'relative',
                                                }}
                                              >
                                                <IconButton
                                                  size="small"
                                                  onClick={() => {
                                                    const newComments =
                                                      editableContent.neutralComments.filter(
                                                        (_, i) => i !== index
                                                      );
                                                    setEditableContent({
                                                      ...editableContent,
                                                      neutralComments: newComments,
                                                    });
                                                  }}
                                                  sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    color: '#6B7280',
                                                  }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                                <Typography
                                                  sx={{
                                                    fontFamily: 'Aileron',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: '#6B7280',
                                                    mb: 1,
                                                  }}
                                                >
                                                  {comment.username}
                                                </Typography>
                                                <Typography
                                                  sx={{
                                                    fontFamily: 'Aileron',
                                                    fontSize: '14px',
                                                    color: '#374151',
                                                  }}
                                                >
                                                  {comment.comment}
                                                </Typography>
                                              </Box>
                                            </Grid>
                                          ))}
                                        </Grid>
                                        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                          <TextField
                                            placeholder="Social media username"
                                            sx={{ flex: 1 }}
                                            id="neutral-username-input"
                                            disabled={editableContent.neutralComments.length >= 4}
                                            defaultValue="@"
                                            onFocus={(e) => {
                                              if (e.target.value === '') {
                                                e.target.value = '@';
                                              }
                                            }}
                                            onChange={(e) => {
                                              let { value } = e.target;
                                              // Remove spaces
                                              value = value.replace(/\s/g, '');
                                              // Ensure it always starts with @
                                              if (!value.startsWith('@')) {
                                                value = `@${value}`;
                                              }
                                              // Prevent deleting the @
                                              if (value === '') {
                                                value = '@';
                                              }
                                              e.target.value = value;
                                            }}
                                            onKeyPress={(e) => {
                                              // Prevent space key
                                              if (e.key === ' ') {
                                                e.preventDefault();
                                              }
                                              if (
                                                e.key === 'Enter' &&
                                                editableContent.neutralComments.length < 4
                                              ) {
                                                const username =
                                                  document.getElementById(
                                                    'neutral-username-input'
                                                  ).value;
                                                const comment =
                                                  document.getElementById(
                                                    'neutral-comment-input'
                                                  ).value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [
                                                    ...editableContent.neutralComments,
                                                    { username, comment },
                                                  ];
                                                  setEditableContent({
                                                    ...editableContent,
                                                    neutralComments: newComments,
                                                  });
                                                  document.getElementById(
                                                    'neutral-username-input'
                                                  ).value = '@';
                                                  document.getElementById(
                                                    'neutral-postlink-input'
                                                  ).value = '';
                                                  document.getElementById(
                                                    'neutral-comment-input'
                                                  ).value = '';
                                                }
                                              }
                                            }}
                                          />
                                          <TextField
                                            placeholder="Post link"
                                            sx={{ flex: 1 }}
                                            id="neutral-postlink-input"
                                            disabled={editableContent.neutralComments.length >= 4}
                                            onKeyPress={(e) => {
                                              if (
                                                e.key === 'Enter' &&
                                                editableContent.neutralComments.length < 4
                                              ) {
                                                const username =
                                                  document.getElementById(
                                                    'neutral-username-input'
                                                  ).value;
                                                const comment =
                                                  document.getElementById(
                                                    'neutral-comment-input'
                                                  ).value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [
                                                    ...editableContent.neutralComments,
                                                    { username, comment },
                                                  ];
                                                  setEditableContent({
                                                    ...editableContent,
                                                    neutralComments: newComments,
                                                  });
                                                  document.getElementById(
                                                    'neutral-username-input'
                                                  ).value = '@';
                                                  document.getElementById(
                                                    'neutral-postlink-input'
                                                  ).value = '';
                                                  document.getElementById(
                                                    'neutral-comment-input'
                                                  ).value = '';
                                                }
                                              }
                                            }}
                                          />
                                        </Box>
                                        <TextField
                                          fullWidth
                                          placeholder="User comments"
                                          sx={{ mt: 2 }}
                                          id="neutral-comment-input"
                                          disabled={editableContent.neutralComments.length >= 4}
                                          onKeyPress={(e) => {
                                            if (
                                              e.key === 'Enter' &&
                                              editableContent.neutralComments.length < 4
                                            ) {
                                              const username =
                                                document.getElementById(
                                                  'neutral-username-input'
                                                ).value;
                                              const postlink =
                                                document.getElementById(
                                                  'neutral-postlink-input'
                                                ).value;
                                              const comment =
                                                document.getElementById(
                                                  'neutral-comment-input'
                                                ).value;

                                              if (username && username !== '@' && comment) {
                                                const newComments = [
                                                  ...editableContent.neutralComments,
                                                  { username, comment, postlink },
                                                ];
                                                setEditableContent({
                                                  ...editableContent,
                                                  neutralComments: newComments,
                                                });
                                                document.getElementById(
                                                  'neutral-username-input'
                                                ).value = '@';
                                                document.getElementById(
                                                  'neutral-postlink-input'
                                                ).value = '';
                                                document.getElementById(
                                                  'neutral-comment-input'
                                                ).value = '';
                                              }
                                            }
                                          }}
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <IconButton
                                                  onClick={() => {
                                                    const username =
                                                      document.getElementById(
                                                        'neutral-username-input'
                                                      ).value;
                                                    const comment =
                                                      document.getElementById(
                                                        'neutral-comment-input'
                                                      ).value;

                                                    if (username && username !== '@' && comment) {
                                                      const newComments = [
                                                        ...editableContent.neutralComments,
                                                        { username, comment },
                                                      ];
                                                      setEditableContent({
                                                        ...editableContent,
                                                        neutralComments: newComments,
                                                      });
                                                      document.getElementById(
                                                        'neutral-username-input'
                                                      ).value = '@';
                                                      document.getElementById(
                                                        'neutral-postlink-input'
                                                      ).value = '';
                                                      document.getElementById(
                                                        'neutral-comment-input'
                                                      ).value = '';
                                                    }
                                                  }}
                                                  disabled={
                                                    editableContent.neutralComments.length >= 4
                                                  }
                                                  edge="end"
                                                  sx={{
                                                    color: '#FF9800',
                                                    '&:hover': {
                                                      backgroundColor: 'rgba(255, 152, 0, 0.08)',
                                                    },
                                                    '&.Mui-disabled': {
                                                      color: 'rgba(0, 0, 0, 0.12)',
                                                    },
                                                  }}
                                                >
                                                  <SendIcon />
                                                </IconButton>
                                              </InputAdornment>
                                            ),
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        {editableContent.neutralComments.length > 0 ? (
                                          <Grid container spacing={2}>
                                            {editableContent.neutralComments.map(
                                              (comment, index) => (
                                                <Grid item xs={12} sm={6} md={3} key={index}>
                                                  <Box
                                                    sx={{
                                                      p: 2,
                                                      bgcolor: '#F3F4F6',
                                                      borderRadius: '8px',
                                                    }}
                                                  >
                                                    <Link
                                                      href={comment.postlink || '#'}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      sx={{
                                                        textDecoration: 'none',
                                                        '&:hover': {
                                                          textDecoration: 'underline',
                                                        },
                                                      }}
                                                    >
                                                      <Typography
                                                        sx={{
                                                          fontFamily: 'Aileron',
                                                          fontSize: '12px',
                                                          fontWeight: 600,
                                                          color: '#6B7280',
                                                          mb: 1,
                                                          cursor: 'pointer',
                                                          '&:hover': {
                                                            color: '#1340FF',
                                                          },
                                                        }}
                                                      >
                                                        {comment.username}
                                                      </Typography>
                                                    </Link>
                                                    <Typography
                                                      sx={{
                                                        fontFamily: 'Aileron',
                                                        fontSize: '14px',
                                                        color: '#374151',
                                                      }}
                                                    >
                                                      {comment.comment}
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              )
                                            )}
                                          </Grid>
                                        ) : null}
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </SortableSection>
                      );

                    case 'creatorTiers':
                      return (
                        <SortableSection
                          key="creatorTiers"
                          id="creatorTiers"
                          isEditMode={effectiveEditMode}
                        >
                          {/* Creator Tiers */}
                          <Box
                            className="pcr-section"
                            sx={{
                              mb: 2,
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '24px',
                              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <Box sx={{ mb: 2 }}>
                              <SectionHeader
                                title="Creator Tiers"
                                sectionKey="creatorTiers"
                                effectiveEditMode={effectiveEditMode}
                                sectionEditStates={sectionEditStates}
                                setSectionEditStates={setSectionEditStates}
                                sectionVisibility={sectionVisibility}
                                setSectionVisibility={setSectionVisibility}
                                handleSavePCR={handleSavePCR}
                                setIsSaving={setIsSaving}
                              />
                              {(() => {
                                if (effectiveEditMode && !sectionEditStates.creatorTiers) {
                                  return (
                                    <Box sx={{ position: 'relative', mb: 4 }}>
                                      <Box
                                        sx={{
                                          position: 'absolute',
                                          top: 12,
                                          left: 12,
                                          zIndex: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontFamily: 'Aileron',
                                            fontSize: '10px',
                                            fontWeight: 400,
                                            color: '#3A3A3C',
                                          }}
                                        >
                                          Editable
                                        </Typography>
                                      </Box>
                                      <Box sx={{ position: 'relative' }}>
                                        {/* Formatting Toolbar */}
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            zIndex: 2,
                                            display: 'flex',
                                            gap: 0.5,
                                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '4px',
                                            padding: '2px',
                                          }}
                                        >
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              const selection = window.getSelection();
                                              if (!selection.rangeCount) return;
                                              const range = selection.getRangeAt(0);
                                              const selectedText = range.toString();
                                              if (!selectedText) return;

                                              const editor = document.querySelector(
                                                '[data-creator-tiers-editor]'
                                              );
                                              if (editor) {
                                                editor.focus();
                                                document.execCommand('bold', false, null);
                                                const event = new Event('input', { bubbles: true });
                                                editor.dispatchEvent(event);
                                              }
                                            }}
                                            sx={{ width: 20, height: 20, color: '#636366' }}
                                          >
                                            <FormatBoldIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              const selection = window.getSelection();
                                              if (!selection.rangeCount) return;
                                              const range = selection.getRangeAt(0);
                                              const selectedText = range.toString();
                                              if (!selectedText) return;

                                              const editor = document.querySelector(
                                                '[data-creator-tiers-editor]'
                                              );
                                              if (editor) {
                                                editor.focus();
                                                document.execCommand('italic', false, null);
                                                const event = new Event('input', { bubbles: true });
                                                editor.dispatchEvent(event);
                                              }
                                            }}
                                            sx={{ width: 20, height: 20, color: '#636366' }}
                                          >
                                            <FormatItalicIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              const selection = window.getSelection();
                                              if (!selection.rangeCount) return;
                                              const range = selection.getRangeAt(0);
                                              const selectedText = range.toString();
                                              if (!selectedText) return;

                                              const editor = document.querySelector(
                                                '[data-creator-tiers-editor]'
                                              );
                                              if (editor) {
                                                editor.focus();
                                                document.execCommand('underline', false, null);
                                                const event = new Event('input', { bubbles: true });
                                                editor.dispatchEvent(event);
                                              }
                                            }}
                                            sx={{ width: 20, height: 20, color: '#636366' }}
                                          >
                                            <FormatUnderlinedIcon sx={{ fontSize: 14 }} />
                                          </IconButton>
                                        </Box>

                                        {/* Editable Content */}
                                        <Box
                                          ref={creatorTiersEditorRef}
                                          data-creator-tiers-editor
                                          contentEditable
                                          suppressContentEditableWarning
                                          onInput={(e) =>
                                            setEditableContent({
                                              ...editableContent,
                                              creatorTiersDescription: sanitizeReportHtml(
                                                e.currentTarget.innerHTML
                                              ),
                                            })
                                          }
                                          onKeyDown={(e) => {
                                            const isMod = e.metaKey || e.ctrlKey;
                                            if (isMod) {
                                              const editor = document.querySelector(
                                                '[data-creator-tiers-editor]'
                                              );
                                              if (e.key === 'b' || e.key === 'B') {
                                                e.preventDefault();
                                                document.execCommand('bold', false, null);
                                                if (editor) {
                                                  const event = new Event('input', {
                                                    bubbles: true,
                                                  });
                                                  editor.dispatchEvent(event);
                                                }
                                              } else if (e.key === 'i' || e.key === 'I') {
                                                e.preventDefault();
                                                document.execCommand('italic', false, null);
                                                if (editor) {
                                                  const event = new Event('input', {
                                                    bubbles: true,
                                                  });
                                                  editor.dispatchEvent(event);
                                                }
                                              } else if (e.key === 'u' || e.key === 'U') {
                                                e.preventDefault();
                                                document.execCommand('underline', false, null);
                                                if (editor) {
                                                  const event = new Event('input', {
                                                    bubbles: true,
                                                  });
                                                  editor.dispatchEvent(event);
                                                }
                                              }
                                            }
                                          }}
                                          onFocus={(e) => {
                                            // Set initial content if empty
                                            if (!e.currentTarget.innerHTML) {
                                              e.currentTarget.innerHTML =
                                                editableContent.creatorTiersDescription || '';
                                            }
                                          }}
                                          sx={{
                                            minHeight: '72px',
                                            padding: '8px',
                                            paddingTop: '26px',
                                            paddingRight: '80px',
                                            borderRadius: '8px',
                                            bgcolor: '#E5E7EB',
                                            outline: 'none',
                                            fontFamily: 'Aileron',
                                            fontWeight: 400,
                                            fontSize: '20px',
                                            lineHeight: '24px',
                                            color: '#231F20',
                                            whiteSpace: 'pre-wrap',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            '&:focus': {
                                              outline: '2px solid #1340FF',
                                            },
                                            '&:empty:before': {
                                              content: '"type here"',
                                              color: '#9CA3AF',
                                            },
                                            '& strong': {
                                              fontWeight: 700,
                                            },
                                            '& em': {
                                              fontStyle: 'italic',
                                            },
                                            '& u': {
                                              textDecoration: 'underline',
                                            },
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  );
                                }

                                if (editableContent.creatorTiersDescription) {
                                  return (
                                    <Box
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        color: '#231F20',
                                        mb: 4,
                                        whiteSpace: 'pre-wrap',
                                        '& strong': { fontWeight: 700 },
                                        '& em': { fontStyle: 'italic' },
                                        '& u': { textDecoration: 'underline' },
                                      }}
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeReportHtml(
                                          editableContent.creatorTiersDescription
                                        ),
                                      }}
                                    />
                                  );
                                }

                                return (
                                  <Box
                                    className="hide-in-pdf"
                                    sx={{
                                      bgcolor: '#E5E7EB',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      mb: 4,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        color: '#9CA3AF',
                                      }}
                                    >
                                      {isClientView
                                        ? 'No content'
                                        : 'Click Edit Report to edit Creator Tiers'}
                                    </Typography>
                                  </Box>
                                );
                              })()}

                              {/* Tier Table */}
                              {(() => {
                                // Calculate tier data from shortlisted creators (for credit tier campaigns)
                                const tierDataMap = new Map();

                                if (campaign?.isCreditTier && campaign?.shortlisted?.length > 0) {
                                  campaign.shortlisted.forEach((shortlisted) => {
                                    // Prefer shortlist snapshot, then creator/pitch tier (legacy rows may lack snapshot)
                                    const tier = getTierForShortlisted(shortlisted, campaign);
                                    if (tier) {
                                      const tierName = tier.name || 'Unknown';

                                      // Get engagement rates from all submissions/insights for this creator
                                      const userSubmissions = submissions.filter(
                                        (sub) => sub.userId === shortlisted.userId
                                      );
                                      const engagementRates = [];

                                      // Get ER from insights data
                                      userSubmissions.forEach((submission) => {
                                        const insightData = filteredInsightsData.find(
                                          (insight) => insight.submissionId === submission.id
                                        );

                                        if (insightData?.insight) {
                                          const er = calculateEngagementRate(insightData.insight);
                                          const erValue = parseFloat(er);
                                          if (!Number.isNaN(erValue) && erValue > 0) {
                                            engagementRates.push(erValue);
                                          }
                                        }
                                      });

                                      if (!tierDataMap.has(tierName)) {
                                        tierDataMap.set(tierName, {
                                          name: tierName,
                                          engagementRates: [],
                                        });
                                      }

                                      // Add all engagement rates for this creator to their tier
                                      tierDataMap
                                        .get(tierName)
                                        .engagementRates.push(...engagementRates);
                                    }
                                  });
                                }

                                // Calculate averages and sort by tier name
                                const tierData = Array.from(tierDataMap.values())
                                  .map((tier) => ({
                                    name: tier.name,
                                    averageEngagement:
                                      tier.engagementRates.length > 0
                                        ? (
                                            tier.engagementRates.reduce((a, b) => a + b, 0) /
                                            tier.engagementRates.length
                                          ).toFixed(1)
                                        : null,
                                  }))
                                  .sort((a, b) => {
                                    // Sort: Macro, Micro, Nano
                                    const order = { Macro: 1, Micro: 2, Nano: 3 };
                                    const aOrder = order[a.name.split(' ')[0]] || 999;
                                    const bOrder = order[b.name.split(' ')[0]] || 999;
                                    return aOrder - bOrder;
                                  });

                                if (tierData.length === 0) {
                                  return null;
                                }

                                return (
                                  <Box
                                    sx={{
                                      borderRadius: '16px',
                                      overflow: 'hidden',
                                      border: '1px solid #000000',
                                    }}
                                  >
                                    <Box
                                      component="table"
                                      sx={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                      }}
                                    >
                                      <Box
                                        component="thead"
                                        sx={{
                                          bgcolor: '#636366',
                                        }}
                                      >
                                        <Box
                                          component="tr"
                                          sx={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                          }}
                                        >
                                          <Box
                                            component="th"
                                            sx={{
                                              padding: '12px 16px',
                                              textAlign: 'center',
                                              fontFamily: 'Aileron',
                                              fontSize: '14px',
                                              fontWeight: 600,
                                              color: '#FFFFFF',
                                              borderRight: '1px solid #000000',
                                            }}
                                          >
                                            Tiers 📊
                                          </Box>
                                          <Box
                                            component="th"
                                            sx={{
                                              padding: '12px 16px',
                                              textAlign: 'center',
                                              fontFamily: 'Aileron',
                                              fontSize: '14px',
                                              fontWeight: 600,
                                              color: '#FFFFFF',
                                            }}
                                          >
                                            Average Engagement 🤝
                                          </Box>
                                        </Box>
                                      </Box>
                                      <Box component="tbody">
                                        {tierData.map((tier) => (
                                          <Box
                                            component="tr"
                                            key={tier.name}
                                            sx={{
                                              display: 'grid',
                                              gridTemplateColumns: '1fr 1fr',
                                              bgcolor: '#FFFFFF',
                                              borderTop: '1px solid #000000',
                                            }}
                                          >
                                            <Box
                                              component="td"
                                              sx={{
                                                padding: '12px 16px',
                                                fontFamily: 'Inter Display, sans-serif',
                                                fontSize: '14px',
                                                fontWeight: 400,
                                                color: '#231F20',
                                                borderRight: '1px solid #000000',
                                                textAlign: 'center',
                                              }}
                                            >
                                              {tier.name}
                                            </Box>
                                            <Box
                                              component="td"
                                              sx={{
                                                padding: '12px 16px',
                                                fontFamily: 'Inter Display, sans-serif',
                                                fontSize: '14px',
                                                fontWeight: 400,
                                                color: '#231F20',
                                                textAlign: 'center',
                                              }}
                                            >
                                              {tier.averageEngagement
                                                ? `${tier.averageEngagement}%`
                                                : '-'}
                                            </Box>
                                          </Box>
                                        ))}
                                      </Box>
                                    </Box>
                                  </Box>
                                );
                              })()}
                            </Box>
                          </Box>
                        </SortableSection>
                      );

                    case 'strategies':
                      return (
                        <SortableSection
                          key="strategies"
                          id="strategies"
                          isEditMode={effectiveEditMode}
                        >
                          {/* Strategies Utilised */}
                          <Box
                            className="pcr-section"
                            sx={{
                              mb: 2,
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '24px',
                              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <Box sx={{ mb: 6 }}>
                              <SectionHeader
                                title="Strategies Utilised"
                                sectionKey="strategies"
                                effectiveEditMode={effectiveEditMode}
                                sectionEditStates={sectionEditStates}
                                setSectionEditStates={setSectionEditStates}
                                sectionVisibility={sectionVisibility}
                                setSectionVisibility={setSectionVisibility}
                                handleSavePCR={handleSavePCR}
                                setIsSaving={setIsSaving}
                              />
                              <EditableDescriptionField
                                label="Creator Personas"
                                fieldKey="bestPerformingPersonasDescription"
                                hydrationVersion={hydrationVersion}
                                isEditingSection={
                                  effectiveEditMode && !sectionEditStates.strategies
                                }
                                value={editableContent.bestPerformingPersonasDescription}
                                onChange={(v) =>
                                  setEditableContent({
                                    ...editableContent,
                                    bestPerformingPersonasDescription: v,
                                  })
                                }
                                rows={3}
                                mb={4}
                                isClientView={isClientView}
                                badgeSx={{ top: 12, left: 12, py: 0.5, borderRadius: '4px' }}
                                textFieldSx={{ border: 'none' }}
                                readOnlySx={{ color: '#374151' }}
                              />
                              {/* Creator Persona Cards */}
                              {effectiveEditMode && !sectionEditStates.strategies ? (
                                // Edit Mode: Grid layout with cards on left, chart on right
                                <Grid container spacing={2}>
                                  {/* Left side - Persona Cards stacked vertically */}
                                  <Grid item xs={12} md={7}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3,
                                        ml: 7,
                                        width: '100%',
                                        minWidth: 0,
                                        overflow: 'visible',
                                      }}
                                    >
                                      {/* The Comic Card */}
                                      <PersonaCardEdit
                                        titleField="comicTitle"
                                        emojiField="comicEmoji"
                                        contentField="comicContentStyle"
                                        countField="creatorStrategyCount"
                                        color="linear-gradient(135deg, #1340FF 0%, #1340FF 100%)"
                                        wide={false}
                                        editableContent={editableContent}
                                        setEditableContent={setEditableContent}
                                        onEmojiClick={(e) => {
                                          setEmojiPickerAnchor(e.currentTarget);
                                          setEmojiPickerType('comic');
                                        }}
                                      />

                                      {/* Educator Card - Show below comic card when visible */}
                                      {showEducatorCard && (
                                        <PersonaCardEdit
                                          titleField="educatorTitle"
                                          emojiField="educatorEmoji"
                                          contentField="educatorContentStyle"
                                          countField="educatorCreatorCount"
                                          color="#8A5AFE"
                                          wide={false}
                                          editableContent={editableContent}
                                          setEditableContent={setEditableContent}
                                          onEmojiClick={(e) => {
                                            setEmojiPickerAnchor(e.currentTarget);
                                            setEmojiPickerType('educator');
                                          }}
                                          onDelete={() => {
                                            // If third card exists, move its data to educator position
                                            if (showThirdCard) {
                                              setEditableContent({
                                                ...editableContent,
                                                educatorTitle: editableContent.thirdTitle,
                                                educatorContentStyle:
                                                  editableContent.thirdContentStyle,
                                                educatorCreatorCount:
                                                  editableContent.thirdCreatorCount,
                                                educatorEmoji: editableContent.thirdEmoji,
                                                thirdTitle: '',
                                                thirdContentStyle: '',
                                                thirdCreatorCount: '',
                                                thirdEmoji: '',
                                              });
                                              setShowThirdCard(false);
                                            } else {
                                              setShowEducatorCard(false);
                                              setEditableContent({
                                                ...editableContent,
                                                educatorTitle: '',
                                                educatorContentStyle: '',
                                                educatorCreatorCount: '',
                                                educatorEmoji: '',
                                              });
                                            }
                                          }}
                                        />
                                      )}

                                      {/* Third Persona Card - Only show if showThirdCard is true */}
                                      {showThirdCard && (
                                        <PersonaCardEdit
                                          titleField="thirdTitle"
                                          emojiField="thirdEmoji"
                                          contentField="thirdContentStyle"
                                          countField="thirdCreatorCount"
                                          color="linear-gradient(135deg, #FF3500 0%, #FF3500 100%)"
                                          wide
                                          editableContent={editableContent}
                                          setEditableContent={setEditableContent}
                                          onEmojiClick={(e) => {
                                            setEmojiPickerAnchor(e.currentTarget);
                                            setEmojiPickerType('third');
                                          }}
                                          onDelete={() => {
                                            setShowThirdCard(false);
                                            setEditableContent({
                                              ...editableContent,
                                              thirdTitle: '',
                                              thirdContentStyle: '',
                                              thirdCreatorCount: '',
                                              thirdEmoji: '',
                                            });
                                          }}
                                        />
                                      )}

                                      {/* Fourth Persona Card - Only show if showFourthCard is true */}
                                      {showFourthCard && (
                                        <PersonaCardEdit
                                          titleField="fourthTitle"
                                          emojiField="fourthEmoji"
                                          contentField="fourthContentStyle"
                                          countField="fourthCreatorCount"
                                          color="linear-gradient(135deg, #D8FF01 0%, #D8FF01 100%)"
                                          wide
                                          editableContent={editableContent}
                                          setEditableContent={setEditableContent}
                                          onEmojiClick={(e) => {
                                            setEmojiPickerAnchor(e.currentTarget);
                                            setEmojiPickerType('fourth');
                                          }}
                                          onDelete={() => {
                                            setShowFourthCard(false);
                                            setEditableContent({
                                              ...editableContent,
                                              fourthTitle: '',
                                              fourthContentStyle: '',
                                              fourthCreatorCount: '',
                                              fourthEmoji: '',
                                            });
                                          }}
                                        />
                                      )}

                                      {/* Fifth Persona Card - Only show if showFifthCard is true */}
                                      {showFifthCard && (
                                        <PersonaCardEdit
                                          titleField="fifthTitle"
                                          emojiField="fifthEmoji"
                                          contentField="fifthContentStyle"
                                          countField="fifthCreatorCount"
                                          color="linear-gradient(135deg, #026D54 0%, #026D54 100%)"
                                          wide
                                          editableContent={editableContent}
                                          setEditableContent={setEditableContent}
                                          onEmojiClick={(e) => {
                                            setEmojiPickerAnchor(e.currentTarget);
                                            setEmojiPickerType('fifth');
                                          }}
                                          onDelete={() => {
                                            setShowFifthCard(false);
                                            setEditableContent({
                                              ...editableContent,
                                              fifthTitle: '',
                                              fifthContentStyle: '',
                                              fifthCreatorCount: '',
                                              fifthEmoji: '',
                                            });
                                          }}
                                        />
                                      )}

                                      {/* Add Persona Button - Show when there are less than 5 cards */}
                                      {(!showEducatorCard ||
                                        !showThirdCard ||
                                        !showFourthCard ||
                                        !showFifthCard) && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            mt: 3,
                                            ml: 2,
                                          }}
                                        >
                                          <IconButton
                                            onClick={() => {
                                              if (!showEducatorCard) {
                                                setShowEducatorCard(true);
                                              } else if (!showThirdCard) {
                                                setShowThirdCard(true);
                                              } else if (!showFourthCard) {
                                                setShowFourthCard(true);
                                              } else if (!showFifthCard) {
                                                setShowFifthCard(true);
                                              }
                                            }}
                                            sx={{
                                              width: '140px',
                                              height: '140px',
                                              bgcolor: '#F5F5F5',
                                              borderRadius: '50%',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              '&:hover': {
                                                bgcolor: '#E8E8E8',
                                              },
                                            }}
                                          >
                                            <svg
                                              width="80"
                                              height="80"
                                              viewBox="0 0 80 80"
                                              fill="none"
                                            >
                                              <rect
                                                x="32"
                                                y="8"
                                                width="16"
                                                height="64"
                                                rx="8"
                                                fill="#1340FF"
                                              />
                                              <rect
                                                x="8"
                                                y="32"
                                                width="64"
                                                height="16"
                                                rx="8"
                                                fill="#1340FF"
                                              />
                                            </svg>
                                          </IconButton>
                                        </Box>
                                      )}
                                    </Box>
                                  </Grid>

                                  {/* Right side - Creator Strategy Breakdown Chart */}
                                  <CreatorStrategyChartEdit
                                    editableContent={editableContent}
                                    showEducatorCard={showEducatorCard}
                                    showThirdCard={showThirdCard}
                                    showFourthCard={showFourthCard}
                                    showFifthCard={showFifthCard}
                                  />
                                </Grid>
                              ) : (
                                // Non-edit Mode: Conditional layout based on number of personas
                                <Grid container spacing={2}>
                                  {/* Left side - Persona Cards */}
                                  <Grid item xs={12} md={7}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3,
                                        ml: 10,
                                      }}
                                    >
                                      {/* The Comic Card */}
                                      {editableContent.comicTitle && (
                                        <PersonaCardDisplay
                                          titleField="comicTitle"
                                          emojiField="comicEmoji"
                                          contentField="comicContentStyle"
                                          color="linear-gradient(135deg, #1340FF 0%, #1340FF 100%)"
                                          wide={false}
                                          editableContent={editableContent}
                                        />
                                      )}

                                      {/* The Educator Card - Only show if showEducatorCard is true */}
                                      {showEducatorCard && (
                                        <PersonaCardDisplay
                                          titleField="educatorTitle"
                                          emojiField="educatorEmoji"
                                          contentField="educatorContentStyle"
                                          color="#8A5AFE"
                                          wide={false}
                                          editableContent={editableContent}
                                        />
                                      )}

                                      {/* The Third Card - Only show if showThirdCard is true */}
                                      {showThirdCard && (
                                        <PersonaCardDisplay
                                          titleField="thirdTitle"
                                          emojiField="thirdEmoji"
                                          contentField="thirdContentStyle"
                                          color="linear-gradient(135deg, #FF3500 0%, #FF3500 100%)"
                                          wide
                                          editableContent={editableContent}
                                        />
                                      )}

                                      {/* Fourth Persona Card (Display Mode) - Only show if showFourthCard is true */}
                                      {showFourthCard && editableContent.fourthTitle && (
                                        <PersonaCardDisplay
                                          titleField="fourthTitle"
                                          emojiField="fourthEmoji"
                                          contentField="fourthContentStyle"
                                          color="linear-gradient(135deg, #D8FF01 0%, #D8FF01 100%)"
                                          wide
                                          editableContent={editableContent}
                                        />
                                      )}

                                      {/* Fifth Persona Card (Display Mode) - Only show if showFifthCard is true */}
                                      {showFifthCard && editableContent.fifthTitle && (
                                        <PersonaCardDisplay
                                          titleField="fifthTitle"
                                          emojiField="fifthEmoji"
                                          contentField="fifthContentStyle"
                                          color="linear-gradient(135deg, #026D54 0%, #026D54 100%)"
                                          wide
                                          editableContent={editableContent}
                                        />
                                      )}
                                    </Box>
                                  </Grid>

                                  {/* Right side - Creator Strategy Breakdown Chart (Display mode) */}
                                  <CreatorStrategyChartDisplay
                                    editableContent={editableContent}
                                    showEducatorCard={showEducatorCard}
                                    showThirdCard={showThirdCard}
                                    showFourthCard={showFourthCard}
                                    showFifthCard={showFifthCard}
                                  />
                                </Grid>
                              )}
                            </Box>
                          </Box>
                        </SortableSection>
                      );

                    case 'recommendations':
                      return (
                        <SortableSection
                          key="recommendations"
                          id="recommendations"
                          isEditMode={effectiveEditMode}
                        >
                          {/* Recommendations Section */}
                          <Box
                            className="pcr-section"
                            sx={{
                              mb: 2,
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              padding: '24px',
                              boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                            }}
                          >
                            <Box sx={{ mb: 4 }}>
                              <SectionHeader
                                title="Recommendations"
                                sectionKey="recommendations"
                                effectiveEditMode={effectiveEditMode}
                                sectionEditStates={sectionEditStates}
                                setSectionEditStates={setSectionEditStates}
                                sectionVisibility={sectionVisibility}
                                setSectionVisibility={setSectionVisibility}
                                handleSavePCR={handleSavePCR}
                                setIsSaving={setIsSaving}
                                mb={3}
                              />

                              {/* Headers Row */}
                              <Grid container spacing={3} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={4}>
                                  <Box
                                    sx={{
                                      background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
                                      borderRadius: '12px 12px 0 0',
                                      p: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src="/assets/icons/pcr/rewarded_ads.svg"
                                      alt="Rewarded ads icon"
                                      sx={{ width: '24px', height: '24px' }}
                                    />
                                    <Typography
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 700,
                                        fontSize: '18px',
                                        color: 'white',
                                        textAlign: 'center',
                                      }}
                                    >
                                      What Worked Well
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                  <Box
                                    sx={{
                                      bgcolor: '#1340FF',
                                      borderRadius: '12px 12px 0 0',
                                      p: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src="/assets/icons/pcr/problem.svg"
                                      alt="Problem icon"
                                      sx={{ width: '24px', height: '24px' }}
                                    />
                                    <Typography
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 700,
                                        fontSize: '18px',
                                        color: 'white',
                                        textAlign: 'center',
                                      }}
                                    >
                                      What Could Be Improved
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                  <Box
                                    sx={{
                                      bgcolor: '#026D54',
                                      borderRadius: '12px 12px 0 0',
                                      p: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <Box
                                      component="img"
                                      src="/assets/icons/pcr/ads_click.svg"
                                      alt="Ads click icon"
                                      sx={{ width: '24px', height: '24px' }}
                                    />
                                    <Typography
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 700,
                                        fontSize: '18px',
                                        color: 'white',
                                        textAlign: 'center',
                                      }}
                                    >
                                      What To Do Next
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>

                              {/* Empty State Row */}
                              {editableContent.workedWellInsights.length === 0 &&
                                editableContent.improvedInsights.length === 0 &&
                                editableContent.nextStepsInsights.length === 0 &&
                                !effectiveEditMode && (
                                  <Grid container spacing={3} sx={{ mb: 2 }}>
                                    <Grid item xs={12} md={4}>
                                      <Box
                                        className="hide-in-pdf"
                                        sx={{
                                          background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
                                          p: 3,
                                          color: 'white',
                                          height: '120px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '0 0 12px 12px',
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontFamily: 'Aileron',
                                            fontSize: '20px',
                                            opacity: 0.8,
                                          }}
                                        >
                                          {isClientView
                                            ? 'No content'
                                            : 'Click Edit Report to edit What Worked Well'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Box
                                        className="hide-in-pdf"
                                        sx={{
                                          bgcolor: '#1340FFD9',
                                          p: 3,
                                          color: 'white',
                                          height: '120px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '0 0 12px 12px',
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontFamily: 'Aileron',
                                            fontSize: '20px',
                                            opacity: 0.8,
                                          }}
                                        >
                                          {isClientView
                                            ? 'No content'
                                            : 'Click Edit Report to edit What Can Be Improved'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Box
                                        className="hide-in-pdf"
                                        sx={{
                                          bgcolor: '#026D54D9',
                                          p: 3,
                                          color: 'white',
                                          height: '120px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '0 0 12px 12px',
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontFamily: 'Aileron',
                                            fontSize: '20px',
                                            opacity: 0.9,
                                          }}
                                        >
                                          {isClientView
                                            ? 'No content'
                                            : 'Click Edit Report to edit Next Steps'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                )}

                              {/* Insight Rows */}
                              {Array.from({
                                length: Math.max(
                                  editableContent.workedWellInsights.length,
                                  editableContent.improvedInsights.length,
                                  editableContent.nextStepsInsights.length
                                ),
                              }).map((_, rowIndex) => (
                                <Grid container spacing={3} sx={{ mb: 1 }} key={`row-${rowIndex}`}>
                                  {/* Left Column - What Worked Well */}
                                  <Grid item xs={12} md={4}>
                                    {editableContent.workedWellInsights[rowIndex] !== undefined && (
                                      <Box
                                        sx={{
                                          background: getWorkedWellInsightBgColor(rowIndex),
                                          opacity: getWorkedWellOpacity(rowIndex),
                                          px: 2,
                                          py: 1.5,
                                          color: 'white',
                                          minHeight: '120px',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          borderRadius:
                                            rowIndex ===
                                            editableContent.workedWellInsights.length - 1
                                              ? '0 0 12px 12px'
                                              : 0,
                                          position: 'relative',
                                        }}
                                      >
                                        {effectiveEditMode && !sectionEditStates.recommendations ? (
                                          <Box
                                            sx={{
                                              bgcolor: '#E5E7EB',
                                              borderRadius: '12px',
                                              p: 2,
                                              flex: 1,
                                              display: 'flex',
                                              gap: 0.5,
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                position: 'relative',
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  mb: 0.5,
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    fontFamily: 'Aileron',
                                                    fontSize: '10px',
                                                    fontWeight: 400,
                                                    color: '#3A3A3C',
                                                  }}
                                                >
                                                  Editable
                                                </Typography>
                                              </Box>
                                              <TextField
                                                value={editableContent.workedWellInsights[rowIndex]}
                                                onChange={(e) => {
                                                  const newValue = e.target.value;
                                                  const newInsights = [
                                                    ...editableContent.workedWellInsights,
                                                  ];
                                                  newInsights[rowIndex] = newValue;
                                                  setEditableContent((prev) => ({
                                                    ...prev,
                                                    workedWellInsights: newInsights,
                                                  }));
                                                }}
                                                onPaste={(e) => {
                                                  e.stopPropagation();
                                                }}
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                maxRows={10}
                                                sx={{
                                                  '& .MuiInputBase-root': {
                                                    fontFamily: 'Aileron',
                                                    fontSize: '12px',
                                                    lineHeight: '18px',
                                                    color: '#000000',
                                                    padding: 0,
                                                  },
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    border: 'none',
                                                  },
                                                }}
                                              />
                                            </Box>
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                const newInsights =
                                                  editableContent.workedWellInsights.filter(
                                                    (__, i) => i !== rowIndex
                                                  );
                                                setEditableContent({
                                                  ...editableContent,
                                                  workedWellInsights: newInsights,
                                                });
                                              }}
                                              sx={{ color: '#000000', alignSelf: 'flex-start' }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ) : (
                                          <Typography
                                            sx={{
                                              fontFamily: 'Aileron',
                                              fontSize: '14px',
                                              lineHeight: '20px',
                                              wordWrap: 'break-word',
                                              overflowWrap: 'break-word',
                                              wordBreak: 'break-word',
                                              whiteSpace: 'pre-line',
                                            }}
                                          >
                                            {editableContent.workedWellInsights[rowIndex]}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </Grid>

                                  {/* Middle Column - What Could Be Improved */}
                                  <Grid item xs={12} md={4}>
                                    {editableContent.improvedInsights[rowIndex] !== undefined && (
                                      <Box
                                        sx={{
                                          bgcolor: getImprovedInsightBgColor(rowIndex),
                                          px: 2,
                                          py: 1.5,
                                          color: 'white',
                                          minHeight: '120px',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          borderRadius:
                                            rowIndex === editableContent.improvedInsights.length - 1
                                              ? '0 0 12px 12px'
                                              : 0,
                                          position: 'relative',
                                        }}
                                      >
                                        {effectiveEditMode && !sectionEditStates.recommendations ? (
                                          <Box
                                            sx={{
                                              bgcolor: '#E5E7EB',
                                              borderRadius: '12px',
                                              p: 2,
                                              flex: 1,
                                              display: 'flex',
                                              gap: 0.5,
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                position: 'relative',
                                                flex: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  mb: 0.5,
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    fontFamily: 'Aileron',
                                                    fontSize: '10px',
                                                    fontWeight: 400,
                                                    color: '#3A3A3C',
                                                  }}
                                                >
                                                  Editable
                                                </Typography>
                                              </Box>
                                              <TextField
                                                value={editableContent.improvedInsights[rowIndex]}
                                                onChange={(e) => {
                                                  const newValue = e.target.value;
                                                  const newInsights = [
                                                    ...editableContent.improvedInsights,
                                                  ];
                                                  newInsights[rowIndex] = newValue;
                                                  setEditableContent((prev) => ({
                                                    ...prev,
                                                    improvedInsights: newInsights,
                                                  }));
                                                }}
                                                onPaste={(e) => {
                                                  e.stopPropagation();
                                                }}
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                maxRows={10}
                                                sx={{
                                                  '& .MuiInputBase-root': {
                                                    fontFamily: 'Aileron',
                                                    fontSize: '12px',
                                                    lineHeight: '18px',
                                                    color: '#000000',
                                                    padding: 0,
                                                  },
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    border: 'none',
                                                  },
                                                }}
                                              />
                                            </Box>
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                const newInsights =
                                                  editableContent.improvedInsights.filter(
                                                    (__, i) => i !== rowIndex
                                                  );
                                                setEditableContent({
                                                  ...editableContent,
                                                  improvedInsights: newInsights,
                                                });
                                              }}
                                              sx={{ color: '#000000', alignSelf: 'flex-start' }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ) : (
                                          <Typography
                                            sx={{
                                              fontFamily: 'Aileron',
                                              fontSize: '14px',
                                              lineHeight: '20px',
                                              wordWrap: 'break-word',
                                              overflowWrap: 'break-word',
                                              wordBreak: 'break-word',
                                              whiteSpace: 'pre-line',
                                            }}
                                          >
                                            {editableContent.improvedInsights[rowIndex]}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </Grid>

                                  {/* Right Column - What To Do Next */}
                                  <Grid item xs={12} md={4}>
                                    {editableContent.nextStepsInsights[rowIndex] !== undefined && (
                                      <Box
                                        sx={{
                                          bgcolor: rowIndex === 0 ? '#026D54D9' : '#026D54BF',
                                          px: 2,
                                          py: 1.5,
                                          color: 'white',
                                          minHeight: '120px',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          borderRadius:
                                            rowIndex ===
                                            editableContent.nextStepsInsights.length - 1
                                              ? '0 0 12px 12px'
                                              : 0,
                                          position: 'relative',
                                        }}
                                      >
                                        {effectiveEditMode && !sectionEditStates.recommendations ? (
                                          <Box
                                            sx={{
                                              bgcolor: '#E5E7EB',
                                              borderRadius: '12px',
                                              p: 2.5,
                                              px: 1,
                                              flex: 1,
                                              display: 'flex',
                                              gap: 0.5,
                                            }}
                                          >
                                            <Box sx={{ position: 'relative', flex: 1 }}>
                                              <Box
                                                sx={{
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  zIndex: 1,
                                                }}
                                              >
                                                <Typography
                                                  sx={{
                                                    fontFamily: 'Aileron',
                                                    fontSize: '10px',
                                                    fontWeight: 400,
                                                    color: '#3A3A3C',
                                                  }}
                                                >
                                                  Editable
                                                </Typography>
                                              </Box>
                                              <TextField
                                                value={editableContent.nextStepsInsights[rowIndex]}
                                                onChange={(e) => {
                                                  const newValue = e.target.value;
                                                  const newInsights = [
                                                    ...editableContent.nextStepsInsights,
                                                  ];
                                                  newInsights[rowIndex] = newValue;
                                                  setEditableContent((prev) => ({
                                                    ...prev,
                                                    nextStepsInsights: newInsights,
                                                  }));
                                                }}
                                                onPaste={(e) => {
                                                  e.stopPropagation();
                                                }}
                                                fullWidth
                                                multiline
                                                minRows={2}
                                                maxRows={10}
                                                sx={{
                                                  mt: 1.5,
                                                  '& .MuiInputBase-root': {
                                                    fontFamily: 'Aileron',
                                                    fontSize: '12px',
                                                    lineHeight: '18px',
                                                    color: '#000000',
                                                    padding: 0,
                                                  },
                                                  '& .MuiOutlinedInput-notchedOutline': {
                                                    border: 'none',
                                                  },
                                                }}
                                              />
                                            </Box>
                                            <IconButton
                                              size="small"
                                              onClick={() => {
                                                const newInsights =
                                                  editableContent.nextStepsInsights.filter(
                                                    (__, i) => i !== rowIndex
                                                  );
                                                setEditableContent({
                                                  ...editableContent,
                                                  nextStepsInsights: newInsights,
                                                });
                                              }}
                                              sx={{ color: '#000000', alignSelf: 'flex-start' }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ) : (
                                          <Typography
                                            sx={{
                                              fontFamily: 'Aileron',
                                              fontSize: '14px',
                                              lineHeight: '20px',
                                              wordWrap: 'break-word',
                                              overflowWrap: 'break-word',
                                              wordBreak: 'break-word',
                                              whiteSpace: 'pre-line',
                                            }}
                                          >
                                            {editableContent.nextStepsInsights[rowIndex]}
                                          </Typography>
                                        )}
                                      </Box>
                                    )}
                                  </Grid>
                                </Grid>
                              ))}

                              {/* Add Buttons Row */}
                              {effectiveEditMode && (
                                <Grid container spacing={3} sx={{ mb: 6 }}>
                                  <Grid item xs={12} md={4}>
                                    {editableContent.workedWellInsights.length < 3 && (
                                      <IconButton
                                        onClick={() => {
                                          setEditableContent({
                                            ...editableContent,
                                            workedWellInsights: [
                                              ...editableContent.workedWellInsights,
                                              '',
                                            ],
                                          });
                                        }}
                                        sx={{
                                          background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
                                          color: 'white',
                                          '&:hover': {
                                            background: 'linear-gradient(0deg, #7A4AEE, #7A4AEE)',
                                          },
                                          borderRadius: '12px',
                                          width: '44px',
                                          height: '44px',
                                          fontSize: '36px',
                                          fontWeight: 300,
                                        }}
                                      >
                                        +
                                      </IconButton>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    {editableContent.improvedInsights.length < 3 && (
                                      <IconButton
                                        onClick={() => {
                                          setEditableContent({
                                            ...editableContent,
                                            improvedInsights: [
                                              ...editableContent.improvedInsights,
                                              '',
                                            ],
                                          });
                                        }}
                                        sx={{
                                          bgcolor: '#1340FF',
                                          color: 'white',
                                          '&:hover': { bgcolor: '#0D2FCC' },
                                          borderRadius: '12px',
                                          width: '44px',
                                          height: '44px',
                                          fontSize: '36px',
                                          fontWeight: 300,
                                        }}
                                      >
                                        +
                                      </IconButton>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    {editableContent.nextStepsInsights.length < 3 && (
                                      <IconButton
                                        onClick={() => {
                                          setEditableContent({
                                            ...editableContent,
                                            nextStepsInsights: [
                                              ...editableContent.nextStepsInsights,
                                              '',
                                            ],
                                          });
                                        }}
                                        sx={{
                                          bgcolor: '#026D54',
                                          color: 'white',
                                          '&:hover': { bgcolor: '#015D44' },
                                          borderRadius: '12px',
                                          width: '44px',
                                          height: '44px',
                                          fontSize: '36px',
                                          fontWeight: 300,
                                        }}
                                      >
                                        +
                                      </IconButton>
                                    )}
                                  </Grid>
                                </Grid>
                              )}
                            </Box>
                          </Box>
                        </SortableSection>
                      );

                    default:
                      return null;
                  }
                })}
              </SortableContext>
            </DndContext>
          </Box>

          {/* Emoji Picker Popover */}
          <CustomEmojiPicker
            anchor={emojiPickerAnchor}
            onClose={() => {
              setEmojiPickerAnchor(null);
              setEmojiPickerType(null);
            }}
            onPick={(emojiObject) => {
              if (emojiPickerType === 'comic') {
                setEditableContent({ ...editableContent, comicEmoji: emojiObject.emoji });
              } else if (emojiPickerType === 'educator') {
                setEditableContent({ ...editableContent, educatorEmoji: emojiObject.emoji });
              } else if (emojiPickerType === 'third') {
                setEditableContent({ ...editableContent, thirdEmoji: emojiObject.emoji });
              } else if (emojiPickerType === 'fourth') {
                setEditableContent({ ...editableContent, fourthEmoji: emojiObject.emoji });
              } else if (emojiPickerType === 'fifth') {
                setEditableContent({ ...editableContent, fifthEmoji: emojiObject.emoji });
              }
            }}
          />

          {/* Preview Modal */}
          <ReportReviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            previewImages={previewImages}
          />
        </Box>
      </Box>
    </>
  );
};

PCRReportPage.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    isCreditTier: PropTypes.bool,
    isPCRReady: PropTypes.bool,
    campaignBrief: PropTypes.shape({
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      postingStartDate: PropTypes.string,
      postingEndDate: PropTypes.string,
    }),
    submission: PropTypes.array,
    pitch: PropTypes.array,
    shortlisted: PropTypes.arrayOf(
      PropTypes.shape({
        creditTier: PropTypes.string,
      })
    ),
  }),
  onBack: PropTypes.func.isRequired,
  isClientView: PropTypes.bool,
  onCampaignUpdate: PropTypes.func,
};

export default PCRReportPage;
