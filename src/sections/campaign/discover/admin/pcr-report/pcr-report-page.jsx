import useSWR from 'swr';
import axios from 'axios';
// eslint-disable-next-line new-cap
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { CSS } from '@dnd-kit/utilities';
import { enqueueSnackbar } from 'notistack';
import EmojiPicker from 'emoji-picker-react';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useSensor, DndContext, useSensors, closestCenter, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, useSortable, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import { Box, Grid, Link, Button, Avatar, Dialog, Popover, TextField, Typography, IconButton, DialogTitle, DialogContent, InputAdornment, CircularProgress } from '@mui/material';

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

import Iconify from 'src/components/iconify';

import usePcrData from './hooks/usePcrData';
import usePcrExport from './hooks/usePcrExport';
import usePcrHistory from './hooks/usePcrHistory';
import PersonaCardEdit from './charts/StrategiesCardEdit';
import TopEngagementCard from './charts/TopEngagementCard';
import PersonaCardDisplay from './charts/StrategiesDisplay';
import TopCreatorViewsChart from './charts/TopCreatorViewsChart';
import EngagementRateHeatmap from './charts/EngagementRateHeatmap';
import TopCreatorViews48HChart from './charts/TopCreatorViews48HChart';
import CreatorStrategyChartEdit from './charts/CreatorStrategyChartEdit';
import PlatformInteractionsChart from './charts/PlatformInteractionsChart';
import CreatorStrategyChartDisplay from './charts/CreatorStrategyChartDisplay';

const getImprovedInsightBgColor = (index) => {
  if (index === 0) return '#1340FFD9';
  if (index === 1) return '#1340FFBF';
  return '#1340FFA6';
};

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

const SortableSection = ({ id, children, isEditMode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isEditMode,
  });

  const style = {
    transform: isDragging
      ? `${CSS.Transform.toString(transform)} scale(0.95)`
      : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const handlePointerDown = (e) => {
    const { target } = e;
    const tagName = target.tagName.toLowerCase();
    if (
      tagName === 'button' ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'a' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a') ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]') ||
      target.onclick ||
      target.closest('[onclick]') ||
      window.getComputedStyle(target).cursor === 'pointer'
    ) {
      e.stopPropagation();
      return;
    }

    // Allow drag for other elements
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={isEditMode ? handlePointerDown : undefined}
      sx={{
        cursor: isEditMode ? 'grab' : 'default',
        '&:active': {
          cursor: isEditMode ? 'grabbing' : 'default',
        },
        '& button, & input, & textarea, & a, & [contenteditable="true"]': {
          cursor: 'pointer !important',
        },
        '& input, & textarea': {
          cursor: 'text !important',
        },
      }}
    >
      {children}
    </Box>
  );
};

SortableSection.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isEditMode: PropTypes.bool.isRequired,
};

// Formatted Text Field Component
const FormattedTextField = ({ value, onChange, placeholder, rows = 3, sx = {} }) => {
  const editorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = value || '';
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const applyFormat = (formatType) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText) return;

    // Save the current selection
    const { startContainer } = range;
    const { startOffset } = range;
    const { endContainer } = range;
    const { endOffset } = range;

    try {
      // Use execCommand for better browser compatibility
      // Even though deprecated, it still works reliably across browsers
      let command;
      if (formatType === 'bold') {
        command = 'bold';
      } else if (formatType === 'italic') {
        command = 'italic';
      } else if (formatType === 'underline') {
        command = 'underline';
      }

      // Focus the editor first
      if (editorRef.current) {
        editorRef.current.focus();
      }

      // Restore selection
      const newRange = document.createRange();
      newRange.setStart(startContainer, startOffset);
      newRange.setEnd(endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Apply formatting
      document.execCommand(command, false, null);

      // Update the value
      if (editorRef.current) {
        onChange({ target: { value: editorRef.current.innerHTML } });
      }

      // Keep selection for potential additional formatting
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 0);
    } catch (error) {
      console.error('Error applying format:', error);

      // Fallback to manual DOM manipulation
      let formattedElement;
      if (formatType === 'bold') {
        formattedElement = document.createElement('strong');
      } else if (formatType === 'italic') {
        formattedElement = document.createElement('em');
      } else if (formatType === 'underline') {
        formattedElement = document.createElement('u');
      }

      formattedElement.textContent = selectedText;
      range.deleteContents();
      range.insertNode(formattedElement);

      // Move cursor after the inserted element
      const newRange = document.createRange();
      newRange.setStartAfter(formattedElement);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Update the value
      if (editorRef.current) {
        onChange({ target: { value: editorRef.current.innerHTML } });
      }
    }
  };

  const handleInput = (e) => {
    onChange({ target: { value: e.currentTarget.innerHTML } });
  };

  const handleKeyDown = (e) => {
    // Check for Cmd (Mac) or Ctrl (Windows/Linux)
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyFormat('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyFormat('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        applyFormat('underline');
      }
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Formatting Toolbar */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
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
          onClick={() => applyFormat('bold')}
          sx={{ width: 24, height: 24, color: '#636366' }}
        >
          <FormatBoldIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => applyFormat('italic')}
          sx={{ width: 24, height: 24, color: '#636366' }}
        >
          <FormatItalicIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => applyFormat('underline')}
          sx={{ width: 24, height: 24, color: '#636366' }}
        >
          <FormatUnderlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Editable Content */}
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        sx={{
          minHeight: `${rows * 24}px`,
          padding: '12px',
          paddingTop: '40px',
          paddingRight: '100px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          outline: 'none',
          fontFamily: 'Aileron',
          fontWeight: 400,
          fontSize: '20px',
          lineHeight: '24px',
          color: '#231F20',
          bgcolor: '#F3F4F6',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          '&:focus': {
            borderColor: '#1340FF',
          },
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: '#9CA3AF',
          },
          '& strong': {
            fontWeight: 700,
            fontFamily: 'Aileron',
          },
          '& em': {
            fontStyle: 'italic',
            fontFamily: 'Aileron',
          },
          '& u': {
            textDecoration: 'underline',
            fontFamily: 'Aileron',
          },
          ...sx,
        }}
      />
    </Box>
  );
};

FormattedTextField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  sx: PropTypes.object,
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
  const [isEditMode, setIsEditMode] = useState(false);

  // When client view, always show read-only (no editing)
  const effectiveEditMode = isClientView ? false : isEditMode;

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
  const [sectionVisibility, setSectionVisibility] = useState({
    engagement: true,
    platformBreakdown: true,
    views: true,
    audienceSentiment: true,
    creatorTiers: true,
    strategies: true,
    recommendations: true,
  });

  const [sectionOrder, setSectionOrder] = useState([
    'engagement',
    'platformBreakdown',
    'views',
    'audienceSentiment',
    'creatorTiers',
    'strategies',
    'recommendations',
  ]);

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

  // Show second persona card state
  const [showEducatorCard, setShowEducatorCard] = useState(false);

  // Show third persona card state
  const [showThirdCard, setShowThirdCard] = useState(false);

  // Show fourth persona card state
  const [showFourthCard, setShowFourthCard] = useState(false);

  // Show fifth persona card state
  const [showFifthCard, setShowFifthCard] = useState(false);

  // Persona cards array state
  const [personaCards, setPersonaCards] = useState([
    {
      id: 1,
      title: 'The Comic',
      emoji: '🎭',
      contentStyle: '',
      whyWork: '',
      creatorCount: '1',
    }
  ]);

  const [editableContent, setEditableContent] = useState({
    campaignDescription: '',
    engagementDescription: '',
    platformBreakdownDescription: '',
    viewsDescription: '',
    audienceSentimentDescription: '',
    noteworthyCreatorsDescription: '',
    bestPerformingPersonasDescription: '',
    positiveComments: [],
    neutralComments: [],
    comicTitle: '',
    comicEmoji: '',
    comicContentStyle: '',
    comicWhyWork: '',
    educatorTitle: '',
    educatorEmoji: '',
    educatorContentStyle: '',
    educatorWhyWork: '',
    creatorStrategyCount: '',
    educatorCreatorCount: '',
    thirdTitle: '',
    thirdEmoji: '',
    thirdContentStyle: '',
    thirdWhyWork: '',
    thirdCreatorCount: '',
    fourthTitle: '',
    fourthEmoji: '',
    fourthContentStyle: '',
    fourthWhyWork: '',
    fourthCreatorCount: '',
    fifthTitle: '',
    fifthEmoji: '',
    fifthContentStyle: '',
    fifthWhyWork: '',
    fifthCreatorCount: '',
    personaCards: [],
    improvedInsights: [],
    workedWellInsights: [],
    nextStepsInsights: [],
    creatorTiersDescription: '',
  });

  // Emoji picker state
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [emojiPickerType, setEmojiPickerType] = useState(null);

  const reportRef = useRef(null);
  const creatorTiersEditorRef = useRef(null);

  const submissions = useMemo(() => campaign?.submission || [], [campaign?.submission]);
  const postingSubmissions = useMemo(() => extractPostingSubmissions(submissions), [submissions]);
  const campaignId = campaign?.id;

  // Fetch manual creator entries
  const { data: manualEntriesData, mutate: mutateManualEntries } = useSWR(
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

  const { data: insightsData } = useSocialInsights(postingSubmissions, campaignId);

  // Fetch post engagement snapshots (Day 7, 15, 30 ER tracking)
  const {
    snapshots: postSnapshots,
    loading: loadingSnapshots,
    error: snapshotsError
  } = usePostEngagementSnapshots(campaignId);

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
      const userId = sub.userId ||
        sub.creatorId ||
        (typeof sub.user === 'string' ? sub.user : sub.user?.id);

      if (userId) {
        uniqueCreatorIds.add(userId);
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

  const { data: heatmapApiData, isLoading: heatmapLoading, error: heatmapError } = useSWR(
    campaign?.id ? `/api/campaign/${campaign.id}/trends/engagement-heatmap?platform=All&weeks=6` : null,
    async (url) => {
      const response = await axios.get(url);
      return response.data.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      dedupingInterval: 60000,
    }
  );

  const {
    isExportingPDF,
    isPreviewOpen,
    setIsPreviewOpen,
    previewImages,
    setIsPreviewCached,
    handleGeneratePreview,
    handleExportPDF,
  } = usePcrExport({ editableContent, sectionVisibility, sectionOrder, isEditMode, setIsEditMode, reportRef, campaign });

  const { history, historyIndex, handleUndo, handleRedo, resetHistory } = usePcrHistory({
    editableContent,
    setEditableContent,
    sectionVisibility,
    setSectionVisibility,
    sectionOrder,
    setSectionOrder,
    showEducatorCard,
    setShowEducatorCard,
    showThirdCard,
    setShowThirdCard,
    showFourthCard,
    setShowFourthCard,
    showFifthCard,
    setShowFifthCard,
    isEditMode,
    setIsPreviewCached,
  });

  const {
    isLoadingPCR,
    isSaving,
    setIsSaving,
    isPCRReady,
    handleSavePCR,
    handleRefreshInsights,
    handleMarkAsReady,
    handleMarkAsUnready,
  } = usePcrData({
    campaign,
    onCampaignUpdate,
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
  });

  // Global paste event listener to strip formatting from all pasted content
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Only apply to inputs, textareas, and contentEditable elements within the report
      const { target } = e;
      const isInReport = reportRef.current?.contains(target);

      if (isInReport && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      )) {
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


  // Calculate top engagement creator
  const topEngagementCreator = useMemo(() => {
    if (!filteredInsightsData || filteredInsightsData.length === 0) return null;

    let highestEngagement = -1;
    let topCreator = null;

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      if (submission) {
        // Calculate engagement rate using the insight array
        const engagementRate = calculateEngagementRate(insightData.insight);

        if (engagementRate > highestEngagement) {
          highestEngagement = engagementRate;
          topCreator = {
            ...submission,
            engagementRate,
            insightData,
          };
        }
      }
    });

    return topCreator;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInsightsData, filteredSubmissions]);

  // Calculate most views creator
  const mostViewsCreator = useMemo(() => {
    let result = null;
    let maxViews = 0;

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      const views = getMetricValue(insightData.insight, 'views');
      if (views > maxViews) {
        maxViews = views;
        result = { submission, insightData, views };
      }
    });

    return result;
  }, [filteredInsightsData, filteredSubmissions]);

  // Calculate most comments creator
  const mostCommentsCreator = useMemo(() => {
    let result = null;
    let maxComments = 0;

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      const comments = getMetricValue(insightData.insight, 'comments');
      if (comments > maxComments) {
        maxComments = comments;
        result = { submission, insightData, comments };
      }
    });

    return result;
  }, [filteredInsightsData, filteredSubmissions]);

  // Calculate most likes creator
  const mostLikesCreator = useMemo(() => {
    let result = null;
    let maxLikes = 0;

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
      const likes = getMetricValue(insightData.insight, 'likes');
      if (likes > maxLikes) {
        maxLikes = likes;
        result = { submission, insightData, likes, platform: insightData.platform || submission.platform };
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
        result = { submission, insightData, shares, platform: insightData.platform || submission.platform };
      }
    });

    return result;
  }, [filteredInsightsData, filteredSubmissions]);

  const mostViewsUserId = typeof mostViewsCreator?.submission?.user === 'string'
    ? mostViewsCreator?.submission?.user
    : mostViewsCreator?.submission?.user?.id;
  const mostCommentsUserId = typeof mostCommentsCreator?.submission?.user === 'string'
    ? mostCommentsCreator?.submission?.user
    : mostCommentsCreator?.submission?.user?.id;
  const mostLikesUserId = typeof mostLikesCreator?.submission?.user === 'string'
    ? mostLikesCreator?.submission?.user
    : mostLikesCreator?.submission?.user?.id;
  const mostSharesUserId = typeof mostSharesCreator?.submission?.user === 'string'
    ? mostSharesCreator?.submission?.user
    : mostSharesCreator?.submission?.user?.id;

  // Check if they are manual entries (userId equals submission.id)
  const isViewsManual = mostViewsUserId === mostViewsCreator?.submission?.id;
  const isCommentsManual = mostCommentsUserId === mostCommentsCreator?.submission?.id;
  const isLikesManual = mostLikesUserId === mostLikesCreator?.submission?.id;
  const isSharesManual = mostSharesUserId === mostSharesCreator?.submission?.id;

  const { data: topEngagementCreatorData } = useGetCreatorById(topEngagementCreator?.user);
  const { data: mostViewsCreatorData } = useGetCreatorById(!isViewsManual ? mostViewsUserId : null);
  const { data: mostCommentsCreatorData } = useGetCreatorById(!isCommentsManual ? mostCommentsUserId : null);
  const { data: mostLikesCreatorData } = useGetCreatorById(!isLikesManual ? mostLikesUserId : null);
  const { data: mostSharesCreatorData } = useGetCreatorById(!isSharesManual ? mostSharesUserId : null);

  return (
    <>
      {/* Print-specific CSS */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              margin: 0;
              padding: 0;
            }
            
            /* Prevent sections from breaking across pages */
            .pcr-section {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Allow break before sections if needed */
            .pcr-section {
              page-break-before: auto;
            }
            
            /* Prevent breaks inside cards and grids */
            .MuiGrid-item,
            .MuiBox-root[class*="card"] {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            /* Hide elements that shouldn't print */
            .hide-in-pdf {
              display: none !important;
            }
            
            /* Ensure proper sizing */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

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
                <Box component="img" src="/assets/greentick.svg" alt="" sx={{ width: 24, height: 24 }} />
              ) : (
                <Box component="img" src="/assets/greentick.svg" alt="" sx={{ width: 24, height: 24, filter: 'brightness(0) saturate(100%) invert(55%) sepia(8%) saturate(1200%) hue-rotate(200deg) brightness(92%) contrast(88%)' }} />
              )
            }
          >
            Ready for Client Viewing
          </Button>
        </Box>
      )}

      <Box
        id="pcr-report-main"
        sx={{
          width: '1078px',
          padding: '16px',
          paddingBottom: '32px',
          gap: '10px',
          background: 'linear-gradient(180deg, #1340FF 0%, #8A5AFE 100%)',
          margin: '0 auto',
          position: 'relative'
        }}
      >
        {/* Loading overlay */}
        {isLoadingPCR && (
          <Box className="hide-in-pdf" sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 9999,
            borderRadius: '12px',
            backdropFilter: 'blur(4px)'
          }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#1340FF', mb: 3 }} />
            <Typography sx={{
              fontFamily: 'Inter Display',
              fontWeight: 600,
              fontSize: '18px',
              color: '#231F20',
              mb: 1
            }}>
              Loading Post Campaign Report
            </Typography>
            <Typography sx={{
              fontFamily: 'Aileron',
              fontWeight: 400,
              fontSize: '14px',
              color: '#636366'
            }}>
              Please wait while we prepare your data...
            </Typography>
          </Box>
        )}

        {/* Saving overlay */}
        {isSaving && (
          <Box className="hide-in-pdf" sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            zIndex: 9999,
            borderRadius: '12px',
            backdropFilter: 'blur(4px)'
          }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#10B981', mb: 3 }} />
            <Typography sx={{
              fontFamily: 'Inter Display',
              fontWeight: 600,
              fontSize: '18px',
              color: '#231F20',
              mb: 1
            }}>
              Saving Changes
            </Typography>
            <Typography sx={{
              fontFamily: 'Aileron',
              fontWeight: 400,
              fontSize: '14px',
              color: '#636366'
            }}>
              Your edits are being saved...
            </Typography>
          </Box>
        )}

        {/* PDF Capture Wrapper - includes gradient border */}
        <Box ref={reportRef}>

          {/* Inner content container - transparent background */}
          <Box
            sx={{
              borderRadius: '12px',
              padding: '16px',
              minHeight: 'calc(100% - 32px)',
              opacity: isLoadingPCR ? 0.5 : 1,
              pointerEvents: isLoadingPCR ? 'none' : 'auto',
            }}
          >
            {/* Header with Back Button */}
            <Box className="hide-in-pdf" sx={{ mb: 2 }}>
              {/* Back Button and Undo/Redo/Save Row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                    }
                  }}
                >
                  Back
                </Button>

                {!isClientView && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {effectiveEditMode ? (
                      <>
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
                            }
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
                                opacity: historyIndex <= 0 ? 0.4 : 1
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
                            }
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
                                opacity: historyIndex >= history.length - 1 ? 0.4 : 1
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
                            }
                          }}
                        >
                          Redo
                        </Button>
                        <Button
                          onClick={handleSavePCR}
                          disabled={isSaving}
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
                            }
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
                            }
                          }}
                          onClick={handleGeneratePreview}
                        >
                          Preview
                        </Button>
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
                            }
                          }}
                          onClick={() => setIsEditMode(true)}
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
                            }
                          }}
                        >
                          <Iconify icon="material-symbols:download-rounded" width={20} />
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </Box>

              {/* Add Section Buttons - Only show in edit mode */}
              {effectiveEditMode && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {!sectionVisibility.engagement && (
                    <Button
                      size="small"
                      onClick={() => setSectionVisibility({ ...sectionVisibility, engagement: true })}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        color: '#374151',
                        '&:hover': { bgcolor: '#F9FAFB' },
                        gap: '4px',
                        '& .MuiButton-startIcon': {
                          marginRight: 0,
                          marginLeft: 0
                        }
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>+</Box>
                      Engagements
                    </Button>
                  )}
                  {!sectionVisibility.platformBreakdown && (
                    <Button
                      size="small"
                      onClick={() => setSectionVisibility({ ...sectionVisibility, platformBreakdown: true })}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        color: '#374151',
                        '&:hover': { bgcolor: '#F9FAFB' },
                        gap: '4px'
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>+</Box>
                      Platform Breakdown
                    </Button>
                  )}
                  {!sectionVisibility.views && (
                    <Button
                      size="small"
                      onClick={() => setSectionVisibility({ ...sectionVisibility, views: true })}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        color: '#374151',
                        '&:hover': { bgcolor: '#F9FAFB' },
                        gap: '4px'
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>+</Box>
                      Views
                    </Button>
                  )}
                  {!sectionVisibility.audienceSentiment && (
                    <Button
                      size="small"
                      onClick={() => setSectionVisibility({ ...sectionVisibility, audienceSentiment: true })}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        color: '#374151',
                        '&:hover': { bgcolor: '#F9FAFB' },
                        gap: '4px'
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>+</Box>
                      Audience Sentiment
                    </Button>
                  )}
                  {!sectionVisibility.creatorTiers && (
                    <Button
                      size="small"
                      onClick={() => setSectionVisibility({ ...sectionVisibility, creatorTiers: true })}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        color: '#374151',
                        '&:hover': { bgcolor: '#F9FAFB' },
                        gap: '4px'
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>+</Box>
                      Creator Tiers
                    </Button>
                  )}
                  {!sectionVisibility.strategies && (
                    <Button
                      size="small"
                      onClick={() => setSectionVisibility({ ...sectionVisibility, strategies: true })}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        color: '#374151',
                        '&:hover': { bgcolor: '#F9FAFB' },
                        gap: '4px'
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>+</Box>
                      Strategies
                    </Button>
                  )}
                  {!sectionVisibility.recommendations && (
                    <Button
                      size="small"
                      onClick={() => setSectionVisibility({ ...sectionVisibility, recommendations: true })}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E7E7E7',
                        color: '#374151',
                        '&:hover': { bgcolor: '#F9FAFB' },
                        gap: '4px'
                      }}
                    >
                      <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>+</Box>
                      Recommendations
                    </Button>
                  )}
                </Box>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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
                        display: 'block'
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
                          color: '#231F20'
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
                        height: '60px',
                        opacity: 0.8,
                      }}
                    />
                  </Box>
                </Box>

                {(() => {
                  if (effectiveEditMode) {
                    return (
                      <Box sx={{ position: 'relative', mb: 2 }}>
                        <Box sx={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          zIndex: 1,
                          bgcolor: '#F3F4F6',
                          px: 0.5
                        }}>
                          <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#3A3A3C' }}>
                            Editable
                          </Typography>
                        </Box>
                        <FormattedTextField
                          value={editableContent.campaignDescription}
                          onChange={(e) => setEditableContent({ ...editableContent, campaignDescription: e.target.value })}
                          placeholder="type here"
                          rows={3}
                        />
                      </Box>
                    );
                  }

                  if (editableContent.campaignDescription) {
                    return (
                      <Box
                        sx={{
                          fontFamily: 'Aileron',
                          fontWeight: 400,
                          fontStyle: 'normal',
                          fontSize: '20px',
                          lineHeight: '24px',
                          letterSpacing: '0%',
                          color: '#231F20',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          '& strong': { fontWeight: 700 },
                          '& em': { fontStyle: 'italic' },
                          '& u': { textDecoration: 'underline' },
                        }}
                        dangerouslySetInnerHTML={{ __html: editableContent.campaignDescription }}
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
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'Aileron',
                          fontWeight: 400,
                          fontSize: '20px',
                          lineHeight: '24px',
                          letterSpacing: '0%',
                          color: '#9CA3AF',
                        }}
                      >
                        {isClientView ? 'No content' : 'Click Edit Report to edit Campaign Description'}
                      </Typography>
                    </Box>
                  );
                })()}
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
                      alignItems: 'flex-start'
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
                        mb: 0.5
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
                        color: '#FFFFFF'
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
                      background: 'linear-gradient(359.86deg, #8A5AFE 0.13%, rgba(138, 90, 254, 0) 109.62%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start'
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
                        mb: 0.5
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
                        color: '#FFFFFF'
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
                      background: 'linear-gradient(180deg, rgba(255, 53, 0, 0) -9.77%, #FF3500 100%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start'
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
                        mb: 0.5
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
                        color: '#FFFFFF'
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
                      background: 'linear-gradient(180deg, rgba(19, 64, 255, 0) -8.65%, #1340FF 100%)',
                      borderRadius: '12px',
                      p: 3,
                      color: 'white',
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-start'
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
                        mb: 0.5
                      }}
                    >
                      {formatNumber((summaryStats.totalLikes || 0) + (summaryStats.totalComments || 0) + (summaryStats.totalShares || 0) + (summaryStats.totalSaved || 0))}
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
                        color: '#FFFFFF'
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
                      alignItems: 'flex-start'
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
                        mb: 0.5
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
                        color: '#FFFFFF'
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
                items={sectionOrder.filter(id => sectionVisibility[id])}
                strategy={verticalListSortingStrategy}
              >
                {sectionOrder.map((sectionId) => {
                  if (!sectionVisibility[sectionId]) return null;

                  switch (sectionId) {
                    case 'engagement':
                      return (
                        <SortableSection key="engagement" id="engagement" isEditMode={effectiveEditMode}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography
                                  variant="h2"
                                  sx={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontWeight: 400,
                                    fontStyle: 'normal',
                                    fontSize: '56px',
                                    lineHeight: '60px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Engagements
                                </Typography>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#231F20',
                                  }}
                                />
                                {effectiveEditMode && !sectionEditStates.engagement && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={async () => {
                                        try {
                                          setIsSaving(true);
                                          const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
                                            content: editableContent,
                                          });
                                          if (response.data.success) {
                                            setSectionEditStates({ ...sectionEditStates, engagement: true });
                                            enqueueSnackbar('Engagement section saved successfully', { variant: 'success' });
                                          }
                                        } catch (error) {
                                          console.error('Error saving section:', error);
                                          enqueueSnackbar('Failed to save section', { variant: 'error' });
                                        } finally {
                                          setIsSaving(false);
                                        }
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, engagement: false });
                                        enqueueSnackbar('Engagement section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                                {effectiveEditMode && sectionEditStates.engagement && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={() => {
                                        setSectionEditStates({ ...sectionEditStates, engagement: false });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, engagement: false });
                                        enqueueSnackbar('Engagement section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>

                              {(() => {
                                if (effectiveEditMode && !sectionEditStates.engagement) {
                                  return (
                                    <Box sx={{ position: 'relative', mb: 3 }}>
                                      <Box sx={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        zIndex: 1,
                                        bgcolor: '#F3F4F6',
                                        px: 0.5
                                      }}>
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#3A3A3C' }}>
                                          Editable
                                        </Typography>
                                      </Box>
                                      <FormattedTextField
                                        value={editableContent.engagementDescription}
                                        onChange={(e) => setEditableContent({ ...editableContent, engagementDescription: e.target.value })}
                                        placeholder="type here"
                                        rows={4}
                                      />
                                    </Box>
                                  );
                                }

                                if (editableContent.engagementDescription) {
                                  return (
                                    <Box
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontStyle: 'normal',
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#231F20',
                                        mb: 3,
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        '& strong': {
                                          fontFamily: 'Inter Display, sans-serif',
                                          fontWeight: 700,
                                          fontStyle: 'normal',
                                          fontSize: '20px',
                                          lineHeight: '24px',
                                          letterSpacing: '0%',
                                          color: '#231F20'
                                        },
                                        '& em': { fontStyle: 'italic' },
                                        '& u': { textDecoration: 'underline' },
                                      }}
                                      dangerouslySetInnerHTML={{ __html: editableContent.engagementDescription }}
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
                                      mb: 3,
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#9CA3AF',
                                      }}
                                    >
                                      {isClientView ? 'No content' : 'Click Edit Report to edit Engagement'}
                                    </Typography>
                                  </Box>
                                );
                              })()}

                              {/* Analytics Grid */}
                              <Grid container spacing={2} sx={{ mb: 4 }}>
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
                        <SortableSection key="platformBreakdown" id="platformBreakdown" isEditMode={effectiveEditMode}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography
                                  variant="h2"
                                  sx={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontWeight: 400,
                                    fontStyle: 'normal',
                                    fontSize: '56px',
                                    lineHeight: '60px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Platform Breakdown
                                </Typography>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#231F20',
                                  }}
                                />
                                {effectiveEditMode && !sectionEditStates.platformBreakdown && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={async () => {
                                        try {
                                          setIsSaving(true);
                                          const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
                                            content: editableContent,
                                          });
                                          if (response.data.success) {
                                            setSectionEditStates({ ...sectionEditStates, platformBreakdown: true });
                                            enqueueSnackbar('Platform Breakdown section saved successfully', { variant: 'success' });
                                          }
                                        } catch (error) {
                                          console.error('Error saving section:', error);
                                          enqueueSnackbar('Failed to save section', { variant: 'error' });
                                        } finally {
                                          setIsSaving(false);
                                        }
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, platformBreakdown: false });
                                        enqueueSnackbar('Platform Breakdown section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                                {effectiveEditMode && sectionEditStates.platformBreakdown && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={() => {
                                        // Switch back to edit mode
                                        setSectionEditStates({ ...sectionEditStates, platformBreakdown: false });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, platformBreakdown: false });
                                        enqueueSnackbar('Platform Breakdown section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>

                              {(() => {
                                if (effectiveEditMode && !sectionEditStates.platformBreakdown) {
                                  return (
                                    <Box sx={{ position: 'relative', mb: 3 }}>
                                      <Box sx={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        zIndex: 1,
                                        bgcolor: '#F3F4F6',
                                        px: 0.5
                                      }}>
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#3A3A3C' }}>
                                          Editable
                                        </Typography>
                                      </Box>
                                      <FormattedTextField
                                        value={editableContent.platformBreakdownDescription || ''}
                                        onChange={(e) => setEditableContent({ ...editableContent, platformBreakdownDescription: e.target.value })}
                                        placeholder="type here"
                                        rows={2}
                                      />
                                    </Box>
                                  );
                                }

                                if (editableContent.platformBreakdownDescription) {
                                  return (
                                    <Box
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontStyle: 'normal',
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#231F20',
                                        mb: 3,
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        '& strong': { fontWeight: 700 },
                                        '& em': { fontStyle: 'italic' },
                                        '& u': { textDecoration: 'underline' },
                                      }}
                                      dangerouslySetInnerHTML={{ __html: editableContent.platformBreakdownDescription }}
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
                                      mb: 3,
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#9CA3AF',
                                      }}
                                    >
                                      {isClientView ? 'No content' : 'Click Edit Report to edit Platform Breakdown'}
                                    </Typography>
                                  </Box>
                                );
                              })()}

                              {/* Platform Breakdown Grid */}
                              <Grid container spacing={3}>
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
                                      const views = mostLikesCreator ? getMetricValue(mostLikesCreator.insightData.insight, 'views') : 0;
                                      const comments = mostLikesCreator ? getMetricValue(mostLikesCreator.insightData.insight, 'comments') : 0;
                                      const shares = mostLikesCreator ? getMetricValue(mostLikesCreator.insightData.insight, 'shares') : 0;
                                      const maxLikes = mostLikesCreator ? mostLikesCreator.likes : 0;
                                      const engagementRate = mostLikesCreator ? calculateEngagementRate(mostLikesCreator.insightData.insight) : 0;

                                      // Get username based on platform
                                      let username = '';
                                      if (mostLikesCreator) {
                                        const { platform } = mostLikesCreator;
                                        if (platform === 'Instagram') {
                                          username = mostLikesCreatorData?.user?.creator?.instagram
                                            || mostLikesCreator?.submission?.user?.creator?.instagram
                                            || mostLikesCreator?.submission?.user?.username
                                            || mostLikesCreator?.submission?.user?.name
                                            || '';
                                        } else if (platform === 'TikTok') {
                                          username = mostLikesCreatorData?.user?.creator?.tiktok
                                            || mostLikesCreator?.submission?.user?.creator?.tiktok
                                            || mostLikesCreator?.submission?.user?.username
                                            || mostLikesCreator?.submission?.user?.name
                                            || '';
                                        }
                                      }

                                      return mostLikesCreator && (
                                        <Grid item xs={12} md={12}>
                                          <Box sx={{
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
                                          }}>
                                            {/* Most Likes Badge */}
                                            <Box sx={{
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
                                              color: '#1ABF66'
                                            }}>
                                              Most Likes
                                            </Box>

                                            {/* Creator Info */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: '#E4405F' }}>
                                                  {(mostLikesCreatorData?.user?.name || mostLikesCreator?.submission?.user?.name)?.charAt(0) || 'U'}
                                                </Avatar>
                                                <Box>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '16px',
                                                    color: '#231F20',
                                                    lineHeight: '18px'
                                                  }}>
                                                    {mostLikesCreatorData?.user?.name || mostLikesCreator?.submission?.user?.name || 'Unknown'}
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontSize: '14px',
                                                    color: '#636366',
                                                    lineHeight: '16px'
                                                  }}>
                                                    {username}
                                                  </Typography>
                                                </Box>
                                              </Box>

                                              {/* Metrics - Inline */}
                                              <Box sx={{ display: 'flex', gap: 5 }}>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Engage. Rate
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {engagementRate}%
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Views
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {formatNumber(views)}
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Likes
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {formatNumber(maxLikes)}
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Shares
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {formatNumber(shares)}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            </Box>
                                          </Box>
                                        </Grid>
                                      );
                                    })()}

                                    {/* Most Shares Card */}
                                    {(() => {
                                      const views = mostSharesCreator ? getMetricValue(mostSharesCreator.insightData.insight, 'views') : 0;
                                      const comments = mostSharesCreator ? getMetricValue(mostSharesCreator.insightData.insight, 'comments') : 0;
                                      const likes = mostSharesCreator ? getMetricValue(mostSharesCreator.insightData.insight, 'likes') : 0;
                                      const maxShares = mostSharesCreator ? mostSharesCreator.shares : 0;
                                      const engagementRate = mostSharesCreator ? calculateEngagementRate(mostSharesCreator.insightData.insight) : 0;

                                      // Get username based on platform
                                      let username = '';
                                      if (mostSharesCreator) {
                                        const { platform } = mostSharesCreator;
                                        if (platform === 'Instagram') {
                                          username = mostSharesCreatorData?.user?.creator?.instagram
                                            || mostSharesCreator?.submission?.user?.creator?.instagram
                                            || mostSharesCreator?.submission?.user?.username
                                            || mostSharesCreator?.submission?.user?.name
                                            || '';
                                        } else if (platform === 'TikTok') {
                                          username = mostSharesCreatorData?.user?.creator?.tiktok
                                            || mostSharesCreator?.submission?.user?.creator?.tiktok
                                            || mostSharesCreator?.submission?.user?.username
                                            || mostSharesCreator?.submission?.user?.name
                                            || '';
                                        }
                                      }

                                      return mostSharesCreator && (
                                        <Grid item xs={12} md={12}>
                                          <Box sx={{
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
                                          }}>
                                            {/* Most Shares Badge */}
                                            <Box sx={{
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
                                              color: '#1ABF66'
                                            }}>
                                              Most Shares
                                            </Box>

                                            {/* Creator Info */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: '#E4405F' }}>
                                                  {(mostSharesCreatorData?.user?.name || mostSharesCreator?.submission?.user?.name)?.charAt(0) || 'U'}
                                                </Avatar>
                                                <Box>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '16px',
                                                    color: '#231F20',
                                                    lineHeight: '18px'
                                                  }}>
                                                    {mostSharesCreatorData?.user?.name || mostSharesCreator?.submission?.user?.name || 'Unknown'}
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontSize: '14px',
                                                    color: '#636366',
                                                    lineHeight: '16px'
                                                  }}>
                                                    {username}
                                                  </Typography>
                                                </Box>
                                              </Box>

                                              {/* Metrics - Inline */}
                                              <Box sx={{ display: 'flex', gap: 5 }}>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Engage. Rate
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {engagementRate}%
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Views
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {formatNumber(views)}
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Likes
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {formatNumber(likes)}
                                                  </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'left' }}>
                                                  <Typography sx={{
                                                    fontFamily: 'Aileron',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    lineHeight: '14px',
                                                    color: '#636366'
                                                  }}>
                                                    Shares
                                                  </Typography>
                                                  <Typography sx={{
                                                    fontFamily: 'Instrument Serif',
                                                    fontWeight: 400,
                                                    fontSize: '28px',
                                                    lineHeight: '30px',
                                                    color: '#1340FF'
                                                  }}>
                                                    {formatNumber(maxShares)}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            </Box>
                                          </Box>
                                        </Grid>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography
                                  variant="h2"
                                  sx={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontWeight: 400,
                                    fontStyle: 'normal',
                                    fontSize: '56px',
                                    lineHeight: '60px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Views
                                </Typography>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#231F20',
                                  }}
                                />
                                {effectiveEditMode && !sectionEditStates.views && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={async () => {
                                        try {
                                          setIsSaving(true);
                                          const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
                                            content: editableContent,
                                          });
                                          if (response.data.success) {
                                            setSectionEditStates({ ...sectionEditStates, views: true });
                                            enqueueSnackbar('Views section saved successfully', { variant: 'success' });
                                          }
                                        } catch (error) {
                                          console.error('Error saving section:', error);
                                          enqueueSnackbar('Failed to save section', { variant: 'error' });
                                        } finally {
                                          setIsSaving(false);
                                        }
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, views: false });
                                        enqueueSnackbar('Views section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                                {effectiveEditMode && sectionEditStates.views && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={() => {
                                        setSectionEditStates({ ...sectionEditStates, views: false });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, views: false });
                                        enqueueSnackbar('Views section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>

                              {(() => {
                                if (effectiveEditMode && !sectionEditStates.views) {
                                  return (
                                    <Box sx={{ position: 'relative', mb: 3 }}>
                                      <Box sx={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        zIndex: 1,
                                        bgcolor: '#F3F4F6',
                                        px: 0.5
                                      }}>
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#3A3A3C' }}>
                                          Editable
                                        </Typography>
                                      </Box>
                                      <FormattedTextField
                                        value={editableContent.viewsDescription || ''}
                                        onChange={(e) => setEditableContent({ ...editableContent, viewsDescription: e.target.value })}
                                        placeholder="type here"
                                        rows={3}
                                      />
                                    </Box>
                                  );
                                }

                                if (editableContent.viewsDescription) {
                                  return (
                                    <Box
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontStyle: 'normal',
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#231F20',
                                        mb: 3,
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        '& strong': { fontWeight: 700 },
                                        '& em': { fontStyle: 'italic' },
                                        '& u': { textDecoration: 'underline' },
                                      }}
                                      dangerouslySetInnerHTML={{ __html: editableContent.viewsDescription }}
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
                                      mb: 3,
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#9CA3AF',
                                      }}
                                    >
                                      {isClientView ? 'No content' : 'Click Edit Report to edit Views'}
                                    </Typography>
                                  </Box>
                                );
                              })()}

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
                        <SortableSection key="audienceSentiment" id="audienceSentiment" isEditMode={effectiveEditMode}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography
                                  variant="h2"
                                  sx={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontWeight: 400,
                                    fontStyle: 'normal',
                                    fontSize: '56px',
                                    lineHeight: '60px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Audience Sentiment
                                </Typography>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#231F20',
                                  }}
                                />
                                {effectiveEditMode && !sectionEditStates.audienceSentiment && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={async () => {
                                        try {
                                          setIsSaving(true);
                                          const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
                                            content: editableContent,
                                          });
                                          if (response.data.success) {
                                            setSectionEditStates({ ...sectionEditStates, audienceSentiment: true });
                                            enqueueSnackbar('Audience Sentiment section saved successfully', { variant: 'success' });
                                          }
                                        } catch (error) {
                                          console.error('Error saving section:', error);
                                          enqueueSnackbar('Failed to save section', { variant: 'error' });
                                        } finally {
                                          setIsSaving(false);
                                        }
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, audienceSentiment: false });
                                        enqueueSnackbar('Audience Sentiment section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                                {effectiveEditMode && sectionEditStates.audienceSentiment && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={() => {
                                        setSectionEditStates({ ...sectionEditStates, audienceSentiment: false });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, audienceSentiment: false });
                                        enqueueSnackbar('Audience Sentiment section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>

                              {(() => {
                                if (effectiveEditMode && !sectionEditStates.audienceSentiment) {
                                  return (
                                    <Box sx={{ position: 'relative', mb: 3 }}>
                                      <Box sx={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        zIndex: 1,
                                        bgcolor: '#F3F4F6',
                                        px: 0.5
                                      }}>
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#3A3A3C' }}>
                                          Editable
                                        </Typography>
                                      </Box>
                                      <FormattedTextField
                                        value={editableContent.audienceSentimentDescription}
                                        onChange={(e) => setEditableContent({ ...editableContent, audienceSentimentDescription: e.target.value })}
                                        placeholder="type here"
                                        rows={3}
                                      />
                                    </Box>
                                  );
                                }

                                if (editableContent.audienceSentimentDescription) {
                                  return (
                                    <Box
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontStyle: 'normal',
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#231F20',
                                        mb: 3,
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        '& strong': { fontWeight: 700 },
                                        '& em': { fontStyle: 'italic' },
                                        '& u': { textDecoration: 'underline' },
                                      }}
                                      dangerouslySetInnerHTML={{ __html: editableContent.audienceSentimentDescription }}
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
                                      mb: 3,
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        letterSpacing: '0%',
                                        color: '#9CA3AF',
                                      }}
                                    >
                                      {isClientView ? 'No content' : 'Click Edit Report to edit Audience Sentiment'}
                                    </Typography>
                                  </Box>
                                );
                              })()}

                              {/* Positive Comments */}
                              {(effectiveEditMode || editableContent.positiveComments.length > 0) && (
                                <Box sx={{ mb: 3, position: 'relative', mt: 3 }}>
                                  <Box
                                    sx={{
                                      p: 3,
                                      border: '2px solid #10B981',
                                      borderRadius: '12px',
                                      bgcolor: 'white'
                                    }}
                                  >
                                    <Box sx={{
                                      position: 'absolute',
                                      top: '-10px',
                                      left: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      bgcolor: '#D1FAE5',
                                      px: 2,
                                      py: 0.5,
                                      borderRadius: '4px'
                                    }}>
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
                                          {editableContent.positiveComments.map((comment, index) => (
                                            <Grid item xs={12} sm={6} md={3} key={index}>
                                              <Box sx={{ p: 1.5, bgcolor: '#F3F4F6', borderRadius: '8px', position: 'relative' }}>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => {
                                                    const newComments = editableContent.positiveComments.filter((_, i) => i !== index);
                                                    setEditableContent({ ...editableContent, positiveComments: newComments });
                                                  }}
                                                  sx={{ position: 'absolute', top: 4, right: 4, color: '#6B7280' }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                                <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#6B7280', mb: 0.5, pr: 3 }}>
                                                  {comment.username}
                                                </Typography>
                                                <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', color: '#374151', lineHeight: 1.4 }}>
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
                                              if (e.key === 'Enter' && editableContent.positiveComments.length < 4) {
                                                const username = document.getElementById('positive-username-input').value;
                                                const postlink = document.getElementById('positive-postlink-input').value;
                                                const comment = document.getElementById('positive-comment-input').value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [...editableContent.positiveComments, { username, comment }];
                                                  setEditableContent({ ...editableContent, positiveComments: newComments });
                                                  document.getElementById('positive-username-input').value = '@';
                                                  document.getElementById('positive-postlink-input').value = '';
                                                  document.getElementById('positive-comment-input').value = '';
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
                                              if (e.key === 'Enter' && editableContent.positiveComments.length < 4) {
                                                const username = document.getElementById('positive-username-input').value;
                                                const postlink = document.getElementById('positive-postlink-input').value;
                                                const comment = document.getElementById('positive-comment-input').value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [...editableContent.positiveComments, { username, comment }];
                                                  setEditableContent({ ...editableContent, positiveComments: newComments });
                                                  document.getElementById('positive-username-input').value = '@';
                                                  document.getElementById('positive-postlink-input').value = '';
                                                  document.getElementById('positive-comment-input').value = '';
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
                                            if (e.key === 'Enter' && editableContent.positiveComments.length < 4) {
                                              const username = document.getElementById('positive-username-input').value;
                                              const postlink = document.getElementById('positive-postlink-input').value;
                                              const comment = document.getElementById('positive-comment-input').value;

                                              if (username && username !== '@' && comment) {
                                                const newComments = [...editableContent.positiveComments, { username, comment, postlink }];
                                                setEditableContent({ ...editableContent, positiveComments: newComments });
                                                document.getElementById('positive-username-input').value = '@';
                                                document.getElementById('positive-postlink-input').value = '';
                                                document.getElementById('positive-comment-input').value = '';
                                              }
                                            }
                                          }}
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <IconButton
                                                  onClick={() => {
                                                    const username = document.getElementById('positive-username-input').value;
                                                    const postlink = document.getElementById('positive-postlink-input').value;
                                                    const comment = document.getElementById('positive-comment-input').value;

                                                    if (username && username !== '@' && comment) {
                                                      const newComments = [...editableContent.positiveComments, { username, comment }];
                                                      setEditableContent({ ...editableContent, positiveComments: newComments });
                                                      document.getElementById('positive-username-input').value = '@';
                                                      document.getElementById('positive-postlink-input').value = '';
                                                      document.getElementById('positive-comment-input').value = '';
                                                    }
                                                  }}
                                                  disabled={editableContent.positiveComments.length >= 4}
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
                                            {editableContent.positiveComments.map((comment, index) => (
                                              <Grid item xs={12} sm={6} md={3} key={index}>
                                                <Box sx={{ p: 2, bgcolor: '#F3F4F6', borderRadius: '8px' }}>
                                                  <Link
                                                    href={comment.postlink || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{
                                                      textDecoration: 'none',
                                                      '&:hover': {
                                                        textDecoration: 'underline'
                                                      }
                                                    }}
                                                  >
                                                    <Typography sx={{
                                                      fontFamily: 'Aileron',
                                                      fontSize: '12px',
                                                      fontWeight: 600,
                                                      color: '#6B7280',
                                                      mb: 1,
                                                      cursor: 'pointer',
                                                      '&:hover': {
                                                        color: '#1340FF'
                                                      }
                                                    }}>
                                                      {comment.username}
                                                    </Typography>
                                                  </Link>
                                                  <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', color: '#374151' }}>
                                                    {comment.comment}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            ))}
                                          </Grid>
                                        ) : null}
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              )}

                              {/* Neutral Comments */}
                              {(effectiveEditMode || editableContent.neutralComments.length > 0) && (
                                <Box sx={{ mb: 3, position: 'relative', mt: 3 }}>
                                  <Box
                                    sx={{
                                      p: 3,
                                      border: '2px solid #F59E0B',
                                      borderRadius: '12px',
                                      bgcolor: 'white'
                                    }}
                                  >
                                    <Box sx={{
                                      position: 'absolute',
                                      top: '-10px',
                                      left: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      bgcolor: '#FEF3C7',
                                      px: 2,
                                      py: 0.5,
                                      borderRadius: '4px'
                                    }}>
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
                                              <Box sx={{ p: 2, bgcolor: '#F3F4F6', borderRadius: '8px', position: 'relative' }}>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => {
                                                    const newComments = editableContent.neutralComments.filter((_, i) => i !== index);
                                                    setEditableContent({ ...editableContent, neutralComments: newComments });
                                                  }}
                                                  sx={{ position: 'absolute', top: 4, right: 4, color: '#6B7280' }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                                <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#6B7280', mb: 1 }}>
                                                  {comment.username}
                                                </Typography>
                                                <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', color: '#374151' }}>
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
                                              if (e.key === 'Enter' && editableContent.neutralComments.length < 4) {
                                                const username = document.getElementById('neutral-username-input').value;
                                                const postlink = document.getElementById('neutral-postlink-input').value;
                                                const comment = document.getElementById('neutral-comment-input').value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [...editableContent.neutralComments, { username, comment }];
                                                  setEditableContent({ ...editableContent, neutralComments: newComments });
                                                  document.getElementById('neutral-username-input').value = '@';
                                                  document.getElementById('neutral-postlink-input').value = '';
                                                  document.getElementById('neutral-comment-input').value = '';
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
                                              if (e.key === 'Enter' && editableContent.neutralComments.length < 4) {
                                                const username = document.getElementById('neutral-username-input').value;
                                                const postlink = document.getElementById('neutral-postlink-input').value;
                                                const comment = document.getElementById('neutral-comment-input').value;

                                                if (username && username !== '@' && comment) {
                                                  const newComments = [...editableContent.neutralComments, { username, comment }];
                                                  setEditableContent({ ...editableContent, neutralComments: newComments });
                                                  document.getElementById('neutral-username-input').value = '@';
                                                  document.getElementById('neutral-postlink-input').value = '';
                                                  document.getElementById('neutral-comment-input').value = '';
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
                                            if (e.key === 'Enter' && editableContent.neutralComments.length < 4) {
                                              const username = document.getElementById('neutral-username-input').value;
                                              const postlink = document.getElementById('neutral-postlink-input').value;
                                              const comment = document.getElementById('neutral-comment-input').value;

                                              if (username && username !== '@' && comment) {
                                                const newComments = [...editableContent.neutralComments, { username, comment, postlink }];
                                                setEditableContent({ ...editableContent, neutralComments: newComments });
                                                document.getElementById('neutral-username-input').value = '@';
                                                document.getElementById('neutral-postlink-input').value = '';
                                                document.getElementById('neutral-comment-input').value = '';
                                              }
                                            }
                                          }}
                                          InputProps={{
                                            endAdornment: (
                                              <InputAdornment position="end">
                                                <IconButton
                                                  onClick={() => {
                                                    const username = document.getElementById('neutral-username-input').value;
                                                    const postlink = document.getElementById('neutral-postlink-input').value;
                                                    const comment = document.getElementById('neutral-comment-input').value;

                                                    if (username && username !== '@' && comment) {
                                                      const newComments = [...editableContent.neutralComments, { username, comment }];
                                                      setEditableContent({ ...editableContent, neutralComments: newComments });
                                                      document.getElementById('neutral-username-input').value = '@';
                                                      document.getElementById('neutral-postlink-input').value = '';
                                                      document.getElementById('neutral-comment-input').value = '';
                                                    }
                                                  }}
                                                  disabled={editableContent.neutralComments.length >= 4}
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
                                            {editableContent.neutralComments.map((comment, index) => (
                                              <Grid item xs={12} sm={6} md={3} key={index}>
                                                <Box sx={{ p: 2, bgcolor: '#F3F4F6', borderRadius: '8px' }}>
                                                  <Link
                                                    href={comment.postlink || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{
                                                      textDecoration: 'none',
                                                      '&:hover': {
                                                        textDecoration: 'underline'
                                                      }
                                                    }}
                                                  >
                                                    <Typography sx={{
                                                      fontFamily: 'Aileron',
                                                      fontSize: '12px',
                                                      fontWeight: 600,
                                                      color: '#6B7280',
                                                      mb: 1,
                                                      cursor: 'pointer',
                                                      '&:hover': {
                                                        color: '#1340FF'
                                                      }
                                                    }}>
                                                      {comment.username}
                                                    </Typography>
                                                  </Link>
                                                  <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', color: '#374151' }}>
                                                    {comment.comment}
                                                  </Typography>
                                                </Box>
                                              </Grid>
                                            ))}
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
                        <SortableSection key="creatorTiers" id="creatorTiers" isEditMode={effectiveEditMode}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography
                                  variant="h2"
                                  sx={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontWeight: 400,
                                    fontStyle: 'normal',
                                    fontSize: '56px',
                                    lineHeight: '60px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Creator Tiers
                                </Typography>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#231F20',
                                  }}
                                />
                                {effectiveEditMode && !sectionEditStates.creatorTiers && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={async () => {
                                        try {
                                          setIsSaving(true);
                                          const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
                                            content: editableContent,
                                          });
                                          if (response.data.success) {
                                            setSectionEditStates({ ...sectionEditStates, creatorTiers: true });
                                            enqueueSnackbar('Creator Tiers section saved successfully', { variant: 'success' });
                                          }
                                        } catch (error) {
                                          console.error('Error saving section:', error);
                                          enqueueSnackbar('Failed to save section', { variant: 'error' });
                                        } finally {
                                          setIsSaving(false);
                                        }
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, creatorTiers: false });
                                        enqueueSnackbar('Creator Tiers section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                                {effectiveEditMode && sectionEditStates.creatorTiers && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={() => {
                                        setSectionEditStates({ ...sectionEditStates, creatorTiers: false });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, creatorTiers: false });
                                        enqueueSnackbar('Creator Tiers section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
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
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 400, color: '#3A3A3C' }}>
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

                                              const editor = document.querySelector('[data-creator-tiers-editor]');
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

                                              const editor = document.querySelector('[data-creator-tiers-editor]');
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

                                              const editor = document.querySelector('[data-creator-tiers-editor]');
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
                                          onInput={(e) => setEditableContent({ ...editableContent, creatorTiersDescription: e.currentTarget.innerHTML })}
                                          onKeyDown={(e) => {
                                            const isMod = e.metaKey || e.ctrlKey;
                                            if (isMod) {
                                              const editor = document.querySelector('[data-creator-tiers-editor]');
                                              if (e.key === 'b' || e.key === 'B') {
                                                e.preventDefault();
                                                document.execCommand('bold', false, null);
                                                if (editor) {
                                                  const event = new Event('input', { bubbles: true });
                                                  editor.dispatchEvent(event);
                                                }
                                              } else if (e.key === 'i' || e.key === 'I') {
                                                e.preventDefault();
                                                document.execCommand('italic', false, null);
                                                if (editor) {
                                                  const event = new Event('input', { bubbles: true });
                                                  editor.dispatchEvent(event);
                                                }
                                              } else if (e.key === 'u' || e.key === 'U') {
                                                e.preventDefault();
                                                document.execCommand('underline', false, null);
                                                if (editor) {
                                                  const event = new Event('input', { bubbles: true });
                                                  editor.dispatchEvent(event);
                                                }
                                              }
                                            }
                                          }}
                                          onFocus={(e) => {
                                            // Set initial content if empty
                                            if (!e.currentTarget.innerHTML) {
                                              e.currentTarget.innerHTML = editableContent.creatorTiersDescription || '';
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
                                      dangerouslySetInnerHTML={{ __html: editableContent.creatorTiersDescription }}
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
                                      {isClientView ? 'No content' : 'Click Edit Report to edit Creator Tiers'}
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
                                    averageEngagement: tier.engagementRates.length > 0
                                      ? (tier.engagementRates.reduce((a, b) => a + b, 0) / tier.engagementRates.length).toFixed(1)
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
                                        {tierData.map((tier, index) => (
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
                                              {tier.averageEngagement ? `${tier.averageEngagement}%` : '-'}
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
                        <SortableSection key="strategies" id="strategies" isEditMode={effectiveEditMode}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography
                                  variant="h2"
                                  sx={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontWeight: 400,
                                    fontStyle: 'normal',
                                    fontSize: '56px',
                                    lineHeight: '60px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Strategies Utilised
                                </Typography>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#231F20',
                                  }}
                                />
                                {effectiveEditMode && !sectionEditStates.strategies && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={async () => {
                                        try {
                                          setIsSaving(true);
                                          const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
                                            content: editableContent,
                                          });
                                          if (response.data.success) {
                                            setSectionEditStates({ ...sectionEditStates, strategies: true });
                                            enqueueSnackbar('Strategies Utilised section saved successfully', { variant: 'success' });
                                          }
                                        } catch (error) {
                                          console.error('Error saving section:', error);
                                          enqueueSnackbar('Failed to save section', { variant: 'error' });
                                        } finally {
                                          setIsSaving(false);
                                        }
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, strategies: false });
                                        enqueueSnackbar('Strategies Utilised section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                                {effectiveEditMode && sectionEditStates.strategies && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={() => {
                                        setSectionEditStates({ ...sectionEditStates, strategies: false });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, strategies: false });
                                        enqueueSnackbar('Strategies Utilised section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                              {(() => {
                                if (effectiveEditMode && !sectionEditStates.strategies) {
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
                                          px: 0.5,
                                          py: 0.5,
                                          bgcolor: '#F3F4F6',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#3A3A3C' }}>
                                          Editable
                                        </Typography>
                                      </Box>
                                      <FormattedTextField
                                        value={editableContent.bestPerformingPersonasDescription}
                                        onChange={(e) => setEditableContent({ ...editableContent, bestPerformingPersonasDescription: e.target.value })}
                                        placeholder="type here"
                                        rows={3}
                                        sx={{
                                          border: 'none',
                                        }}
                                      />
                                    </Box>
                                  );
                                }

                                if (editableContent.bestPerformingPersonasDescription) {
                                  return (
                                    <Box
                                      sx={{
                                        fontFamily: 'Aileron',
                                        fontWeight: 400,
                                        fontSize: '20px',
                                        lineHeight: '24px',
                                        color: '#374151',
                                        mb: 4,
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        '& strong': { fontWeight: 700 },
                                        '& em': { fontStyle: 'italic' },
                                        '& u': { textDecoration: 'underline' },
                                      }}
                                      dangerouslySetInnerHTML={{ __html: editableContent.bestPerformingPersonasDescription }}
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
                                      {isClientView ? 'No content' : 'Click Edit Report to edit Creator Personas'}
                                    </Typography>
                                  </Box>
                                );
                              })()}
                              {/* Creator Persona Cards */}
                              {effectiveEditMode && !sectionEditStates.strategies ? (
                                // Edit Mode: Grid layout with cards on left, chart on right
                                <Grid container spacing={2}>
                                  {/* Left side - Persona Cards stacked vertically */}
                                  <Grid item xs={12} md={7}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, ml: 7, width: '100%', minWidth: 0, overflow: 'visible' }}>
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
                                                educatorContentStyle: editableContent.thirdContentStyle,
                                                educatorCreatorCount: editableContent.thirdCreatorCount,
                                                educatorEmoji: editableContent.thirdEmoji,
                                                thirdTitle: '',
                                                thirdContentStyle: '',
                                                thirdCreatorCount: '',
                                                thirdEmoji: ''
                                              });
                                              setShowThirdCard(false);
                                            } else {
                                              setShowEducatorCard(false);
                                              setEditableContent({
                                                ...editableContent,
                                                educatorTitle: '',
                                                educatorContentStyle: '',
                                                educatorCreatorCount: '',
                                                educatorEmoji: ''
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
                                              thirdEmoji: ''
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
                                              fourthEmoji: ''
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
                                              fifthEmoji: ''
                                            });
                                          }}
                                        />
                                      )}


                                      {/* Add Persona Button - Show when there are less than 5 cards */}
                                      {(!showEducatorCard || !showThirdCard || !showFourthCard || !showFifthCard) && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, ml: 2 }}>
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
                                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                              <rect x="32" y="8" width="16" height="64" rx="8" fill="#1340FF" />
                                              <rect x="8" y="32" width="64" height="16" rx="8" fill="#1340FF" />
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
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, ml: 10 }}>
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
                        <SortableSection key="recommendations" id="recommendations" isEditMode={effectiveEditMode}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <Typography
                                  variant="h2"
                                  sx={{
                                    fontFamily: 'Instrument Serif, serif',
                                    fontWeight: 400,
                                    fontStyle: 'normal',
                                    fontSize: '56px',
                                    lineHeight: '60px',
                                    letterSpacing: '0%',
                                    color: '#231F20',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Recommendations
                                </Typography>
                                <Box
                                  sx={{
                                    flex: 1,
                                    height: '1px',
                                    background: '#231F20',
                                  }}
                                />
                                {effectiveEditMode && !sectionEditStates.recommendations && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={async () => {
                                        try {
                                          setIsSaving(true);
                                          const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
                                            content: editableContent,
                                          });
                                          if (response.data.success) {
                                            setSectionEditStates({ ...sectionEditStates, recommendations: true });
                                            enqueueSnackbar('Recommendations section saved successfully', { variant: 'success' });
                                          }
                                        } catch (error) {
                                          console.error('Error saving section:', error);
                                          enqueueSnackbar('Failed to save section', { variant: 'error' });
                                        } finally {
                                          setIsSaving(false);
                                        }
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, recommendations: false });
                                        enqueueSnackbar('Recommendations section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                                {effectiveEditMode && sectionEditStates.recommendations && (
                                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                    <IconButton
                                      onClick={() => {
                                        setSectionEditStates({ ...sectionEditStates, recommendations: false });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#F9F9F9',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
                                    </IconButton>
                                    <IconButton
                                      onClick={() => {
                                        setSectionVisibility({ ...sectionVisibility, recommendations: false });
                                        enqueueSnackbar('Recommendations section removed', { variant: 'info' });
                                      }}
                                      sx={{
                                        width: '46px',
                                        height: '46px',
                                        padding: '8px',
                                        borderRadius: '11px',
                                        border: '1.38px solid #E7E7E7',
                                        backgroundColor: '#FFFFFF',
                                        boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
                                        '&:hover': {
                                          backgroundColor: '#FEE2E2',
                                        }
                                      }}
                                    >
                                      <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>

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
                                      gap: 1
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
                                        textAlign: 'center'
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
                                      gap: 1
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
                                        textAlign: 'center'
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
                                      gap: 1
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
                                        textAlign: 'center'
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
                                      <Box className="hide-in-pdf" sx={{
                                        background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
                                        p: 3,
                                        color: 'white',
                                        height: '120px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '0 0 12px 12px',
                                      }}>
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '20px', opacity: 0.8 }}>
                                          {isClientView ? 'No content' : 'Click Edit Report to edit What Worked Well'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Box className="hide-in-pdf" sx={{
                                        bgcolor: '#1340FFD9',
                                        p: 3,
                                        color: 'white',
                                        height: '120px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '0 0 12px 12px',
                                      }}>
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '20px', opacity: 0.8 }}>
                                          {isClientView ? 'No content' : 'Click Edit Report to edit What Can Be Improved'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Box className="hide-in-pdf" sx={{
                                        bgcolor: '#026D54D9',
                                        p: 3,
                                        color: 'white',
                                        height: '120px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '0 0 12px 12px',
                                      }}>
                                        <Typography sx={{ fontFamily: 'Aileron', fontSize: '20px', opacity: 0.9 }}>
                                          {isClientView ? 'No content' : 'Click Edit Report to edit Next Steps'}
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
                                )
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
                                          borderRadius: rowIndex === editableContent.workedWellInsights.length - 1 ? '0 0 12px 12px' : 0,
                                          position: 'relative',
                                        }}
                                      >
                                        {effectiveEditMode && !sectionEditStates.recommendations ? (
                                          <Box sx={{
                                            bgcolor: '#E5E7EB',
                                            borderRadius: '12px',
                                            p: 2,
                                            flex: 1,
                                            display: 'flex',
                                            gap: 0.5,
                                          }}>
                                            <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  mb: 0.5,
                                                }}
                                              >
                                                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 400, color: '#3A3A3C' }}>
                                                  Editable
                                                </Typography>
                                              </Box>
                                              <TextField
                                                value={editableContent.workedWellInsights[rowIndex]}
                                                onChange={(e) => {
                                                  const newValue = e.target.value;
                                                  const newInsights = [...editableContent.workedWellInsights];
                                                  newInsights[rowIndex] = newValue;
                                                  setEditableContent((prev) => ({ ...prev, workedWellInsights: newInsights }));
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
                                                const newInsights = editableContent.workedWellInsights.filter((__, i) => i !== rowIndex);
                                                setEditableContent({ ...editableContent, workedWellInsights: newInsights });
                                              }}
                                              sx={{ color: '#000000', alignSelf: 'flex-start' }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ) : (
                                          <Typography sx={{
                                            fontFamily: 'Aileron',
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-line',
                                          }}>
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
                                          borderRadius: rowIndex === editableContent.improvedInsights.length - 1 ? '0 0 12px 12px' : 0,
                                          position: 'relative',
                                        }}
                                      >
                                        {effectiveEditMode && !sectionEditStates.recommendations ? (
                                          <Box sx={{
                                            bgcolor: '#E5E7EB',
                                            borderRadius: '12px',
                                            p: 2,
                                            flex: 1,
                                            display: 'flex',
                                            gap: 0.5,
                                          }}>
                                            <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                              <Box
                                                sx={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  mb: 0.5,
                                                }}
                                              >
                                                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 400, color: '#3A3A3C' }}>
                                                  Editable
                                                </Typography>
                                              </Box>
                                              <TextField
                                                value={editableContent.improvedInsights[rowIndex]}
                                                onChange={(e) => {
                                                  const newValue = e.target.value;
                                                  const newInsights = [...editableContent.improvedInsights];
                                                  newInsights[rowIndex] = newValue;
                                                  setEditableContent((prev) => ({ ...prev, improvedInsights: newInsights }));
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
                                                const newInsights = editableContent.improvedInsights.filter((__, i) => i !== rowIndex);
                                                setEditableContent({ ...editableContent, improvedInsights: newInsights });
                                              }}
                                              sx={{ color: '#000000', alignSelf: 'flex-start' }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ) : (
                                          <Typography sx={{
                                            fontFamily: 'Aileron',
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-line',
                                          }}>
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
                                          borderRadius: rowIndex === editableContent.nextStepsInsights.length - 1 ? '0 0 12px 12px' : 0,
                                          position: 'relative',
                                        }}
                                      >
                                        {effectiveEditMode && !sectionEditStates.recommendations ? (
                                          <Box sx={{
                                            bgcolor: '#E5E7EB',
                                            borderRadius: '12px',
                                            p: 2.5,
                                            px: 1,
                                            flex: 1,
                                            display: 'flex',
                                            gap: 0.5,
                                          }}>
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
                                                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 400, color: '#3A3A3C' }}>
                                                  Editable
                                                </Typography>
                                              </Box>
                                              <TextField
                                                value={editableContent.nextStepsInsights[rowIndex]}
                                                onChange={(e) => {
                                                  const newValue = e.target.value;
                                                  const newInsights = [...editableContent.nextStepsInsights];
                                                  newInsights[rowIndex] = newValue;
                                                  setEditableContent((prev) => ({ ...prev, nextStepsInsights: newInsights }));
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
                                                const newInsights = editableContent.nextStepsInsights.filter((__, i) => i !== rowIndex);
                                                setEditableContent({ ...editableContent, nextStepsInsights: newInsights });
                                              }}
                                              sx={{ color: '#000000', alignSelf: 'flex-start' }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ) : (
                                          <Typography sx={{
                                            fontFamily: 'Aileron',
                                            fontSize: '14px',
                                            lineHeight: '20px',
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-line',
                                          }}>
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
                                            workedWellInsights: [...editableContent.workedWellInsights, ''],
                                          });
                                        }}
                                        sx={{
                                          background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
                                          color: 'white',
                                          '&:hover': { background: 'linear-gradient(0deg, #7A4AEE, #7A4AEE)' },
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
                                            improvedInsights: [...editableContent.improvedInsights, ''],
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
                                            nextStepsInsights: [...editableContent.nextStepsInsights, ''],
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
          <Popover
            open={Boolean(emojiPickerAnchor)}
            anchorEl={emojiPickerAnchor}
            onClose={() => {
              setEmojiPickerAnchor(null);
              setEmojiPickerType(null);
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
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
                setEmojiPickerAnchor(null);
                setEmojiPickerType(null);
              }}
            />
          </Popover>

          {/* Preview Modal */}
          <Dialog
            open={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            maxWidth="lg"
            fullWidth
            PaperProps={{
              sx: {
                maxHeight: '90vh',
                borderRadius: '12px',
              }
            }}
          >
            <DialogTitle sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E7E7E7',
              pb: 2
            }}>
              <Typography variant="h5" sx={{ fontFamily: 'Aileron', fontWeight: 600 }}>
                Report Preview
              </Typography>
              <IconButton onClick={() => setIsPreviewOpen(false)}>
                <Iconify icon="mingcute:close-line" width={24} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: '#F5F5F5' }}>
              {previewImages.length > 0 ? (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  p: 3,
                  minHeight: '500px'
                }}>
                  {previewImages.map((imgData, index) => (
                    <Box key={index} sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '800px'
                    }}>
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: -24,
                          left: 0,
                          color: '#6B7280',
                          fontWeight: 600
                        }}
                      >
                        Page {index + 1} of {previewImages.length}
                      </Typography>
                      <Box
                        component="img"
                        src={imgData}
                        alt={`Report Preview - Page ${index + 1}`}
                        sx={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                          border: '1px solid #E5E7EB'
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '500px',
                  p: 4
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Generating preview with page breaks...
                    </Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
          </Dialog>

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
