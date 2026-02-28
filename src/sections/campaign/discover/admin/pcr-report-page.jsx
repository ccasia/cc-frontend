import useSWR from 'swr';
import axios from 'axios';
// eslint-disable-next-line new-cap
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import html2canvas from 'html2canvas';
import { enqueueSnackbar } from 'notistack';
import EmojiPicker from 'emoji-picker-react';
import { useRef, useMemo, useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import { Box, Grid, Link, Button, Avatar, Popover, TextField, Typography, IconButton, InputAdornment, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Modal, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { PieChart } from '@mui/x-charts';

import Iconify from 'src/components/iconify';

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
    const target = e.target;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const value = target.value;
    
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
    const target = e.target;
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
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

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
          <FormatUnderlinedIcon sx={{ fontSize: 16 }}  />
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

const PCRReportPage = ({ campaign, onBack }) => {
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
  
  // Loading and saving states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPCR, setIsLoadingPCR] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  
  // Emoji picker state
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [emojiPickerType, setEmojiPickerType] = useState(null); 
  
  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [isPreviewCached, setIsPreviewCached] = useState(false);
  const [lastPreviewContent, setLastPreviewContent] = useState(null);
  
  const reportRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const displayCardsContainerRef = useRef(null);
  const creatorTiersEditorRef = useRef(null);
  const [cardsHeight, setCardsHeight] = useState(280);
  const [displayCardsHeight, setDisplayCardsHeight] = useState(280);
  
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
    console.log('Manual Entries:', entries);
    return entries;
  }, [manualEntriesData]);

  const { 
    data: insightsData, 
    isLoading: loadingInsights 
  } = useSocialInsights(postingSubmissions, campaignId);

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
        { name: 'comments', value: 0 },
        { name: 'reach', value: 0 },
        { name: 'engagementRate', value: entry.engagementRate || 0 },
      ],
    }));
    console.log('Manual Insights Data:', transformed);
    return transformed;
  }, [manualEntries]);

  const manualSubmissions = useMemo(() => {
    const transformed = manualEntries.map((entry) => ({
      id: entry.id,
      platform: entry.platform,
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
          { name: 'comments', value: 0 },
          { name: 'reach', value: 0 },
          { name: 'engagementRate', value: entry.engagementRate || 0 },
        ],
      },
      engagementRate: entry.engagementRate || 0,
    }));
    console.log('Manual Submissions:', transformed);
    return transformed;
  }, [manualEntries]);

  const filteredInsightsData = useMemo(() => {
    const combined = [...(insightsData || []), ...manualInsightsData];
    console.log('Combined Insights Data:', combined);
    return combined;
  }, [insightsData, manualInsightsData]);

  const filteredSubmissions = useMemo(() => {
    const regularSubmissions = postingSubmissions.filter((sub) => sub && sub.platform);
    const combined = [...regularSubmissions, ...manualSubmissions];
    console.log('Combined Submissions:', combined);
    return combined;
  }, [postingSubmissions, manualSubmissions]);

  const summaryStats = useMemo(() => {
    console.log('=== Calculating Summary Stats ===');
    console.log('filteredInsightsData length:', filteredInsightsData.length);
    console.log('filteredInsightsData:', filteredInsightsData);
    
    if (filteredInsightsData.length === 0) {
      console.log('No insights data, returning zeros');
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
    console.log('Calculated Summary Stats:', stats);
    return stats;
  }, [filteredInsightsData]);

  // Debug logging
  useEffect(() => {
    console.log('PCR Report - Campaign ID:', campaignId);
    console.log('PCR Report - Posting Submissions:', postingSubmissions.length);
    console.log('PCR Report - Insights Data:', insightsData?.length || 0);
    console.log('PCR Report - Loading:', loadingInsights);
    console.log('PCR Report - Summary Stats:', summaryStats);
  }, [campaignId, postingSubmissions, insightsData, loadingInsights, summaryStats]);

  const { data: heatmapApiData, isLoading: heatmapLoading, error: heatmapError } = useSWR(
    campaign?.id ? `/api/campaign/${campaign.id}/trends/engagement-heatmap?platform=All&weeks=6` : null,
    async (url) => {
      console.log('Fetching heatmap from:', url);
      const response = await axios.get(url);
      console.log('Heatmap API response:', response.data);
      return response.data.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      dedupingInterval: 60000,
    }
  );

  // Debug heatmap API state
  console.log('📊 Heatmap API State:', {
    loading: heatmapLoading,
    error: heatmapError,
    hasData: !!heatmapApiData,
    data: heatmapApiData,
  });

  // Load PCR data from backend
  useEffect(() => {
    const loadPCRData = async () => {
      if (!campaign?.id) return;
      
      try {
        setIsLoadingPCR(true);
        console.log('📥 Loading PCR data for campaign:', campaign.id);
        const response = await axios.get(`/api/campaign/${campaign.id}/pcr`);
        
        if (response.data.success && response.data.data.content) {
          console.log('✅ PCR data loaded:', response.data.data.content);
          const loadedContent = response.data.data.content;
          setEditableContent(loadedContent);
          
          // Restore section order and visibility if saved
          if (loadedContent.sectionOrder) {
            setSectionOrder(loadedContent.sectionOrder);
          }
          if (loadedContent.sectionVisibility) {
            setSectionVisibility(loadedContent.sectionVisibility);
          }
          
          // Restore card visibility states based on saved data - check if any field has content
          const hasEducatorContent = (loadedContent.educatorTitle && loadedContent.educatorTitle.trim() !== '') ||
                                    (loadedContent.educatorContentStyle && loadedContent.educatorContentStyle.trim() !== '');
          const hasThirdContent = (loadedContent.thirdTitle && loadedContent.thirdTitle.trim() !== '') ||
                                 (loadedContent.thirdContentStyle && loadedContent.thirdContentStyle.trim() !== '');
          const hasFourthContent = (loadedContent.fourthTitle && loadedContent.fourthTitle.trim() !== '') ||
                                  (loadedContent.fourthContentStyle && loadedContent.fourthContentStyle.trim() !== '');
          const hasFifthContent = (loadedContent.fifthTitle && loadedContent.fifthTitle.trim() !== '') ||
                                 (loadedContent.fifthContentStyle && loadedContent.fifthContentStyle.trim() !== '');
          if (hasEducatorContent) {
            setShowEducatorCard(true);
          }
          if (hasThirdContent) {
            setShowThirdCard(true);
          }
          if (hasFourthContent) {
            setShowFourthCard(true);
          }
          if (hasFifthContent) {
            setShowFifthCard(true);
          }
        } else {
          console.log('ℹ️ No PCR data found, using defaults');
        }
      } catch (error) {
        console.error('❌ Error loading PCR data:', error);
      } finally {
        setIsLoadingPCR(false);
      }
    };
    
    loadPCRData();
  }, [campaign?.id]);
  
  // Helper function to invalidate preview cache
  const invalidatePreviewCache = () => {
    setIsPreviewCached(false);
  };
  
  const saveToHistory = (content, visibility, order, showEducator, showThird, showFourth, showFifth) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify({
      content,
      sectionVisibility: visibility,
      sectionOrder: order,
      showEducatorCard: showEducator,
      showThirdCard: showThird,
      showFourthCard: showFourth,
      showFifthCard: showFifth,
    })));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Invalidate preview cache when content changes
    invalidatePreviewCache();
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setEditableContent(JSON.parse(JSON.stringify(state.content)));
      setSectionVisibility(JSON.parse(JSON.stringify(state.sectionVisibility)));
      setSectionOrder(JSON.parse(JSON.stringify(state.sectionOrder)));
      setShowEducatorCard(state.showEducatorCard);
      setShowThirdCard(state.showThirdCard);
      setShowFourthCard(state.showFourthCard || false);
      setShowFifthCard(state.showFifthCard || false);
      
      // Invalidate preview cache when undoing
      invalidatePreviewCache();
    }
  };
  
  // Generate preview - simulates PDF export view with page breaks
  const handleGeneratePreview = async () => {
    try {
      // Check if content has changed since last preview
      const currentContentHash = JSON.stringify({
        content: editableContent,
        visibility: sectionVisibility,
        order: sectionOrder
      });
      
      // If preview is cached and content hasn't changed, just open the modal
      if (isPreviewCached && lastPreviewContent === currentContentHash && previewImages.length > 0) {
        setIsPreviewOpen(true);
        return;
      }
      
      setIsExportingPDF(true);
      enqueueSnackbar('Generating preview...', { 
        variant: 'info',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });

      // First, temporarily exit edit mode and hide all edit controls
      const wasInEditMode = isEditMode;
      if (wasInEditMode) {
        setIsEditMode(false);
      }
      
      // Wait for React to re-render
      await new Promise(resolve => { setTimeout(resolve, 50); });
      
      const reportContainer = document.getElementById('pcr-report-main');
      if (!reportContainer) {
        console.error('Report container not found');
        if (wasInEditMode) setIsEditMode(true);
        setIsExportingPDF(false);
        return;
      }

      // Hide buttons before capturing
      const buttonsToHide = reportContainer.querySelectorAll('.hide-in-pdf');
      buttonsToHide.forEach(el => {
        el.style.display = 'none';
      });

      // Get all sections
      const sections = reportContainer.querySelectorAll('.pcr-section');
      
      if (sections.length === 0) {
        // Fallback: capture entire report as one page
        const canvas = await html2canvas(reportContainer, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          windowWidth: 1078,
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewImages([imgData]);
      } else {
        // Capture each section separately and organize into pages
        const pageHeight = 297; 
        const pageWidth = 210;
        const margin = 5; 
        const contentWidth = pageWidth - (2 * margin);
        const maxPageHeight = pageHeight - (2 * margin);
        
        const pages = [];
        let currentPage = [];
        let currentPageHeight = 0;
        
        // Batch process sections with yield to UI thread
        const processSections = async () => {
          const results = [];

          for (let i = 0; i < sections.length; i += 1) {
            const section = sections[i];
            
            // Yield to UI thread every 2 sections
            if (i % 2 === 0 && i > 0) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise(resolve => { setTimeout(resolve, 0); });
            }
            
            // Capture this section with high quality for preview
            // eslint-disable-next-line no-await-in-loop
            const canvas = await html2canvas(section, {
              scale: 2, 
              useCORS: true,
              logging: false,
              backgroundColor: '#FFFFFF',
              windowWidth: 1078,
              imageTimeout: 0,
              removeContainer: true,
            });
            
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            results.push({ canvas, imgWidth, imgHeight });
          }
          
          return results;
        };
        
        const sectionResults = await processSections();
        
        // Organize sections into pages
        sectionResults.forEach(({ canvas, imgWidth, imgHeight }) => {
          // Check if section fits on current page
          if (currentPageHeight + imgHeight > maxPageHeight && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
            currentPageHeight = 0;
          }
          
          currentPage.push({
            canvas,
            height: imgHeight,
            width: imgWidth
          });
          currentPageHeight += imgHeight + 4; 
        });
        
        if (currentPage.length > 0) {
          pages.push(currentPage);
        }
        
        // Create page images with gradient background at higher DPI for preview
        const dpi = 150;
        const pageCanvasWidth = (pageWidth * dpi) / 25.4;
        const pageCanvasHeight = (pageHeight * dpi) / 25.4;
        
        const renderPages = async () => {
          const pageImages = [];
          
          // Process pages sequentially
          // eslint-disable-next-line no-restricted-syntax
          for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
            const page = pages[pageIndex];
            
            // Yield to UI thread
            // eslint-disable-next-line no-await-in-loop
            await new Promise(resolve => { setTimeout(resolve, 0); });
            
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = pageCanvasWidth;
            pageCanvas.height = pageCanvasHeight;
            const ctx = pageCanvas.getContext('2d', { alpha: false });
            
            // Draw gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, pageCanvas.height);
            gradient.addColorStop(0, '#1340FF');
            gradient.addColorStop(1, '#8A5AFE');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            
            // Draw sections on this page
            let yOffset = (margin * dpi) / 25.4;
            page.forEach(section => {
              const xOffset = (margin * dpi) / 25.4;
              const sectionWidth = (section.width * dpi) / 25.4;
              const sectionHeight = (section.height * dpi) / 25.4;
              
              ctx.drawImage(section.canvas, xOffset, yOffset, sectionWidth, sectionHeight);
              yOffset += sectionHeight + ((4 * dpi) / 25.4); 
            });
            
            pageImages.push(pageCanvas.toDataURL('image/png', 1.0));
          }
          
          return pageImages;
        };
        
        const pageImages = await renderPages();
        setPreviewImages(pageImages);
      }

      buttonsToHide.forEach(el => {
        el.style.display = '';
      });
      if (wasInEditMode) {
        setIsEditMode(true);
      }

      setLastPreviewContent(currentContentHash);
      setIsPreviewCached(true);
      
      setIsPreviewOpen(true);
      enqueueSnackbar('Preview generated!', { 
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      enqueueSnackbar('Failed to generate preview', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
      
      if (isEditMode === false) {
        setIsEditMode(true);
      }
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      setHistoryIndex(newIndex);
      setEditableContent(JSON.parse(JSON.stringify(state.content)));
      setSectionVisibility(JSON.parse(JSON.stringify(state.sectionVisibility)));
      setSectionOrder(JSON.parse(JSON.stringify(state.sectionOrder)));
      setShowEducatorCard(state.showEducatorCard);
      setShowThirdCard(state.showThirdCard);
      setShowFourthCard(state.showFourthCard || false);
      setShowFifthCard(state.showFifthCard || false);
    }
  };

  // Track changes for undo/redo
  useEffect(() => {
    if (isEditMode && history.length === 0) {
      saveToHistory(editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard, showFourthCard, showFifthCard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  useEffect(() => {
    if (creatorTiersEditorRef.current && editableContent.creatorTiersDescription) {
      const isEditorFocused = document.activeElement === creatorTiersEditorRef.current;
      
      if (!isEditorFocused) {
        creatorTiersEditorRef.current.innerHTML = editableContent.creatorTiersDescription;
      }
    }
  }, [isEditMode, editableContent.creatorTiersDescription]);

  useEffect(() => {
    if (!isEditMode || history.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      const lastState = history[historyIndex];
      const currentState = {
        content: editableContent,
        sectionVisibility,
        sectionOrder,
        showEducatorCard,
        showThirdCard,
        showFourthCard,
        showFifthCard,
      };
      
      if (JSON.stringify(lastState) !== JSON.stringify(currentState)) {
        saveToHistory(editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard, showFourthCard, showFifthCard);
      }
    }, 500); 

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard, showFourthCard, showFifthCard, isEditMode]);

  // Global paste event listener to strip formatting from all pasted content
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Only apply to inputs, textareas, and contentEditable elements within the report
      const target = e.target;
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

  // Measure cards height and update chart height (Edit Mode)
  useEffect(() => {
    const updateCardsHeight = () => {
      if (cardsContainerRef.current && showEducatorCard) {
        // Get the height of first two cards only (comic + educator)
        const comicCard = cardsContainerRef.current.children[0];
        const educatorCard = cardsContainerRef.current.children[1];
        
        if (comicCard && educatorCard) {
          const comicHeight = comicCard.offsetHeight;
          const educatorHeight = educatorCard.offsetHeight;
          const gap = 24; 
          const totalHeight = comicHeight + gap + educatorHeight;
          setCardsHeight(totalHeight);
        }
      } else if (!showEducatorCard) {
        setCardsHeight(280);
      }
    };

    updateCardsHeight();

    const resizeObserver = new ResizeObserver(updateCardsHeight);
    if (cardsContainerRef.current) {
      resizeObserver.observe(cardsContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [showEducatorCard, showThirdCard, showFourthCard, showFifthCard, editableContent.comicContentStyle, editableContent.educatorContentStyle, editableContent.thirdContentStyle, editableContent.fourthContentStyle, editableContent.fifthContentStyle]);

  useEffect(() => {
    const updateDisplayCardsHeight = () => {
      if (displayCardsContainerRef.current && showEducatorCard) {
        // Get the height of first two cards only (comic + educator)
        const comicCard = displayCardsContainerRef.current.children[0];
        const educatorCard = displayCardsContainerRef.current.children[1];
        
        if (comicCard && educatorCard) {
          const comicHeight = comicCard.offsetHeight;
          const educatorHeight = educatorCard.offsetHeight;
          const gap = 24; 
          const totalHeight = comicHeight + gap + educatorHeight;
          setDisplayCardsHeight(totalHeight);
        }
      } else if (!showEducatorCard) {
        setDisplayCardsHeight(280);
      }
    };

    // Update on mount and when content changes
    updateDisplayCardsHeight();

    // Add resize observer to update when card content changes
    const resizeObserver = new ResizeObserver(updateDisplayCardsHeight);
    if (displayCardsContainerRef.current) {
      resizeObserver.observe(displayCardsContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [showEducatorCard, showThirdCard, showFourthCard, showFifthCard, editableContent.comicContentStyle, editableContent.educatorContentStyle, editableContent.thirdContentStyle, editableContent.fourthContentStyle, editableContent.fifthContentStyle]);

  const handleSavePCR = async () => {
    if (!campaign?.id) return;
    
    try {
      setIsSaving(true);
      console.log('Saving PCR data for campaign:', campaign.id);
      
      const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
        content: {
          ...editableContent,
          sectionOrder,
          sectionVisibility,
        },
      });
      
      if (response.data.success) {
        console.log('PCR data saved successfully');
        enqueueSnackbar('PCR saved successfully', { variant: 'success' });
        setIsEditMode(false);
        setHistory([]);
        setHistoryIndex(-1);
        setSectionEditStates({
          campaignDescription: false,
          engagement: false,
          platformBreakdown: false,
          views: false,
          audienceSentiment: false,
          creatorTiers: false,
          strategies: false,
          recommendations: false,
        });
        
        // Reload PCR data to ensure display shows the saved content
        try {
          const loadResponse = await axios.get(`/api/campaign/${campaign.id}/pcr`);
          if (loadResponse.data.success && loadResponse.data.data.content) {
            console.log('✅ PCR data reloaded after save');
            const loadedContent = loadResponse.data.data.content;
            setEditableContent(loadedContent);
            
            // Restore section order and visibility if saved
            if (loadedContent.sectionOrder) {
              setSectionOrder(loadedContent.sectionOrder);
            }
            if (loadedContent.sectionVisibility) {
              setSectionVisibility(loadedContent.sectionVisibility);
            }
            
            // Update card visibility states - check if any field has content
            const hasEducatorContent = (loadedContent.educatorTitle && loadedContent.educatorTitle.trim() !== '') ||
                                      (loadedContent.educatorContentStyle && loadedContent.educatorContentStyle.trim() !== '');
            const hasThirdContent = (loadedContent.thirdTitle && loadedContent.thirdTitle.trim() !== '') ||
                                   (loadedContent.thirdContentStyle && loadedContent.thirdContentStyle.trim() !== '');
            const hasFourthContent = (loadedContent.fourthTitle && loadedContent.fourthTitle.trim() !== '') ||
                                    (loadedContent.fourthContentStyle && loadedContent.fourthContentStyle.trim() !== '');
            const hasFifthContent = (loadedContent.fifthTitle && loadedContent.fifthTitle.trim() !== '') ||
                                   (loadedContent.fifthContentStyle && loadedContent.fifthContentStyle.trim() !== '');
            setShowEducatorCard(hasEducatorContent);
            setShowThirdCard(hasThirdContent);
            setShowFourthCard(hasFourthContent);
            setShowFifthCard(hasFifthContent);
            
            // Force remeasure of card heights after DOM updates
            setTimeout(() => {
              if (cardsContainerRef.current) {
                const comicCard = cardsContainerRef.current.children[0];
                const educatorCard = cardsContainerRef.current.children[1];
                if (comicCard && educatorCard && hasEducatorContent) {
                  const comicHeight = comicCard.offsetHeight;
                  const educatorHeight = educatorCard.offsetHeight;
                  const gap = 24;
                  const totalHeight = comicHeight + gap + educatorHeight;
                  setCardsHeight(totalHeight);
                } else if (!hasEducatorContent) {
                  setCardsHeight(280);
                }
              }
              
              if (displayCardsContainerRef.current) {
                const comicCard = displayCardsContainerRef.current.children[0];
                const educatorCard = displayCardsContainerRef.current.children[1];
                if (comicCard && educatorCard && hasEducatorContent) {
                  const comicHeight = comicCard.offsetHeight;
                  const educatorHeight = educatorCard.offsetHeight;
                  const gap = 24;
                  const totalHeight = comicHeight + gap + educatorHeight;
                  setDisplayCardsHeight(totalHeight);
                } else if (!hasEducatorContent) {
                  setDisplayCardsHeight(280);
                }
              }
            }, 100);
          }
        } catch (loadError) {
          console.error('Error reloading PCR data after save:', loadError);
        }
      }
    } catch (error) {
      console.error('Error saving PCR data:', error);
      enqueueSnackbar(`Failed to save PCR: ${error.response?.data?.message || error.message}`, { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } finally {
      setIsSaving(false);
    }
  };

  // PDF Export function
  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      setIsExportingPDF(true);
      enqueueSnackbar('Generating PDF...', { 
        variant: 'info',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });

      // Get the parent element that includes the gradient border
      const pdfContainer = reportRef.current.parentElement;
      
      // Hide buttons before capturing
      const buttonsToHide = pdfContainer.querySelectorAll('.hide-in-pdf');
      buttonsToHide.forEach(el => {
        el.style.display = 'none';
      });

      // Remove margins from sections (keep border-radius for curved edges)
      const allSections = pdfContainer.querySelectorAll('.pcr-section');
      allSections.forEach(el => {
        el.style.marginBottom = '0';
        // Keep borderRadius for curved edges in PDF
      });

      // Wait for charts to fully render (especially SVG-based charts like PieChart)
      await new Promise(resolve => { setTimeout(resolve, 500); });

      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false, // Disable compression for HD quality
      });

      const pageWidth = 210; 
      const pageHeight = 297; 
      const margin = 5; 
      const contentWidth = pageWidth - (2 * margin);
      
      const addGradientBackground = async () => {
        const gradientCanvas = document.createElement('canvas');
        const dpi = 600; // Ultra-HD DPI (maximum practical quality)
        gradientCanvas.width = (pageWidth * dpi) / 25.4;
        gradientCanvas.height = (pageHeight * dpi) / 25.4;
        const ctx = gradientCanvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, gradientCanvas.height);
        gradient.addColorStop(0, '#1340FF');
        gradient.addColorStop(1, '#8A5AFE');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
        
        const gradientData = gradientCanvas.toDataURL('image/png'); // PNG for lossless quality
        pdf.addImage(gradientData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'SLOW');
      };
      
      const sections = pdfContainer.querySelectorAll('.pcr-section');
      
      if (sections.length === 0) {
        await addGradientBackground();

      const canvas = await html2canvas(pdfContainer, {
          scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: null,
        windowWidth: 1078,
          windowHeight: pdfContainer.scrollHeight,
          imageTimeout: 0,
          removeContainer: true,
          allowTaint: true,
          foreignObjectRendering: false,
          onclone: (clonedDoc) => {
            // Fix all elements to match original styling
            const allElements = clonedDoc.querySelectorAll('*');
            allElements.forEach((el) => {
              try {
                const original = pdfContainer.querySelector(`[data-cursor-element-id="${el.dataset.cursorElementId}"]`) || el;
                const computedStyle = window.getComputedStyle(original);
                
                // Preserve all visual styles
                if (computedStyle.background && computedStyle.background !== 'none') {
                  el.style.background = computedStyle.background;
                }
                if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') {
                  el.style.boxShadow = computedStyle.boxShadow;
                }
                if (computedStyle.borderRadius && computedStyle.borderRadius !== '0px') {
                  el.style.borderRadius = computedStyle.borderRadius;
                }
                if (computedStyle.filter && computedStyle.filter !== 'none') {
                  el.style.filter = computedStyle.filter;
                }
                if (computedStyle.opacity && computedStyle.opacity !== '1') {
                  el.style.opacity = computedStyle.opacity;
                }
                
                // Font rendering
                el.style.webkitFontSmoothing = 'antialiased';
                el.style.mozOsxFontSmoothing = 'grayscale';
                el.style.textRendering = 'optimizeLegibility';
              } catch (e) {
                // Skip if element not found
              }
            });
            
            // Fix images - prevent stretching
            const allImages = clonedDoc.querySelectorAll('img');
            allImages.forEach((img) => {
              img.style.objectFit = 'contain';
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              img.style.display = 'block';
            });
            
            // Fix SVG charts
            const allSvgs = clonedDoc.querySelectorAll('svg');
            allSvgs.forEach((svg) => {
              svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
              svg.style.display = 'block';
              svg.style.visibility = 'visible';
            });
          },
        });

        const imgData = canvas.toDataURL('image/png'); // PNG for lossless quality
        const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight, undefined, 'SLOW');
      } else {
        // Add gradient to first page
        await addGradientBackground();
        
        // Capture each section separately
        let currentY = margin;
        let isFirstSection = true;

        const processPdfSections = async () => {
          for (let i = 0; i < sections.length; i += 1) {
            const section = sections[i];
            
            // Yield to UI thread every 2 sections
            if (i % 2 === 0 && i > 0) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise(resolve => { setTimeout(resolve, 0); });
            }

            // Sequential processing is required for PDF generation
            // eslint-disable-next-line no-await-in-loop
            const canvas = await html2canvas(section, {
              scale: 3, // Higher scale for better quality
              useCORS: true,
              logging: false,
              backgroundColor: '#FFFFFF',
              windowWidth: 1078,
              windowHeight: section.scrollHeight,
              imageTimeout: 0,
              removeContainer: true,
              allowTaint: true,
              foreignObjectRendering: false,
              onclone: (clonedDoc) => {
                // Fix all elements to match original styling
                const allElements = clonedDoc.querySelectorAll('*');
                allElements.forEach((el) => {
                  try {
                    const original = section.querySelector(`[data-cursor-element-id="${el.dataset.cursorElementId}"]`) || el;
                    const computedStyle = window.getComputedStyle(original);
                    
                    // Preserve all visual styles
                    if (computedStyle.background && computedStyle.background !== 'none') {
                      el.style.background = computedStyle.background;
                    }
                    if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') {
                      el.style.boxShadow = computedStyle.boxShadow;
                    }
                    if (computedStyle.borderRadius && computedStyle.borderRadius !== '0px') {
                      el.style.borderRadius = computedStyle.borderRadius;
                    }
                    if (computedStyle.filter && computedStyle.filter !== 'none') {
                      el.style.filter = computedStyle.filter;
                    }
                    if (computedStyle.opacity && computedStyle.opacity !== '1') {
                      el.style.opacity = computedStyle.opacity;
                    }
                    
                    // Font rendering
                    el.style.webkitFontSmoothing = 'antialiased';
                    el.style.mozOsxFontSmoothing = 'grayscale';
                    el.style.textRendering = 'optimizeLegibility';
                  } catch (e) {
                    // Skip if element not found
                  }
                });
                
                // Fix images - prevent stretching
                const allImages = clonedDoc.querySelectorAll('img');
                allImages.forEach((img) => {
                  img.style.objectFit = 'contain';
                  img.style.maxWidth = '100%';
                  img.style.height = 'auto';
                  img.style.display = 'block';
                });
                
                // Fix SVG charts
                const allSvgs = clonedDoc.querySelectorAll('svg');
                allSvgs.forEach((svg) => {
                  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                  svg.style.display = 'block';
                  svg.style.visibility = 'visible';
                });
              },
            });

            const imgData = canvas.toDataURL('image/png'); // PNG for lossless quality
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (currentY + imgHeight > pageHeight - margin && !isFirstSection) {
        pdf.addPage();
              // eslint-disable-next-line no-await-in-loop
              await addGradientBackground();
              currentY = margin;
            }
            
            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight, undefined, 'SLOW');
            currentY += imgHeight + 4; 
            
            isFirstSection = false;
          }
        };
        
        await processPdfSections();
      }

      // Restore buttons and margins
      buttonsToHide.forEach(el => {
        el.style.display = '';
      });
      allSections.forEach(el => {
        el.style.marginBottom = '';
      });

      const fileName = `PCR_${campaign?.name || 'Report'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      enqueueSnackbar('PDF downloaded successfully!', { 
        variant: 'success',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      enqueueSnackbar('Failed to generate PDF', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'center' }
      });
    } finally {
      setIsExportingPDF(false);
    }
  };
  
  // Manual refresh function for insights
  const handleRefreshInsights = async () => {
    try {
      console.log('Triggering manual insights refresh...');
      const response = await axios.post(`/api/campaign/${campaign.id}/trends/refresh`);
      console.log('Refresh response:', response.data);
      alert('Insights refreshed! Please wait a moment and refresh the page.');
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing insights:', error);
      alert(`Failed to refresh insights: ${error.response?.data?.message || error.message}`);
    }
  };

  const EngagementRateHeatmap = () => {

    const top5CreatorsPhases = useMemo(() => {
      // Get campaign posting period from Additional 1 fields
      const postingStartDate = campaign?.campaignBrief?.postingStartDate;
      const postingEndDate = campaign?.campaignBrief?.postingEndDate;
      
      if (!postingStartDate || !postingEndDate) {
        return [];
      }

      const campaignStart = new Date(postingStartDate);
      const campaignEnd = new Date(postingEndDate);
      const campaignDuration = (campaignEnd - campaignStart) / (1000 * 60 * 60 * 24);

      // Phase definitions (Day 7, 15, 30 from campaign start)
      const firstWeekStart = 0; // Day 0
      const firstWeekEnd = 7; // Day 7
      const midPeriodDay = 15; // Day 15
      const finalWeekStart = 25; // Day 25
      const finalWeekEnd = 30; // Day 30

      const creatorPhaseData = new Map();

      // Use snapshot data if available
      if (postSnapshots && postSnapshots.length > 0) {
        console.log('📸 Using snapshot data for heatmap:', postSnapshots.length, 'posts');
        
        postSnapshots.forEach((snapshot) => {
          const userId = snapshot.userId;
          
          if (!creatorPhaseData.has(userId)) {
            // Find the submission to get creator info
            const submission = filteredSubmissions.find(
              (sub) => sub.id === snapshot.submissionId
            );
            
            const username = submission?.user?.username;
            const name = submission?.user?.name;
            const creatorName = submission?.user?.creator?.name;
            const displayName = username || name || creatorName || 'Unknown';
            
            creatorPhaseData.set(userId, {
              userId,
              name: displayName,
              isManualEntry: false,
              day7: null,
              day15: null,
              day30: null,
              overallER: 0,
              snapshotCount: 0,
            });
          }

          const creatorData = creatorPhaseData.get(userId);
          
          // Map snapshot days to phase data
          if (snapshot.snapshots.day7) {
            creatorData.day7 = snapshot.snapshots.day7.er;
            creatorData.overallER += snapshot.snapshots.day7.er;
            creatorData.snapshotCount += 1;
          }
          if (snapshot.snapshots.day15) {
            creatorData.day15 = snapshot.snapshots.day15.er;
            creatorData.overallER += snapshot.snapshots.day15.er;
            creatorData.snapshotCount += 1;
          }
          if (snapshot.snapshots.day30) {
            creatorData.day30 = snapshot.snapshots.day30.er;
            creatorData.overallER += snapshot.snapshots.day30.er;
            creatorData.snapshotCount += 1;
          }
        });

        // Calculate average ER
        const creatorsWithAverages = Array.from(creatorPhaseData.values()).map(creator => {
          const avgER = creator.snapshotCount > 0 
            ? creator.overallER / creator.snapshotCount 
            : 0;

        return {
            userId: creator.userId,
            name: creator.name,
            isManualEntry: creator.isManualEntry,
            firstWeek: creator.day7,
            midPeriod: creator.day15,
            finalWeek: creator.day30,
            overallER: avgER,
            firstPostPhase: 'firstWeek', // All posts have snapshots from day 7
          };
        });

        // Sort by overall ER and take top 5
        const top5 = creatorsWithAverages
          .filter(c => c.overallER > 0)
          .sort((a, b) => b.overallER - a.overallER)
          .slice(0, 5);

        console.log('🏆 Top 5 creators from snapshots:', top5.length);
        return top5;
      }

      // Fallback to old logic if no snapshots available
      console.log('⚠️ No snapshot data available, using current insights');
      creatorPhaseData.clear(); // Clear the map for fallback logic
      
      console.log('📊 Processing insights:', filteredInsightsData.length);
      console.log('📊 Processing submissions:', filteredSubmissions.length);
      
      filteredInsightsData.forEach((insightData, idx) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        if (!submission) {
          console.log(`⚠️ No submission found for insight ${idx}`);
          return;
        }

        // Get post date - prioritize actual post date from Instagram/TikTok
        let postDate = null;
        
        console.log(`\n🔍 Post ${idx} - Looking for date:`);
        console.log('  video object:', insightData.video);
        console.log('  video.taken_at:', insightData.video?.taken_at);
        console.log('  video.timestamp:', insightData.video?.timestamp);
        
        // For Instagram: check video.taken_at field
        if (insightData.video?.taken_at) {
          const takenAt = insightData.video.taken_at;
          console.log('  Trying taken_at:', takenAt, 'type:', typeof takenAt);
          
          // Check if it's already a valid date string or needs conversion
          if (typeof takenAt === 'string') {
            postDate = new Date(takenAt);
          } else if (typeof takenAt === 'number') {
            postDate = new Date(takenAt * 1000);
          }
          
          if (postDate && !Number.isNaN(postDate.getTime())) {
            console.log(`📸 Using Instagram video.taken_at: ${postDate.toISOString()}`);
          } else {
            postDate = null;
          }
        }
        
        // For Instagram: check video.timestamp field
        if (!postDate && insightData.video?.timestamp) {
          const timestamp = insightData.video.timestamp;
          console.log('  Trying timestamp:', timestamp, 'type:', typeof timestamp);
          
          if (typeof timestamp === 'string') {
            postDate = new Date(timestamp);
          } else if (typeof timestamp === 'number') {
            postDate = new Date(timestamp * 1000);
          }
          
          if (postDate && !Number.isNaN(postDate.getTime())) {
            console.log(`📸 Using Instagram video.timestamp: ${postDate.toISOString()}`);
          } else {
            postDate = null;
          }
        }
        
        // For TikTok: use video.create_time field
        if (!postDate && insightData.video?.create_time) {
          const createTime = insightData.video.create_time;
          console.log('  Trying create_time:', createTime, 'type:', typeof createTime);
          
          if (typeof createTime === 'string') {
            postDate = new Date(createTime);
          } else if (typeof createTime === 'number') {
            postDate = new Date(createTime * 1000);
          }
          
          if (postDate && !Number.isNaN(postDate.getTime())) {
            console.log(`📸 Using TikTok video.create_time: ${postDate.toISOString()}`);
          } else {
            postDate = null;
          }
        }
        
        // Fallback to submission created date
        if (!postDate && submission.createdAt) {
          postDate = new Date(submission.createdAt);
          if (postDate && !Number.isNaN(postDate.getTime())) {
            console.log(`📝 Using submission createdAt: ${postDate.toISOString()}`);
            console.log(`⚠️ Warning: Using submission date instead of actual post date!`);
          } else {
            postDate = null;
          }
        }
        
        if (!postDate || Number.isNaN(postDate.getTime())) {
          console.log(`⚠️ No valid post date for submission ${idx}`);
          return;
        }

        const daysFromStart = (postDate - campaignStart) / (1000 * 60 * 60 * 24);
        console.log(`📅 Post ${idx}: ${daysFromStart.toFixed(1)} days from start (${postDate.toISOString()})`);
        console.log(`   Campaign: ${campaignStart.toISOString()} to ${campaignEnd.toISOString()}`);
        
        // Determine which phase this post belongs to
        let phase = null;
        if (daysFromStart >= firstWeekStart && daysFromStart <= firstWeekEnd) {
          phase = 'firstWeek';
        } else if (daysFromStart > firstWeekEnd && daysFromStart < finalWeekStart) {
          phase = 'midPeriod';
        } else if (daysFromStart >= finalWeekStart && daysFromStart <= finalWeekEnd) {
          phase = 'finalWeek';
        }
        
        // Skip posts outside campaign period
        if (!phase || daysFromStart < 0 || daysFromStart > campaignDuration) {
          if (daysFromStart < 0) {
            console.log(`⚠️ Post ${idx} is BEFORE campaign start (${Math.abs(daysFromStart).toFixed(1)} days before)`);
          } else {
            console.log(`⚠️ Post ${idx} is AFTER campaign end (${(daysFromStart - campaignDuration).toFixed(1)} days after)`);
          }
          return;
        }
        
        console.log(`✅ Post ${idx} assigned to ${phase}`);

        // Get creator identifier
        const userId = typeof submission.user === 'string' ? submission.user : submission.user?.id;
        const isManualEntry = userId === submission.id;
        
        if (!userId) return;

        if (!creatorPhaseData.has(userId)) {
          const instagramHandle = submission.user?.creator?.instagram;
          const tiktokHandle = submission.user?.creator?.tiktok;
          const username = submission.user?.username;
          const email = submission.user?.email;
          const name = submission.user?.name;
          const creatorName = submission.user?.creator?.name;
          
          const platformUsername = submission.platform === 'Instagram' 
            ? instagramHandle
            : tiktokHandle;
          
          const displayName = username || name || creatorName || platformUsername || email?.split('@')[0] || 'Unknown';
          
          creatorPhaseData.set(userId, {
            userId,
            name: displayName,
            isManualEntry,
            creatorUsername: platformUsername,
            firstWeek: [],
            midPeriod: [],
            finalWeek: [],
            totalER: 0,
            postCount: 0,
            firstPostPhase: null,
            firstPostDay: null, // Track when they first posted
          });
        }

        const creatorData = creatorPhaseData.get(userId);
        const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));
        
        if (!Number.isNaN(engagementRate) && engagementRate > 0) {
          // Add the ER to the phase where the post was made
          creatorData[phase].push(engagementRate);
          
          // Also add the same ER to all future phases (same post tracked over time)
          if (phase === 'firstWeek') {
            // If posted in first week, also track in mid period and final week
            creatorData.midPeriod.push(engagementRate);
            creatorData.finalWeek.push(engagementRate);
          } else if (phase === 'midPeriod') {
            // If posted in mid period, also track in final week
            creatorData.finalWeek.push(engagementRate);
          }
          // If posted in finalWeek, only track there
          
          creatorData.totalER += engagementRate;
          creatorData.postCount += 1;
          
          // Track first post phase and day
          if (!creatorData.firstPostPhase) {
            creatorData.firstPostPhase = phase;
            creatorData.firstPostDay = daysFromStart;
            console.log(`🎯 Creator's first post: Day ${daysFromStart.toFixed(1)} in ${phase}`);
            console.log(`   → Will track this post's ER (${engagementRate.toFixed(2)}%) across all future periods`);
          }
        }
      });

      // Calculate average ER per phase for each creator and determine which boxes to show
      const creatorsWithAverages = Array.from(creatorPhaseData.values()).map(creator => {
        const firstWeekAvg = creator.firstWeek.length > 0
          ? creator.firstWeek.reduce((a, b) => a + b, 0) / creator.firstWeek.length
          : null;
        
        const midPeriodAvg = creator.midPeriod.length > 0
          ? creator.midPeriod.reduce((a, b) => a + b, 0) / creator.midPeriod.length
          : null;
        
        const finalWeekAvg = creator.finalWeek.length > 0
          ? creator.finalWeek.reduce((a, b) => a + b, 0) / creator.finalWeek.length
          : null;

        // Determine which bars to show based on when they first posted
        let showFirstWeek = false;
        let showMidPeriod = false;
        let showFinalWeek = false;
        
        if (creator.firstPostPhase === 'firstWeek') {
          // Posted in first week → show all 3 bars
          showFirstWeek = true;
          showMidPeriod = true;
          showFinalWeek = true;
        } else if (creator.firstPostPhase === 'midPeriod') {
          // Posted in mid period → show mid period and final week
          showMidPeriod = true;
          showFinalWeek = true;
        } else if (creator.firstPostPhase === 'finalWeek') {
          // Posted in final week → show only final week
          showFinalWeek = true;
        }

        return {
          userId: creator.userId,
          name: creator.name,
          isManualEntry: creator.isManualEntry,
          creatorUsername: creator.creatorUsername,
          // Show bars based on when they first posted, use 0 if no data yet
          firstWeek: showFirstWeek ? (firstWeekAvg || 0) : null,
          midPeriod: showMidPeriod ? (midPeriodAvg || 0) : null,
          finalWeek: showFinalWeek ? (finalWeekAvg || 0) : null,
          overallER: creator.postCount > 0 ? creator.totalER / creator.postCount : 0,
          firstPostPhase: creator.firstPostPhase,
        };
      });

      // Sort by overall ER and take top 5
      const top5 = creatorsWithAverages
        .filter(c => c.overallER > 0)
        .sort((a, b) => b.overallER - a.overallER)
        .slice(0, 5);

      console.log('🏆 Top 5 creators with phase data:', top5.length);
      top5.forEach((c, i) => {
        console.log(`${i + 1}. ${c.name}: Overall ER ${c.overallER.toFixed(2)}% (First posted in: ${c.firstPostPhase})`);
        
        // Format First Week
        let firstWeekDisplay = 'hidden';
        if (c.firstWeek !== null) {
          firstWeekDisplay = c.firstWeek ? `${c.firstWeek.toFixed(2)}%` : '0% (no data)';
        }
        console.log(`   First Week: ${firstWeekDisplay}`);
        
        // Format Mid Period
        let midPeriodDisplay = 'hidden';
        if (c.midPeriod !== null) {
          midPeriodDisplay = c.midPeriod ? `${c.midPeriod.toFixed(2)}%` : '0% (no data)';
        }
        console.log(`   Mid Period: ${midPeriodDisplay}`);
        
        // Format Final Week
        let finalWeekDisplay = 'hidden';
        if (c.finalWeek !== null) {
          finalWeekDisplay = c.finalWeek ? `${c.finalWeek.toFixed(2)}%` : '0% (no data)';
        }
        console.log(`   Final Week: ${finalWeekDisplay}`);
        
        const boxCount = [c.firstWeek, c.midPeriod, c.finalWeek].filter(v => v !== null).length;
        console.log(`   → Will show ${boxCount} bar(s)`);
      });

      return top5;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredInsightsData, filteredSubmissions, campaign, postSnapshots]);

    const creatorIdsToFetch = top5CreatorsPhases
      .filter(c => !c.isManualEntry && c.userId)
      .map(c => c.userId);
    
    const creator0Data = useGetCreatorById(creatorIdsToFetch[0] || null);
    const creator1Data = useGetCreatorById(creatorIdsToFetch[1] || null);
    const creator2Data = useGetCreatorById(creatorIdsToFetch[2] || null);
    const creator3Data = useGetCreatorById(creatorIdsToFetch[3] || null);
    const creator4Data = useGetCreatorById(creatorIdsToFetch[4] || null);
    
    const creatorDataList = [creator0Data, creator1Data, creator2Data, creator3Data, creator4Data]
      .slice(0, creatorIdsToFetch.length);

    const campaignAvg = useMemo(() => {
      if (top5CreatorsPhases.length === 0) {
        return 4.5;
      }
      
      const allCreatorERs = new Map();
      
      filteredInsightsData.forEach((insightData) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        if (!submission) return;
        
        const userId = typeof submission.user === 'string' ? submission.user : submission.user?.id;
        if (!userId) return;
        
        const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));
        if (Number.isNaN(engagementRate) || engagementRate <= 0) return;
        
        if (!allCreatorERs.has(userId)) {
          allCreatorERs.set(userId, { totalER: 0, postCount: 0 });
        }
        
        const creatorData = allCreatorERs.get(userId);
        creatorData.totalER += engagementRate;
        creatorData.postCount += 1;
      });
      
      // Calculate average ER for each creator, then get campaign average
      const creatorAverages = Array.from(allCreatorERs.values()).map(creator => 
        creator.postCount > 0 ? creator.totalER / creator.postCount : 0
      ).filter(avg => avg > 0);
      
      if (creatorAverages.length === 0) return 4.5;
      
      const sumOfCreatorERs = creatorAverages.reduce((sum, avg) => sum + avg, 0);
      const campaignAverage = sumOfCreatorERs / creatorAverages.length;
      
      return campaignAverage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredInsightsData, filteredSubmissions]);

    const getPhaseColor = (rate) => {
      if (rate === null) return '#E5E7EB';
      if (rate >= campaignAvg * 1.1) return '#01197B'; 
      if (rate >= campaignAvg * 0.9) return '#1340FF'; 
      return '#98BBFF'; 
    };

    // Use real data only
    const displayData = top5CreatorsPhases;

    return (
      <Box
        sx={{
          width: '100%',
          height: '376px',
          backgroundColor: '#F5F5F5',
          padding: '24px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Aileron',
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: '24px',
            color: '#231F20',
            mb: 3
          }}
        >
          Top 5 Creator ER Across Posting Period
        </Typography>

        {displayData.length === 0 ? (
          <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
            flex: 1,
            color: '#9CA3AF'
          }}>
            <Typography sx={{ fontFamily: 'Aileron', fontSize: '16px' }}>
              No posting data available
            </Typography>
            </Box>
        ) : (
          /* Creator rows */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayData.map((creator, index) => {
            // Get fetched creator data
            const fetchedCreatorData = creatorDataList[index]?.data;
            
            // Try to get username from fetched data
            let displayName = 'Unknown';
            if (fetchedCreatorData?.user) {
              // Try username field first
              displayName = fetchedCreatorData.user.username || 
                           fetchedCreatorData.user.name || 
                           fetchedCreatorData.user.email?.split('@')[0] ||
                           'Unknown';
            } else if (creator.creatorUsername) {
              displayName = creator.creatorUsername;
            } else if (creator.name && creator.name !== 'Unknown') {
              displayName = creator.name;
            }

                return (
              <Box key={index} sx={{ display: 'flex', alignItems: 'stretch', gap: '0px' }}>
                {/* Creator name */}
                <Box sx={{ 
                  width: '90px', 
                      display: 'flex',
                      alignItems: 'center',
                  pr: 1.5
                }}>
                  <Typography
                sx={{
                      fontFamily: 'Aileron',
                  fontSize: '14px',
                      fontWeight: 400,
                      color: '#000000',
                    }}
                  >
                    {displayName}
                  </Typography>
        </Box>

                {/* Phase boxes */}
                <Box sx={{ display: 'flex', gap: '8px', flex: 1 }}>
                  {/* First Week - show if creator posted in first week */}
                  {creator.firstWeek !== null && (
            <Box 
              sx={{ 
                        flex: 1,
                        height: '40px',
                        backgroundColor: creator.firstWeek ? getPhaseColor(creator.firstWeek) : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography
              sx={{ 
                          fontFamily: 'Aileron',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: creator.firstWeek ? '#FFFFFF' : '#9CA3AF'
                        }}
                      >
                        {creator.firstWeek ? `${creator.firstWeek.toFixed(1)}%` : '-'}
                      </Typography>
            </Box>
                  )}

                  {/* Mid Period - show if creator posted in first week or mid period */}
                  {creator.midPeriod !== null && (
            <Box 
              sx={{ 
                        flex: 1,
                        height: '40px',
                        backgroundColor: creator.midPeriod ? getPhaseColor(creator.midPeriod) : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Typography
              sx={{ 
                          fontFamily: 'Aileron',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: creator.midPeriod ? '#FFFFFF' : '#9CA3AF'
                        }}
                      >
                        {creator.midPeriod ? `${creator.midPeriod.toFixed(1)}%` : '-'}
                      </Typography>
            </Box>
                  )}

                  {/* Final Week - always show (all creators should have this) */}
                  {creator.finalWeek !== null && (
                    <Box
              sx={{ 
                        flex: 1,
                        height: '40px',
                        backgroundColor: creator.finalWeek ? getPhaseColor(creator.finalWeek) : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
            <Typography 
              sx={{ 
                          fontFamily: 'Aileron',
                          fontSize: '16px',
                fontWeight: 600,
                          color: creator.finalWeek ? '#FFFFFF' : '#9CA3AF'
              }}
            >
                        {creator.finalWeek ? `${creator.finalWeek.toFixed(1)}%` : '-'}
          </Typography>
        </Box>
                  )}
        </Box>
              </Box>
            );
          })}
        </Box>
        )}

        {/* Phase labels and legend - only show if there's data */}
        {displayData.length > 0 && (() => {
          // Determine which phases have data across all creators
          const hasFirstWeek = displayData.some(c => c.firstWeek !== null);
          const hasMidPeriod = displayData.some(c => c.midPeriod !== null);
          const hasFinalWeek = displayData.some(c => c.finalWeek !== null);
          
          return (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mt: 'auto' }}>
            <Box sx={{ minWidth: '80px' }} /> 
            <Box sx={{ display: 'flex', gap: '8px', flex: 1 }}>
              {hasFirstWeek && (
                <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                  First Week of Post
                </Typography>
              )}
              {hasMidPeriod && (
                <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                  Mid Posting Period
                </Typography>
              )}
              {hasFinalWeek && (
                <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                  1 Week after P.Period
                </Typography>
              )}
            </Box>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mt: 1 }}>
            <Box sx={{ minWidth: '80px' }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0px', flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#98BBFF', borderRadius: '0px', px: 1.2, py: 0.5 }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                Below Campaign Avg
              </Typography>
            </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#1340FF', borderRadius: '0px', px: 1.2, py: 0.5 }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                Campaign Average
              </Typography>
            </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#01197B', borderRadius: '0px', px: 1.2, py: 0.5 }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '10px', fontWeight: 500, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                Above Campaign Avg
              </Typography>
              </Box>
          </Box>
          </Box>
        </>
          );
        })()}
      </Box>
    );
  };

  const PlatformInteractionsChart = () => {
    const platformData = useMemo(() => {
      console.log('Platform Chart - Insights data:', filteredInsightsData?.length);
      console.log('Platform Chart - Submissions:', filteredSubmissions?.length);
      
      if (!filteredInsightsData || filteredInsightsData.length === 0) {
        console.log('Platform Chart - No data, returning zero values');
        return { instagram: 0, tiktok: 0, total: 0 };
      }

      let instagramInteractions = 0;
      let tiktokInteractions = 0;

      filteredInsightsData.forEach((insightData) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        console.log('Platform Chart - Submission:', submission?.platform, 'Insight:', insightData.insight);
        
        if (submission && insightData.insight) {
          const likes = getMetricValue(insightData.insight, 'likes');
          const comments = getMetricValue(insightData.insight, 'comments');
          const shares = getMetricValue(insightData.insight, 'shares');
          const saved = getMetricValue(insightData.insight, 'saved');
          
          const interactions = likes + comments + shares + saved;

          console.log('Platform Chart - Platform:', submission.platform, 'Interactions:', interactions, 
            '(Likes:', likes, 'Comments:', comments, 'Shares:', shares, 'Saved:', saved, ')');

          if (submission.platform === 'Instagram') {
            instagramInteractions += interactions;
          } else if (submission.platform === 'TikTok') {
            tiktokInteractions += interactions;
          }
        }
      });

      const total = instagramInteractions + tiktokInteractions;
      
      console.log('Platform Chart - Final:', { 
        instagram: instagramInteractions, 
        tiktok: tiktokInteractions, 
        total 
      });
      
      return {
        instagram: instagramInteractions,
        tiktok: tiktokInteractions,
        total
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredInsightsData, filteredSubmissions]);

    const tiktokPercentage = platformData.total > 0 ? (platformData.tiktok / platformData.total) * 100 : 0;
    const instagramPercentage = platformData.total > 0 ? (platformData.instagram / platformData.total) * 100 : 0;
    
    const startAngle = -135; 
    
    const chartData = useMemo(() => [
      { id: 0, value: platformData.tiktok, label: 'TikTok', color: '#000000' },
      { id: 1, value: platformData.instagram, label: 'Instagram', color: '#C13584' },
    ].filter((item) => item.value > 0), [platformData.tiktok, platformData.instagram]);

    return (
      <Box
        sx={{
          width: '335px',
          height: '240px',
          borderRadius: '16px',
          gap: '10px',
          opacity: 1,
          paddingTop: '16px',
          paddingRight: '16px',
          paddingBottom: '20px',
          paddingLeft: '16px',
          background: '#F5F5F5',
          border: '1px solid #F5F5F5',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Aileron',
            fontWeight: 600,
            fontStyle: 'normal',
            fontSize: '20px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'left',
            color: '#231F20',
            mb: 1.5,
            alignSelf: 'flex-start',
          }}
        >
          Platform Interactions
        </Typography>

        {/* Donut Chart with MUI Charts and Custom Leader Lines */}
        <Box sx={{ position: 'relative', width: '100%', height: '160px', overflow: 'visible', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: '20px' }}>
          {/* MUI Charts PieChart - Donut style */}
          <Box sx={{ position: 'absolute', left: '-35px', top: '0' }}>
          <PieChart
              width={200}
              height={160}
            series={[
              {
                data: chartData,
                  innerRadius: 52,
                  outerRadius: 65,
                paddingAngle: 2,
                  cornerRadius: 8,
                  cx: 100,
                  cy: 80,
                startAngle,
              },
            ]}
            slotProps={{
              legend: { hidden: true },
            }}
            sx={{
              '& .MuiChartsArc-root': {
                stroke: 'none',
              },
            }}
          />
          </Box>
          
          
          {/* Center text */}
          <Box
            sx={{
              position: 'absolute',
              top: '80px',
              left: '70px',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Instrument Serif',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '24px',
                lineHeight: '28px',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#000000E5',
                mb: 0.5,
              }}
            >
              {formatNumber(platformData.total)}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontWeight: 600,
                fontStyle: 'normal',
                fontSize: '10px',
                lineHeight: '12px',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#000000E5',
              }}
            >
              Total Interactions
            </Typography>
          </Box>

          {/* Instagram indicator - magenta */}
          {platformData.instagram > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                    width: 10,
                    height: 10,
                  borderRadius: '50%',
                    bgcolor: '#C13584',
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Aileron',
                    fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '16px',
                      color: '#231F20',
                  }}
                >
                    Instagram ({formatNumber(platformData.instagram)})
                </Typography>
                </Box>
              </Box>
              
              {platformData.tiktok > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: '#000000',
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                <Typography
                  sx={{
                    fontFamily: 'Aileron',
                    fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '16px',
                        color: '#231F20',
                  }}
                >
                      TikTok ({formatNumber(platformData.tiktok)})
                </Typography>
              </Box>
                </Box>
              )}
            </Box>
          )}

          {/* TikTok only indicator (when no Instagram) */}
          {platformData.tiktok > 0 && platformData.instagram === 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#000000',
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography
                  sx={{
                    fontFamily: 'Aileron',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '16px',
                    color: '#231F20',
                  }}
                >
                  TikTok ({formatNumber(platformData.tiktok)})
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  const HighestViewWeekChart = () => {
    const weekViewsData = useMemo(() => {
      console.log('Chart - Insights Data:', filteredInsightsData?.length);
      console.log('Chart - Submissions:', filteredSubmissions?.length);
      
      if (!filteredInsightsData || filteredInsightsData.length === 0) {
        console.log('Chart - No data available');
        return [];
      }

      const actualPostDates = filteredInsightsData
        .filter(insight => insight.video?.timestamp || insight.video?.create_time)
        .map(insight => new Date(insight.video.timestamp || insight.video.create_time).getTime());
      
      const earliestActualPost = actualPostDates.length > 0 ? Math.min(...actualPostDates) : Date.now();
      const campaignStart = new Date(campaign?.startDate || earliestActualPost);
      
      console.log('Chart - Campaign Start:', campaignStart);

      const weeklyData = {};
      
      filteredInsightsData.forEach((insightData) => {
        if (insightData.insight && insightData.video) {
          const actualPostTimestamp = insightData.video.timestamp || insightData.video.create_time;
          
          if (actualPostTimestamp) {
            const postDate = new Date(actualPostTimestamp);
            const views = getMetricValue(insightData.insight, 'views');
            
            const daysSinceStart = Math.floor((postDate - campaignStart) / (24 * 60 * 60 * 1000));
            const weekNumber = Math.min(6, Math.max(1, Math.floor(daysSinceStart / 7) + 1));
            
            console.log('Chart - Actual Post Date:', postDate, 'Week:', weekNumber, 'Views:', views);
            
            if (!weeklyData[weekNumber]) {
              weeklyData[weekNumber] = {
                weekNumber,
                totalViews: 0,
                posts: [],
              };
            }
            
            weeklyData[weekNumber].totalViews += views;
            weeklyData[weekNumber].posts.push({
              date: postDate,
              views,
            });
          }
        }
      });

      console.log('Chart - Weekly Data:', weeklyData);

      let highestWeek = null;
      let maxWeekViews = 0;
      
      Object.values(weeklyData).forEach((week) => {
        if (week.totalViews > maxWeekViews) {
          maxWeekViews = week.totalViews;
          highestWeek = week;
        }
      });

      console.log('Chart - Highest Week:', highestWeek?.weekNumber, 'Views:', maxWeekViews);

      if (!highestWeek) {
        console.log('Chart - No highest week found');
        return [];
      }

      const firstPostDate = new Date(Math.min(...highestWeek.posts.map(p => new Date(p.date).getTime())));
      const dayOfWeek = firstPostDate.getDay(); 
      
      // Calculate Monday of that week
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; 
      const weekStartDate = new Date(firstPostDate);
      weekStartDate.setDate(firstPostDate.getDate() - daysToMonday);
      weekStartDate.setHours(0, 0, 0, 0);
      
      console.log('Chart - First post date:', firstPostDate);
      console.log('Chart - Week start (Monday):', weekStartDate);
      
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const weekData = [];

      const totalWeekViews = highestWeek.totalViews;
      
      const distributionPattern = [0.12, 0.15, 0.18, 0.22, 0.15, 0.10, 0.08]; 
      
      for (let i = 0; i < 7; i += 1) {
        const currentDate = new Date(weekStartDate);
        currentDate.setDate(currentDate.getDate() + i);
        currentDate.setHours(0, 0, 0, 0);
        
        // Calculate if this day is on or after the first post in this week
        const firstPostDateStart = new Date(firstPostDate);
        firstPostDateStart.setHours(0, 0, 0, 0);
        const isAfterFirstPost = currentDate >= firstPostDateStart;
        
        let dailyViews = 0;
        
        // Only distribute views to days after the first post
        if (isAfterFirstPost) {
          dailyViews = Math.round(totalWeekViews * distributionPattern[i]);
        }
        
        weekData.push({
          day: dayNames[i],
          date: `(${currentDate.getDate()}/${currentDate.getMonth() + 1})`,
          views: dailyViews,
          dailyViews,
        });
      }

      console.log('Chart - Week Data (Monday-Sunday, 7 days):', weekData);
      return weekData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredInsightsData, filteredSubmissions, campaign]);

    // If no data, show message
    if (!weekViewsData || weekViewsData.length === 0) {
      return (
        <Box sx={{ width: '100%', p: 4, textAlign: 'center' }}>
          <Typography sx={{ color: '#6B7280', fontSize: '16px' }}>
            No view data available for the campaign yet.
          </Typography>
        </Box>
      );
    }

      const chartWidth = 1400;
      const chartHeight = 480;
      const padding = { top: 80, right: 60, bottom: 150, left: 60 };
      const innerWidth = chartWidth - padding.left - padding.right;
      const innerHeight = chartHeight - padding.top - padding.bottom;

    const maxViews = Math.max(...weekViewsData.map(d => d.views));
    const minViews = Math.min(...weekViewsData.map(d => d.views));
    const viewsRange = maxViews - minViews || 1;

    // Generate path points
    const points = weekViewsData.map((d, i) => {
      const x = padding.left + (i / (weekViewsData.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((d.views - minViews) / viewsRange) * innerHeight;
      return { x, y, ...d };
    });

    // Create SVG path
    const pathData = points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    return (
      <Box sx={{ width: '100%', p: -4 }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke="#2D7A7B"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points and labels */}
          {points.map((point, i) => {
            // Place labels below the data points
            const labelY = point.y + 40;
            const labelX = point.x;
            
            return (
              <g key={i}>
                {/* Outer circle (white) */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill="white"
                  stroke="#2D7A7B"
                  strokeWidth="4"
                />
                
                {/* Value label below point - white fill with green outline and shadow */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill="white"
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="Aileron"
                  stroke="#2D7A7B"
                  strokeWidth="2"
                  paintOrder="stroke"
                  style={{ 
                    filter: 'drop-shadow(4px 5px 3px #026D54) drop-shadow(2px 3px 8px #026D54)'
                  }}
                >
                  {point.views}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {points.map((point, i) => (
            <g key={`label-${i}`}>
              {/* Day name */}
              <text
                x={point.x}
                y={chartHeight - 75}
                textAnchor="middle"
                fill="#231F20"
                fontSize="18"
                fontWeight="400"
                fontFamily="Aileron"
              >
                {point.day}
              </text>
              {/* Date */}
              <text
                x={point.x}
                y={chartHeight - 45}
                textAnchor="middle"
                fill="#231F20"
                fontSize="18"
                fontWeight="400"
                fontFamily="Aileron"
              >
                {point.date}
              </text>
            </g>
          ))}
        </svg>
      </Box>
    );
  };

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

  // TopCreatorViewsChart component - Top 5 Creator Total Views
  const TopCreatorViewsChart = () => {
    // Calculate top 5 creators by total views
    const top5Creators = useMemo(() => {
      const creatorsWithViews = [];
      
      filteredInsightsData.forEach((insightData) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        if (submission) {
          const views = getMetricValue(insightData.insight, 'views');
          if (views > 0) {
            creatorsWithViews.push({
              submission,
              insightData,
              views,
              platform: insightData.platform || submission.platform || 'Unknown'
            });
          }
        }
      });
      
      // Sort by views and take top 5
      return creatorsWithViews
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    }, []);

    // Get creator data for top 5
    const creatorIds = top5Creators.map(c => c.submission.user);
    
    // Call hooks for each creator ID (up to 5 creators)
    const viewsCreator0Data = useGetCreatorById(creatorIds[0] || null);
    const viewsCreator1Data = useGetCreatorById(creatorIds[1] || null);
    const viewsCreator2Data = useGetCreatorById(creatorIds[2] || null);
    const viewsCreator3Data = useGetCreatorById(creatorIds[3] || null);
    const viewsCreator4Data = useGetCreatorById(creatorIds[4] || null);
    
    const creatorDataList = [viewsCreator0Data, viewsCreator1Data, viewsCreator2Data, viewsCreator3Data, viewsCreator4Data]
      .slice(0, creatorIds.length);

    if (top5Creators.length === 0) {
      return (
        <Box sx={{ 
          padding: '24px',
          bgcolor: '#F5F5F7', 
          borderRadius: '12px',
          height: '100%',
            display: 'flex',
            alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography sx={{ 
            fontFamily: 'Aileron', 
            fontSize: '14px', 
            color: '#9CA3AF',
            fontStyle: 'italic'
          }}>
            No view data available
          </Typography>
        </Box>
      );
    }

    // Find max views for bar width calculation
    const maxViews = Math.max(...top5Creators.map(c => c.views));

    return (
      <Box sx={{ 
        padding: '24px',
        bgcolor: '#F5F5F7', 
        borderRadius: '12px',
        height: '100%'
      }}>
        <Typography sx={{
          fontFamily: 'Aileron',
          fontWeight: 600,
          fontSize: '20px',
          lineHeight: '24px',
          color: '#000000',
          mb: 3
        }}>
          Top 5 Creator Total Views
        </Typography>
        
        {/* Bar Chart */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mt: 1 }}>
          {top5Creators.map((creator, index) => {
            const creatorData = creatorDataList[index]?.data;
            
            // Try multiple sources for username with comprehensive fallbacks
            let username = null;
            if (creator.platform === 'Instagram') {
              username = creatorData?.user?.creator?.instagram 
                || creator.submission.user?.creator?.instagram 
                || creator.submission.user?.username
                || creator.submission.user?.name
                || creatorData?.user?.username
                || creatorData?.user?.name;
            } else {
              username = creatorData?.user?.creator?.tiktok 
                || creator.submission.user?.creator?.tiktok 
                || creator.submission.user?.username
                || creator.submission.user?.name
                || creatorData?.user?.username
                || creatorData?.user?.name;
            }
            
            // Gradient colors from darkest to lightest purple
            const barColors = ['#8A5AFE', '#9D75FE', '#B090FE', '#C3ABFE', '#D6C6FE'];
            const barColor = barColors[index] || '#D6C6FE';
            
            return (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Platform Icon and Username on top */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box 
                    component="img"
                    src={creator.platform === 'Instagram' 
                      ? '/assets/Icon copy.svg' 
                      : '/assets/Icon.svg'}
                    alt={creator.platform === 'Instagram' ? 'Instagram' : 'TikTok'}
        sx={{
                      width: '11px',
                      height: '12px',
                      display: 'inline-block'
                    }}
                  />
                  <Link
                    href={creator.submission.postingLink || '#'}
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
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#636366',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#1340FF'
                      }
                    }}>
                      {username || 'Unknown'}
        </Typography>
                  </Link>
                </Box>

                {/* Progress bar and value on bottom */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Box sx={{ flex: 1, maxWidth: '360px' }}>
                    <Box sx={{
                      height: '32px',
                      backgroundColor: barColor,
                      borderRadius: '16px',
                      position: 'relative',
                      width: `${(creator.views / maxViews) * 100}%`,
                      minWidth: '60px',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography sx={{
                    fontFamily: 'Aileron',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1340FF',
                    minWidth: '50px',
                    textAlign: 'right'
                  }}>
                    {creator.views >= 1000 ? `${(creator.views / 1000).toFixed(0)}K` : creator.views}
          </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  // TopCreatorViews48HChart component 
  const TopCreatorViews48HChart = () => {
    const top5Creators = useMemo(() => {
      const creatorsWithViews = [];
      
      filteredInsightsData.forEach((insightData) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        if (submission) {
          const views = getMetricValue(insightData.insight, 'views');
          if (views > 0) {
            creatorsWithViews.push({
              submission,
              insightData,
              views,
              platform: insightData.platform || submission.platform || 'Unknown'
            });
          }
        }
      });
      
      // Sort by views and take top 5
      return creatorsWithViews
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
    }, []);

    // Get creator data for top 5
    const creatorIds = top5Creators.map(c => c.submission.user);
    
    // Call hooks for each creator ID (up to 5 creators)
    const views48hCreator0Data = useGetCreatorById(creatorIds[0] || null);
    const views48hCreator1Data = useGetCreatorById(creatorIds[1] || null);
    const views48hCreator2Data = useGetCreatorById(creatorIds[2] || null);
    const views48hCreator3Data = useGetCreatorById(creatorIds[3] || null);
    const views48hCreator4Data = useGetCreatorById(creatorIds[4] || null);
    
    const creatorDataList = [views48hCreator0Data, views48hCreator1Data, views48hCreator2Data, views48hCreator3Data, views48hCreator4Data]
      .slice(0, creatorIds.length);

    if (top5Creators.length === 0) {
      return (
        <Box sx={{ 
          padding: '24px',
          bgcolor: '#F5F5F7', 
          borderRadius: '12px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography sx={{ 
            fontFamily: 'Aileron', 
            fontSize: '14px', 
            color: '#9CA3AF',
            fontStyle: 'italic'
          }}>
            No view data available
          </Typography>
        </Box>
      );
    }

    // Find max views for bar width calculation
    const maxViews = Math.max(...top5Creators.map(c => c.views));

    return (
      <Box sx={{ 
        padding: '24px',
        bgcolor: '#F5F5F7', 
        borderRadius: '12px',
        height: '100%'
      }}>
        <Typography sx={{
          fontFamily: 'Aileron',
          fontWeight: 600,
          fontSize: '20px',
          lineHeight: '24px',
          color: '#000000',
          mb: 3
        }}>
          Top 5 Creator Views after 48H of Posting
        </Typography>
        
        {/* Bar Chart */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px', mt: 1 }}>
          {top5Creators.map((creator, index) => {
            const creatorData = creatorDataList[index]?.data;
            
            // Try multiple sources for username with comprehensive fallbacks
            let username = null;
            if (creator.platform === 'Instagram') {
              username = creatorData?.user?.creator?.instagram 
                || creator.submission.user?.creator?.instagram 
                || creator.submission.user?.username
                || creator.submission.user?.name
                || creatorData?.user?.username
                || creatorData?.user?.name;
            } else {
              username = creatorData?.user?.creator?.tiktok 
                || creator.submission.user?.creator?.tiktok 
                || creator.submission.user?.username
                || creator.submission.user?.name
                || creatorData?.user?.username
                || creatorData?.user?.name;
            }
            
            const opacity = 1 - (index * 0.1);
            
            return (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Platform Icon and Username on top */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box 
                    component="img"
                    src={creator.platform === 'Instagram' 
                      ? '/assets/Icon copy.svg' 
                      : '/assets/Icon.svg'}
                    alt={creator.platform === 'Instagram' ? 'Instagram' : 'TikTok'}
              sx={{
                      width: '11px',
                      height: '12px',
                      display: 'inline-block'
                    }}
                  />
                  <Link
                    href={creator.submission.postingLink || '#'}
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
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#636366',
                      cursor: 'pointer',
                      '&:hover': {
                        color: '#1340FF'
                      }
                    }}>
                      {username || 'Unknown'}
                    </Typography>
                  </Link>
                </Box>

                {/* Progress bar and value on bottom */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Box sx={{ flex: 1, maxWidth: '360px' }}>
                    <Box sx={{
                      height: '32px',
                      backgroundColor: '#1340FF',
                      opacity,
                      borderRadius: '16px',
                      position: 'relative',
                      width: `${(creator.views / maxViews) * 100}%`,
                      minWidth: '60px',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography sx={{
                    fontFamily: 'Aileron',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1340FF',
                    minWidth: '50px',
                    textAlign: 'right'
                  }}>
                    {creator.views >= 1000 ? `${(creator.views / 1000).toFixed(1)}K` : creator.views}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  // TopEngagementCard component - Top 5 Creator Engagement Rate
  const TopEngagementCard = () => {
    const top5Creators = useMemo(() => {
      const creatorsWithEngagement = [];
      
      filteredInsightsData.forEach((insightData) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        if (submission) {
          const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));
          if (!Number.isNaN(engagementRate) && engagementRate > 0) {
            creatorsWithEngagement.push({
              submission,
              insightData,
              engagementRate,
              platform: insightData.platform || 'Unknown'
            });
          }
        }
      });
      
      // Sort by engagement rate and take top 5
      return creatorsWithEngagement
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 5);
    }, []);

    // Get creator data for top 5
    const creatorIds = top5Creators.map(c => c.submission.user);
    
    // Call hooks for each creator ID (up to 5 creators)
    const engagementCreator0Data = useGetCreatorById(creatorIds[0] || null);
    const engagementCreator1Data = useGetCreatorById(creatorIds[1] || null);
    const engagementCreator2Data = useGetCreatorById(creatorIds[2] || null);
    const engagementCreator3Data = useGetCreatorById(creatorIds[3] || null);
    const engagementCreator4Data = useGetCreatorById(creatorIds[4] || null);
    
    const creatorDataList = [engagementCreator0Data, engagementCreator1Data, engagementCreator2Data, engagementCreator3Data, engagementCreator4Data]
      .slice(0, creatorIds.length);

    // Find max engagement rate for bar width calculation
    const maxEngagementRate = top5Creators.length > 0 ? Math.max(...top5Creators.map(c => c.engagementRate)) : 0;

    return (
            <Box
              sx={{
          width: '100%',
          height: '376px',
          backgroundColor: '#F5F5F5',
          padding: '24px',
          borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography
          sx={{
            fontFamily: 'Aileron',
            fontWeight: 600,
            fontSize: '20px',
            lineHeight: '24px',
            color: '#231F20',
            mb: 1.5
          }}
          >
          Top 5 Creator Engagement Rate
              </Typography>

        {top5Creators.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flex: 1,
            color: '#9CA3AF'
          }}>
            <Typography sx={{ fontFamily: 'Aileron', fontSize: '16px' }}>
              No engagement data available
              </Typography>
            </Box>
        ) : (
        /* Creator bars */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-around', py: 1 }}>
          {top5Creators.map((creator, index) => {
            const creatorData = creatorDataList[index]?.data;
            
            // Try multiple sources for username with comprehensive fallbacks
            let username = null;
            if (creator.platform === 'Instagram') {
              username = creatorData?.user?.creator?.instagram 
                || creator.submission.user?.creator?.instagram 
                || creator.submission.user?.username
                || creator.submission.user?.name
                || creatorData?.user?.username
                || creatorData?.user?.name;
            } else {
              username = creatorData?.user?.creator?.tiktok 
                || creator.submission.user?.creator?.tiktok 
                || creator.submission.user?.username
                || creator.submission.user?.name
                || creatorData?.user?.username
                || creatorData?.user?.name;
            }
            
            const platform = creator.platform;
            const engagementRate = creator.engagementRate;

            const barWidth = (engagementRate / maxEngagementRate) * 100;
            
            // Bar colors based on rank
            const barColors = ['#8E8E93', '#636366', '#48484A', '#3A3A3C', '#1C1C1E'];
            const barColor = barColors[index] || '#1C1C1E';

            return (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Username and platform icon */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Box 
                    component="img"
                    src={platform === 'Instagram' 
                      ? '/assets/Icon copy.svg' 
                      : '/assets/Icon.svg'}
                    alt={platform === 'Instagram' ? 'Instagram' : 'TikTok'}
            sx={{
                      width: '11px',
                      height: '12px',
                      display: 'inline-block'
                    }}
                  />
          <Link
                    href={creator.submission.postingLink || '#'}
            target="_blank"
                    rel="noopener noreferrer"
            sx={{
              textDecoration: 'none',
              '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Aileron',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#636366',
                        lineHeight: '16px',
                        cursor: 'pointer',
                        '&:hover': {
                          color: '#1340FF'
                        }
                      }}
                    >
                      {username || 'Unknown'}
                    </Typography>
                  </Link>
        </Box>

                {/* Progress bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box sx={{ flex: 1, maxWidth: '360px' }}>
                    <Box 
              sx={{
                        height: '24px',
                        backgroundColor: barColor,
                        borderRadius: '12px',
                        position: 'relative',
                        width: `${barWidth}%`,
                        minWidth: '50px'
              }}
            />
        </Box>
                  <Typography
                    sx={{
                      fontFamily: 'Aileron',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1340FF',
                      minWidth: '45px',
                      textAlign: 'right'
                    }}
                  >
                    {engagementRate}%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
        )}
      </Box>
    );
  };

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
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {isEditMode ? (
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
      </Box>
      
      {/* Add Section Buttons - Only show in edit mode */}
      {isEditMode && (
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
            src="/logo/CC.svg"
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
        if (isEditMode) {
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
              Click Edit Report to edit Campaign Description
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
            {formatNumber(filteredSubmissions?.length || 0)}
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
                 <SortableSection key="engagement" id="engagement" isEditMode={isEditMode}>
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
        {isEditMode && !sectionEditStates.engagement && (
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
        {isEditMode && sectionEditStates.engagement && (
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
        if (isEditMode && !sectionEditStates.engagement) {
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
              Click Edit Report to edit Engagement
      </Typography>
          </Box>
        );
      })()}

      {/* Analytics Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Top 5 Creator Engagement Rate */}
        <Grid item xs={12} md={6}>
          <TopEngagementCard />
        </Grid>

        {/* Top 5 Creator ER Across Campaign Phases */}
        <Grid item xs={12} md={6}>
          <EngagementRateHeatmap />
        </Grid>
      </Grid>
    </Box>
    </Box>
                </SortableSection>
              );

              case 'platformBreakdown':
                return (
                 <SortableSection key="platformBreakdown" id="platformBreakdown" isEditMode={isEditMode}>
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
        {isEditMode && !sectionEditStates.platformBreakdown && (
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
        {isEditMode && sectionEditStates.platformBreakdown && (
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
        if (isEditMode && !sectionEditStates.platformBreakdown) {
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
              Click Edit Report to edit Platform Breakdown
        </Typography>
          </Box>
        );
      })()}
      
      {/* Platform Breakdown Grid */}
      <Grid container spacing={3}>
        {/* Platform Interactions Chart - Left */}
            <Grid item xs={12} md={4}>
          <PlatformInteractionsChart />
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
                const platform = mostLikesCreator.platform;
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
                const platform = mostSharesCreator.platform;
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
                 <SortableSection key="views" id="views" isEditMode={isEditMode}>
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
        {isEditMode && !sectionEditStates.views && (
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
        {isEditMode && sectionEditStates.views && (
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
        if (isEditMode && !sectionEditStates.views) {
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
              Click Edit Report to edit Views
        </Typography>
      </Box>
        );
      })()}
      
        {/* Views Charts Grid */}
        <Grid container spacing={3}>
          {/* Top 5 Creator Total Views - Left */}
          <Grid item xs={12} md={6}>
            <TopCreatorViewsChart />
        </Grid>

          {/* Top 5 Creator Views after 48H of Posting - Right */}
          <Grid item xs={12} md={6}>
            <TopCreatorViews48HChart />
        </Grid>
      </Grid>
    </Box>
                    </Box>
                </SortableSection>
          );

              case 'audienceSentiment':
                return (
                 <SortableSection key="audienceSentiment" id="audienceSentiment" isEditMode={isEditMode}>
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
        {isEditMode && !sectionEditStates.audienceSentiment && (
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
        {isEditMode && sectionEditStates.audienceSentiment && (
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
        if (isEditMode && !sectionEditStates.audienceSentiment) {
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
              Click Edit Report to edit Audience Sentiment
        </Typography>
          </Box>
        );
      })()}
      
      {/* Positive Comments */}
      {(isEditMode || editableContent.positiveComments.length > 0) && (
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
          {isEditMode && !sectionEditStates.audienceSentiment ? (
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
                    let {value} = e.target;
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
      {(isEditMode || editableContent.neutralComments.length > 0) && (
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
          {isEditMode && !sectionEditStates.audienceSentiment ? (
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
                    let {value} = e.target;
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
                 <SortableSection key="creatorTiers" id="creatorTiers" isEditMode={isEditMode}>
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
        {isEditMode && !sectionEditStates.creatorTiers && (
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
        {isEditMode && sectionEditStates.creatorTiers && (
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
          if (isEditMode && !sectionEditStates.creatorTiers) {
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
                Click Edit Report to edit Creator Tiers
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
              // Get tier from shortlisted record (tier at assignment time)
              const tier = shortlisted?.creditTier;
              if (tier) {
                const tierName = tier.name || 'Unknown';
                
                // Get engagement rates from all submissions/insights for this creator
                const userSubmissions = submissions.filter(sub => sub.userId === shortlisted.userId);
                const engagementRates = [];
                
                // Get ER from insights data
                userSubmissions.forEach(submission => {
                  const insightData = filteredInsightsData.find(
                    insight => insight.submissionId === submission.id
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
                tierDataMap.get(tierName).engagementRates.push(...engagementRates);
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
                 <SortableSection key="strategies" id="strategies" isEditMode={isEditMode}>
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
        {isEditMode && !sectionEditStates.strategies && (
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
        {isEditMode && sectionEditStates.strategies && (
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
        if (isEditMode && !sectionEditStates.strategies) {
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
              Click Edit Report to edit Creator Personas
            </Typography>
          </Box>
        );
      })()}
      {/* Creator Persona Cards */}
      {isEditMode && !sectionEditStates.strategies ? (
        // Edit Mode: Grid layout with cards on left, chart on right
      <Grid container spacing={2}>
        {/* Left side - Persona Cards stacked vertically */}
        <Grid item xs={12} md={7}>
          <Box ref={cardsContainerRef} sx={{ display: 'flex', flexDirection: 'column', gap: 3, ml: 7, width: '100%', minWidth: 0, overflow: 'visible' }}>
        {/* The Comic Card */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Card */}
          <Box
            sx={{
              width: '480px',
              height: isEditMode ? '280px' : '189px',
              borderRadius: '20px',
              background: '#F5F5F5',
              border: '10px solid #FFFFFF',
              boxShadow: '0px 4px 4px 0px #8E8E9340',
              position: 'relative',
              transition: 'height 0.3s ease',
            }}
          >

          {/* Circle with Icon - Positioned as separate component */}
          <Box
            sx={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '8px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: '-70px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              boxShadow: '-4px 4px 4px 0px #8E8E9340',
            }}
          >
            {/* Editable label for emoji */}
            {isEditMode && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#F3F4F6',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#3A3A3C' }}>
                  Editable
                </Typography>
              </Box>
            )}
            {/* Inner gradient circle */}
            <Box
              onClick={(e) => {
                if (isEditMode) {
                  setEmojiPickerAnchor(e.currentTarget);
                  setEmojiPickerType('comic');
                }
              }}
              sx={{
                width: '95px',
                height: '95px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1340FF 0%, #1340FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                cursor: isEditMode ? 'pointer' : 'default',
                '&:hover': isEditMode ? {
                  opacity: 0.8,
                } : {},
              }}
            >
              {editableContent.comicEmoji}
            </Box>
          </Box>

          {/* Content - Positioned independently */}
          <Box 
            sx={{ 
              position: 'absolute',
              right: '24px',
              left: '82px', // Space for circle + padding
              top: isEditMode ? '20px' : '50%',
              transform: isEditMode ? 'none' : 'translateY(-50%)',
               maxWidth: 'calc(480px - 106px)', // Card width minus circle space and padding
              transition: 'top 0.3s ease, transform 0.3s ease',
            }}
          >
            {isEditMode ? (
              <Box sx={{ position: 'relative', mb: 0.75 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
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
                value={editableContent.comicTitle}
                onChange={(e) => setEditableContent({ ...editableContent, comicTitle: e.target.value })}
                  fullWidth
                  inputProps={{
                    maxLength: 30,
                    style: {
                      fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                      color: '#0067D5',
                      textAlign: 'left',
                    }
                  }}
                sx={{
                    bgcolor: '#E5E7EB',
                    borderRadius: '8px',
                    '& .MuiInputBase-root': {
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                    color: '#0067D5',
                    textAlign: 'left',
                      padding: '8px',
                      paddingLeft: '6px',
                      paddingTop: '26px',
                      height: '56px',
                  },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                }}
              />
              </Box>
            ) : (
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '36px',
                  lineHeight: '40px',
                  letterSpacing: '0%',
                  color: '#0067D5',
                  mb: 1.5,
                  textAlign: 'center',
                  ml: -3,
                }}
              >
                {editableContent.comicTitle}
              </Typography>
            )}
            
            {isEditMode && (
              <>
                <Box sx={{ position: 'relative', mb: 0.75 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
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
                  value={editableContent.comicContentStyle}
                  onChange={(e) => setEditableContent({ ...editableContent, comicContentStyle: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                  sx={{
                      bgcolor: '#E5E7EB',
                      borderRadius: '8px',
                      '& .MuiInputBase-root': {
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '18px',
                      color: '#000000',
                        padding: '8px',
                        paddingTop: '26px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                    },
                  }}
                />
                </Box>

                <Box>
                <Typography
                  sx={{
                      fontFamily: 'Aileron', 
                    fontSize: '14px',
                      fontWeight: 600, 
                      color: '#636366',
                      mb: 1
                  }}
                >
                    Number of Creators
                </Typography>
                <TextField
                    value={editableContent.creatorStrategyCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers
                      if (value === '' || /^\d+$/.test(value)) {
                        setEditableContent({ ...editableContent, creatorStrategyCount: value });
                      }
                    }}
                    placeholder="Number of Creators"
                  fullWidth
                  inputProps={{
                      maxLength: 3,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                      style: {
                        fontFamily: 'Aileron',
                        fontSize: '14px',
                        color: '#000000',
                      }
                  }}
            sx={{
                        bgcolor: '#FFFFFF',
                      borderRadius: '8px',
                      '& .MuiInputBase-root': {
                          padding: '12px',
                          height: '48px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E5E7EB',
                    },
                  }}
                />
                </Box>
              </>
              )}
          </Box>
          </Box>
            </Box>

        {/* Educator Card - Show below comic card when visible */}
          {showEducatorCard && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
          {/* Card */}
          <Box
                sx={{
              width: '480px',
              height: isEditMode ? '280px' : '189px',
              borderRadius: '20px',
              background: '#F5F5F5',
              border: '10px solid #FFFFFF',
              boxShadow: '0px 4px 4px 0px #8E8E9340',
              position: 'relative',
              transition: 'height 0.3s ease',
            }}
          >

          {/* Circle with Icon - Positioned as separate component */}
          <Box
            sx={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '8px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: '-70px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              boxShadow: '-4px 4px 4px 0px #8E8E9340',
            }}
          >
            {/* Editable label for emoji */}
            {isEditMode && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#F3F4F6',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#3A3A3C' }}>
                  Editable
              </Typography>
              </Box>
            )}
            {/* Inner gradient circle */}
            <Box
              onClick={(e) => {
                if (isEditMode) {
                  setEmojiPickerAnchor(e.currentTarget);
                  setEmojiPickerType('educator');
                }
              }}
              sx={{
                width: '95px',
                height: '95px',
                borderRadius: '50%',
                background: '#8A5AFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                cursor: isEditMode ? 'pointer' : 'default',
                '&:hover': isEditMode ? {
                  opacity: 0.8,
                } : {},
              }}
            >
              {editableContent.educatorEmoji}
            </Box>
          </Box>

          {/* Content - Positioned independently */}
          <Box 
            sx={{ 
              position: 'absolute',
              right: '24px',
              left: '82px', // Space for circle + padding
              top: isEditMode ? '20px' : '50%',
              transform: isEditMode ? 'none' : 'translateY(-50%)',
               maxWidth: 'calc(480px - 106px)', // Card width minus circle space and padding
              transition: 'top 0.3s ease, transform 0.3s ease',
            }}
          >
              {isEditMode ? (
              <Box sx={{ position: 'relative', mb: 0.75 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
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
                value={editableContent.educatorTitle}
                onChange={(e) => setEditableContent({ ...editableContent, educatorTitle: e.target.value })}
                  fullWidth
                  inputProps={{
                    maxLength: 30,
                    style: {
                      fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                      color: '#0067D5',
                      textAlign: 'left',
                    }
                  }}
                  sx={{
                      bgcolor: '#E5E7EB',
                      borderRadius: '8px',
                      '& .MuiInputBase-root': {
                    fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                    color: '#0067D5',
                    textAlign: 'left',
                        padding: '8px',
                      paddingLeft: '6px',
                        paddingTop: '26px',
                      height: '56px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                    },
                  }}
                />
                </Box>
              ) : (
                <Typography
                  sx={{
                  fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                  fontSize: '36px',
                  lineHeight: '40px',
                    letterSpacing: '0%',
                  color: '#0067D5',
                  mb: 1.5,
                  textAlign: 'center',
                  ml: -3,
                  }}
                >
                {editableContent.educatorTitle}
                </Typography>
              )}
            
            {isEditMode && (
              <>
                <Box sx={{ position: 'relative', mb: 0.75 }}>
                  <Box
              sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
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
                  value={editableContent.educatorContentStyle}
                  onChange={(e) => setEditableContent({ ...editableContent, educatorContentStyle: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
            sx={{
                      bgcolor: '#E5E7EB',
                      borderRadius: '8px',
                      '& .MuiInputBase-root': {
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '18px',
                      color: '#000000',
                        padding: '8px',
                        paddingTop: '26px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
              },
            }}
                />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#636366', mb: 1 }}>
                    Number of Creators
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      value={editableContent.educatorCreatorCount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === '' || /^\d+$/.test(value)) {
                          setEditableContent({ ...editableContent, educatorCreatorCount: value });
                        }
                      }}
                      placeholder="Number of Creators"
              sx={{
                        flex: 1,
                        bgcolor: '#FFFFFF',
                        borderRadius: '8px',
                        '& .MuiInputBase-root': {
                          padding: '12px',
                          height: '48px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E5E7EB',
                        },
                      }}
                      inputProps={{
                        maxLength: 3,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        style: {
                          fontFamily: 'Aileron',
                    fontSize: '14px',
                    color: '#000000',
                        }
                      }}
                    />
          <IconButton
            onClick={() => {
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
                // No third card, just hide educator
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
            sx={{
                        color: '#000000',
                        width: '48px',
                        height: '48px',
                        padding: 0,
              '&:hover': {
                          opacity: 0.7,
              },
            }}
          >
                      <img src="/assets/delete.svg" alt="Delete" style={{ width: '20px', height: '20px' }} />
          </IconButton>
            </Box>
          </Box>
              </>
              )}
          </Box>
        </Box>
        </Box>
        )}

        {/* Third Persona Card - Only show if showThirdCard is true */}
        {showThirdCard && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, ml: 0, position: 'relative', width: '100%', minWidth: 0, overflow: 'visible' }}>
          {/* Card */}
          <Box
            sx={{
              width: isEditMode ? '910px' : '860px',
              minWidth: '470px',
              flexShrink: 0,
              height: isEditMode ? '280px' : '189px',
              borderRadius: '20px',
              background: '#F5F5F5',
              border: '10px solid #FFFFFF',
              boxShadow: '0px 4px 4px 0px #8E8E9340',
              position: 'relative',
              transition: 'height 0.3s ease',
              overflow: 'visible',
            }}
          >
          {/* Circle with Icon - Positioned as separate component */}
          <Box
            sx={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '8px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: '-60px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              boxShadow: '-4px 4px 4px 0px #8E8E9340',
            }}
          >
            {/* Editable label for emoji */}
            {isEditMode && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#F3F4F6',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#3A3A3C' }}>
                  Editable
                </Typography>
              </Box>
            )}
            {/* Inner gradient circle */}
            <Box
              onClick={(e) => {
                if (isEditMode) {
                  setEmojiPickerAnchor(e.currentTarget);
                  setEmojiPickerType('third');
                }
              }}
              sx={{
                width: '95px',
                height: '95px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF3500 0%, #FF3500 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                cursor: isEditMode ? 'pointer' : 'default',
                '&:hover': isEditMode ? {
                  opacity: 0.8,
                } : {},
              }}
            >
              {editableContent.thirdEmoji}
            </Box>
          </Box>

          {/* Content - Positioned independently */}
          <Box 
            sx={{ 
              position: 'absolute',
              right: '12px',
              left: '70px', // Space for circle
              top: isEditMode ? '20px' : '50%',
              transform: isEditMode ? 'none' : 'translateY(-50%)',
               maxWidth: isEditMode ? 'calc(920px - 82px)' : 'calc(860px - 82px)', // Card width minus circle space
              transition: 'top 0.3s ease, transform 0.3s ease',
              overflow: 'visible',
            }}
          >
            {isEditMode ? (
              <Box sx={{ position: 'relative', mb: 0.75 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
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
                value={editableContent.thirdTitle}
                onChange={(e) => setEditableContent({ ...editableContent, thirdTitle: e.target.value })}
                  fullWidth
                  inputProps={{
                    maxLength: 30,
                    style: {
                      fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                      color: '#0067D5',
                      textAlign: 'left',
                    }
                  }}
                sx={{
                    bgcolor: '#E5E7EB',
                    borderRadius: '8px',
                    '& .MuiInputBase-root': {
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                    color: '#0067D5',
                    textAlign: 'left',
                      padding: '8px',
                      paddingLeft: '6px',
                      paddingTop: '26px',
                      height: '56px',
                  },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                }}
              />
              </Box>
            ) : (
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '36px',
                  lineHeight: '40px',
                  letterSpacing: '0%',
                  color: '#0067D5',
                  mb: 1.5,
                  textAlign: 'center',
                  ml: -3,
                }}
              >
                {editableContent.thirdTitle}
              </Typography>
            )}
            
            {isEditMode && (
              <>
                <Box sx={{ position: 'relative', mb: 0.75 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
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
                  value={editableContent.thirdContentStyle}
                  onChange={(e) => setEditableContent({ ...editableContent, thirdContentStyle: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                  sx={{
                      bgcolor: '#E5E7EB',
                      borderRadius: '8px',
                      '& .MuiInputBase-root': {
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '18px',
                      color: '#000000',
                        padding: '8px',
                        paddingTop: '26px',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                    },
                  }}
                />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#636366', mb: 1 }}>
                    Number of Creators
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      value={editableContent.thirdCreatorCount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === '' || /^\d+$/.test(value)) {
                          setEditableContent({ ...editableContent, thirdCreatorCount: value });
                        }
                      }}
                      placeholder="Number of Creators"
                  sx={{
                        flex: 1,
                        bgcolor: '#FFFFFF',
                        borderRadius: '8px',
                        '& .MuiInputBase-root': {
                          padding: '12px',
                          height: '48px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E5E7EB',
                        },
                      }}
                      inputProps={{
                        maxLength: 3,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        style: {
                          fontFamily: 'Aileron',
                    fontSize: '14px',
                    color: '#000000',
                        }
                      }}
                    />
                    <IconButton
                      onClick={() => {
                        setShowThirdCard(false);
                        setEditableContent({
                          ...editableContent,
                          thirdTitle: '',
                          thirdContentStyle: '',
                          thirdCreatorCount: '',
                          thirdEmoji: ''
                        });
                      }}
                      sx={{
                        color: '#000000',
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        '&:hover': {
                          opacity: 0.7,
                        },
                  }}
                >
                      <img src="/assets/delete.svg" alt="Delete" style={{ width: '20px', height: '20px' }} />
                    </IconButton>
                  </Box>
                </Box>
              </>
              )}
            </Box>
          </Box>
          </Box>
        )}

        {/* Fourth Persona Card - Only show if showFourthCard is true */}
        {showFourthCard && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, ml: 0, position: 'relative', width: '100%', minWidth: 0, overflow: 'visible' }}>
          {/* Card */}
          <Box
            sx={{
              width: isEditMode ? '910px' : '860px',
              minWidth: '470px',
              flexShrink: 0,
              height: isEditMode ? '280px' : '189px',
              borderRadius: '20px',
              background: '#F5F5F5',
              border: '10px solid #FFFFFF',
              boxShadow: '0px 4px 4px 0px #8E8E9340',
              position: 'relative',
              transition: 'height 0.3s ease',
              overflow: 'visible',
            }}
          >
          {/* Circle with Icon - Positioned as separate component */}
          <Box
            sx={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '8px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: '-60px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              boxShadow: '-4px 4px 4px 0px #8E8E9340',
            }}
          >
            {/* Editable label for emoji */}
            {isEditMode && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#F3F4F6',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#3A3A3C' }}>
                  Editable
                </Typography>
              </Box>
            )}
            {/* Inner gradient circle */}
            <Box
              onClick={(e) => {
                if (isEditMode) {
                  setEmojiPickerAnchor(e.currentTarget);
                  setEmojiPickerType('fourth');
                }
              }}
              sx={{
                width: '95px',
                height: '95px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #D8FF01 0%, #D8FF01 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                cursor: isEditMode ? 'pointer' : 'default',
                '&:hover': isEditMode ? {
                  opacity: 0.8,
                } : {},
              }}
            >
              {editableContent.fourthEmoji}
            </Box>
          </Box>

          {/* Content - Positioned independently */}
          <Box 
            sx={{ 
              position: 'absolute',
              right: '12px',
              left: '70px', // Space for circle
              top: isEditMode ? '20px' : '50%',
              transform: isEditMode ? 'none' : 'translateY(-50%)',
               maxWidth: isEditMode ? 'calc(920px - 82px)' : 'calc(860px - 82px)', // Card width minus circle space
              transition: 'top 0.3s ease, transform 0.3s ease',
              overflow: 'visible',
            }}
          >
            {isEditMode ? (
              <Box sx={{ position: 'relative', mb: 0.75 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
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
                value={editableContent.fourthTitle}
                onChange={(e) => setEditableContent({ ...editableContent, fourthTitle: e.target.value })}
                  fullWidth
                  inputProps={{
                    maxLength: 30,
                    style: {
                      fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                      color: '#0067D5',
                      textAlign: 'left',
                    }
                  }}
                sx={{
                    bgcolor: '#E5E7EB',
                    borderRadius: '8px',
                    '& .MuiInputBase-root': {
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                    color: '#0067D5',
                    textAlign: 'left',
                      padding: '8px',
                      paddingLeft: '6px',
                      paddingTop: '26px',
                      height: '56px',
                  },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                }}
              />
              </Box>
            ) : (
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '36px',
                  lineHeight: '40px',
                  letterSpacing: '0%',
                  color: '#0067D5',
                  mb: 1.5,
                  textAlign: 'center',
                  ml: -3,
                }}
              >
                {editableContent.fourthTitle}
              </Typography>
            )}
            
            {isEditMode && (
              <>
                <Box sx={{ position: 'relative', mb: 0.75 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
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
                  value={editableContent.fourthContentStyle}
                  onChange={(e) => setEditableContent({ ...editableContent, fourthContentStyle: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                    inputProps={{
                      maxLength: 200,
                      style: {
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#000000',
                        textAlign: 'left',
                      }
                    }}
                  sx={{
                    bgcolor: '#E5E7EB',
                    borderRadius: '8px',
                      '& .MuiInputBase-root': {
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#000000',
                      textAlign: 'left',
                        padding: '8px',
                        paddingLeft: '6px',
                        paddingTop: '26px',
                    },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                  }}
                />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#636366', mb: 1 }}>
                    Number of Creators
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      value={editableContent.fourthCreatorCount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === '' || /^\d+$/.test(value)) {
                          setEditableContent({ ...editableContent, fourthCreatorCount: value });
                        }
                      }}
                      placeholder="Number of Creators"
                  sx={{
                        flex: 1,
                        bgcolor: '#FFFFFF',
                        borderRadius: '8px',
                        '& .MuiInputBase-root': {
                          padding: '12px',
                          height: '48px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E5E7EB',
                        },
                      }}
                      inputProps={{
                        maxLength: 3,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        style: {
                          fontFamily: 'Aileron',
                    fontSize: '14px',
                    color: '#000000',
                        }
                      }}
                    />
                    <IconButton
                      onClick={() => {
                        setShowFourthCard(false);
                        setEditableContent({
                          ...editableContent,
                          fourthTitle: '',
                          fourthContentStyle: '',
                          fourthCreatorCount: '',
                          fourthEmoji: ''
                        });
                      }}
                      sx={{
                        color: '#000000',
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        '&:hover': {
                          opacity: 0.7,
                        },
                  }}
                >
                      <img src="/assets/delete.svg" alt="Delete" style={{ width: '20px', height: '20px' }} />
                    </IconButton>
                  </Box>
                </Box>
              </>
              )}
            </Box>
          </Box>
          </Box>
        )}

        {/* Fifth Persona Card - Only show if showFifthCard is true */}
        {showFifthCard && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, ml: 0, position: 'relative', width: '100%', minWidth: 0, overflow: 'visible' }}>
          {/* Card */}
          <Box
            sx={{
              width: isEditMode ? '910px' : '860px',
              minWidth: '470px',
              flexShrink: 0,
              height: isEditMode ? '280px' : '189px',
              borderRadius: '20px',
              background: '#F5F5F5',
              border: '10px solid #FFFFFF',
              boxShadow: '0px 4px 4px 0px #8E8E9340',
              position: 'relative',
              transition: 'height 0.3s ease',
              overflow: 'visible',
            }}
          >
          {/* Circle with Icon - Positioned as separate component */}
          <Box
            sx={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '8px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: '-60px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1,
              boxShadow: '-4px 4px 4px 0px #8E8E9340',
            }}
          >
            {/* Editable label for emoji */}
            {isEditMode && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: '#F3F4F6',
                  px: 1,
                  py: 0.5,
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: 600, color: '#3A3A3C' }}>
                  Editable
                </Typography>
              </Box>
            )}
            {/* Inner gradient circle */}
            <Box
              onClick={(e) => {
                if (isEditMode) {
                  setEmojiPickerAnchor(e.currentTarget);
                  setEmojiPickerType('fifth');
                }
              }}
              sx={{
                width: '95px',
                height: '95px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #026D54 0%, #026D54 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                cursor: isEditMode ? 'pointer' : 'default',
                '&:hover': isEditMode ? {
                  opacity: 0.8,
                } : {},
              }}
            >
              {editableContent.fifthEmoji}
            </Box>
          </Box>

          {/* Content - Positioned independently */}
          <Box 
            sx={{ 
              position: 'absolute',
              right: '12px',
              left: '70px', // Space for circle
              top: isEditMode ? '20px' : '50%',
              transform: isEditMode ? 'none' : 'translateY(-50%)',
               maxWidth: isEditMode ? 'calc(920px - 82px)' : 'calc(860px - 82px)', // Card width minus circle space
              transition: 'top 0.3s ease, transform 0.3s ease',
              overflow: 'visible',
            }}
          >
            {isEditMode ? (
              <Box sx={{ position: 'relative', mb: 0.75 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
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
                value={editableContent.fifthTitle}
                onChange={(e) => setEditableContent({ ...editableContent, fifthTitle: e.target.value })}
                  fullWidth
                  inputProps={{
                    maxLength: 30,
                    style: {
                      fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                      color: '#0067D5',
                      textAlign: 'left',
                    }
                  }}
                sx={{
                    bgcolor: '#E5E7EB',
                    borderRadius: '8px',
                    '& .MuiInputBase-root': {
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                      fontSize: '28px',
                      lineHeight: '32px',
                    color: '#0067D5',
                    textAlign: 'left',
                      padding: '8px',
                      paddingLeft: '6px',
                      paddingTop: '26px',
                      height: '56px',
                  },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                }}
              />
              </Box>
            ) : (
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '36px',
                  lineHeight: '40px',
                  letterSpacing: '0%',
                  color: '#0067D5',
                  mb: 1.5,
                  textAlign: 'center',
                  ml: -3,
                }}
              >
                {editableContent.fifthTitle}
              </Typography>
            )}
            
            {isEditMode && (
              <>
                <Box sx={{ position: 'relative', mb: 0.75 }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
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
                  value={editableContent.fifthContentStyle}
                  onChange={(e) => setEditableContent({ ...editableContent, fifthContentStyle: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                    inputProps={{
                      maxLength: 200,
                      style: {
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#000000',
                        textAlign: 'left',
                      }
                    }}
                  sx={{
                    bgcolor: '#E5E7EB',
                    borderRadius: '8px',
                      '& .MuiInputBase-root': {
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '20px',
                        color: '#000000',
                      textAlign: 'left',
                        padding: '8px',
                        paddingLeft: '6px',
                        paddingTop: '26px',
                    },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                  }}
                />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#636366', mb: 1 }}>
                    Number of Creators
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      value={editableContent.fifthCreatorCount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only allow numbers
                        if (value === '' || /^\d+$/.test(value)) {
                          setEditableContent({ ...editableContent, fifthCreatorCount: value });
                        }
                      }}
                      placeholder="Number of Creators"
                  sx={{
                        flex: 1,
                        bgcolor: '#FFFFFF',
                        borderRadius: '8px',
                        '& .MuiInputBase-root': {
                          padding: '12px',
                          height: '48px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#E5E7EB',
                        },
                      }}
                      inputProps={{
                        maxLength: 3,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        style: {
                          fontFamily: 'Aileron',
                    fontSize: '14px',
                    color: '#000000',
                        }
                      }}
                    />
                    <IconButton
                      onClick={() => {
                        setShowFifthCard(false);
                        setEditableContent({
                          ...editableContent,
                          fifthTitle: '',
                          fifthContentStyle: '',
                          fifthCreatorCount: '',
                          fifthEmoji: ''
                        });
                      }}
                      sx={{
                        color: '#000000',
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        '&:hover': {
                          opacity: 0.7,
                        },
                  }}
                >
                      <img src="/assets/delete.svg" alt="Delete" style={{ width: '20px', height: '20px' }} />
                    </IconButton>
                  </Box>
                </Box>
              </>
              )}
            </Box>
          </Box>
          </Box>
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
                <rect x="32" y="8" width="16" height="64" rx="8" fill="#1340FF"/>
                <rect x="8" y="32" width="64" height="16" rx="8" fill="#1340FF"/>
              </svg>
            </IconButton>
        </Box>
        )}
        </Box>
        </Grid>

        {/* Right side - Creator Strategy Breakdown Chart */}
        <Grid item xs={12} md={5} sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <Box
            sx={{
              bgcolor: '#F5F5F5',
              borderRadius: '16px',
              p: 2,
              width: '400px',
              height: (() => {
                // Calculate height based on number of visible cards
                const visibleCards = 1 + (showEducatorCard ? 1 : 0) + (showThirdCard ? 1 : 0) + (showFourthCard ? 1 : 0) + (showFifthCard ? 1 : 0);
                if (visibleCards === 1) return '220px';
                if (visibleCards === 2) return '580px';
                if (visibleCards === 3) return '580px';
                if (visibleCards === 4) return '580px';
                if (visibleCards === 5) return '580px';
                return '460px'; // fallback
              })(),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              ml: -1,
            }}
          >
              <Typography
                sx={{
                fontFamily: 'Aileron',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: '22px',
                color: '#231F20',
                textAlign: 'left',
                mb: 2,
                }}
              >
              Creator Strategy Breakdown
              </Typography>

            {/* Circle and Legend Layout */}
            <Box sx={{ display: 'flex', flexDirection: (showEducatorCard || showThirdCard) ? 'column' : 'row', alignItems: 'center', gap: (showEducatorCard || showThirdCard) ? 0.5 : 2, flex: 1 }}>
              {/* Full Circle Chart or Pie Chart */}
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: (showEducatorCard || showThirdCard) ? 1 : 'none' }}>
                {(() => {
                  // Render different chart based on number of personas
                  if (showThirdCard) {
                    return (
                  <>
                    <svg width="360" height="360" viewBox="0 0 160 160">
                        {(() => {
                          const comicCount = parseInt(editableContent.creatorStrategyCount, 10) || 1;
                          const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || (showEducatorCard ? 1 : 0);
                          const thirdCount = parseInt(editableContent.thirdCreatorCount, 10) || (showThirdCard ? 1 : 0);
                          const fourthCount = parseInt(editableContent.fourthCreatorCount, 10) || (showFourthCard ? 1 : 0);
                          const fifthCount = parseInt(editableContent.fifthCreatorCount, 10) || (showFifthCard ? 1 : 0);
                          const total = comicCount + educatorCount + thirdCount + fourthCount + fifthCount;
                          const comicPercentage = comicCount / total;
                          const educatorPercentage = educatorCount / total;
                          const thirdPercentage = thirdCount / total;
                          const fourthPercentage = fourthCount / total;
                          const fifthPercentage = fifthCount / total;
                          
                          // Calculate cumulative angles
                          const comicAngle = comicPercentage * 2 * Math.PI;
                          const educatorAngle = educatorPercentage * 2 * Math.PI;
                          const thirdAngle = thirdPercentage * 2 * Math.PI;
                          const fourthAngle = fourthPercentage * 2 * Math.PI;
                          const fifthAngle = fifthPercentage * 2 * Math.PI;
                          
                          let currentAngle = 0;
                          const comicEndAngle = currentAngle + comicAngle;
                          const comicEndX = 80 + 70 * Math.sin(comicEndAngle);
                          const comicEndY = 80 - 70 * Math.cos(comicEndAngle);
                          const comicLargeArc = comicAngle > Math.PI ? 1 : 0;
                          
                          currentAngle = comicEndAngle;
                          const educatorEndAngle = currentAngle + educatorAngle;
                          const educatorEndX = 80 + 70 * Math.sin(educatorEndAngle);
                          const educatorEndY = 80 - 70 * Math.cos(educatorEndAngle);
                          const educatorLargeArc = educatorAngle > Math.PI ? 1 : 0;
                          
                          currentAngle = educatorEndAngle;
                          const thirdEndAngle = currentAngle + thirdAngle;
                          const thirdEndX = 80 + 70 * Math.sin(thirdEndAngle);
                          const thirdEndY = 80 - 70 * Math.cos(thirdEndAngle);
                          const thirdLargeArc = thirdAngle > Math.PI ? 1 : 0;
                          
                          currentAngle = thirdEndAngle;
                          const fourthEndAngle = currentAngle + fourthAngle;
                          const fourthEndX = 80 + 70 * Math.sin(fourthEndAngle);
                          const fourthEndY = 80 - 70 * Math.cos(fourthEndAngle);
                          const fourthLargeArc = fourthAngle > Math.PI ? 1 : 0;
                          
                          currentAngle = fourthEndAngle;
                          const fifthEndAngle = currentAngle + fifthAngle;
                          const fifthEndX = 80 + 70 * Math.sin(fifthEndAngle);
                          const fifthEndY = 80 - 70 * Math.cos(fifthEndAngle);
                          const fifthLargeArc = fifthAngle > Math.PI ? 1 : 0;
                          
                          const comicMidAngle = comicAngle / 2;
                          const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                          const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                          
                          const educatorMidAngle = comicAngle + educatorAngle / 2;
                          const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                          const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                          
                          const thirdMidAngle = comicAngle + educatorAngle + thirdAngle / 2;
                          const thirdTextX = 80 + 35 * Math.sin(thirdMidAngle);
                          const thirdTextY = 80 - 35 * Math.cos(thirdMidAngle);
                          
                          const fourthMidAngle = comicAngle + educatorAngle + thirdAngle + fourthAngle / 2;
                          const fourthTextX = 80 + 35 * Math.sin(fourthMidAngle);
                          const fourthTextY = 80 - 35 * Math.cos(fourthMidAngle);
                          
                          const fifthMidAngle = comicAngle + educatorAngle + thirdAngle + fourthAngle + fifthAngle / 2;
                          const fifthTextX = 80 + 35 * Math.sin(fifthMidAngle);
                          const fifthTextY = 80 - 35 * Math.cos(fifthMidAngle);
                          
                          return (
                            <>
                              {/* Comic segment (blue) */}
                              <path
                                d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`}
                                fill="#1340FF"
                              />
                              {/* Educator segment (purple) */}
                              {showEducatorCard && (
                                <path
                                  d={`M 80 80 L ${comicEndX} ${comicEndY} A 70 70 0 ${educatorLargeArc} 1 ${educatorEndX} ${educatorEndY} Z`}
                                  fill="#8A5AFE"
                                />
                              )}
                              {/* Third segment (orange-red) */}
                              {showThirdCard && (
                                <path
                                  d={`M 80 80 L ${educatorEndX} ${educatorEndY} A 70 70 0 ${thirdLargeArc} 1 ${thirdEndX} ${thirdEndY} Z`}
                                  fill="#FF3500"
                                />
                              )}
                              {/* Fourth segment (yellow-green) */}
                              {showFourthCard && (
                                <path
                                  d={`M 80 80 L ${thirdEndX} ${thirdEndY} A 70 70 0 ${fourthLargeArc} 1 ${fourthEndX} ${fourthEndY} Z`}
                                  fill="#D8FF01"
                                />
                              )}
                              {/* Fifth segment (teal) - closes the circle */}
                              {showFifthCard && (
                                <path
                                  d={`M 80 80 L ${fourthEndX} ${fourthEndY} A 70 70 0 ${fifthLargeArc} 1 80 10 Z`}
                                  fill="#026D54"
                                />
                              )}
                              {/* If no fifth card, close with the last visible segment */}
                              {!showFifthCard && showFourthCard && (
                                <path
                                  d={`M 80 80 L ${fourthEndX} ${fourthEndY} A 70 70 0 ${fifthLargeArc} 1 80 10 Z`}
                                  fill="#026D54"
                                  opacity="0"
                                />
                              )}
                              {!showFifthCard && !showFourthCard && showThirdCard && (
                                <path
                                  d={`M 80 80 L ${thirdEndX} ${thirdEndY} A 70 70 0 0 1 80 10 Z`}
                                  fill="#FF3500"
                                  opacity="0"
                                />
                              )}
                              {/* Comic number */}
                              <text
                                x={comicTextX}
                                y={comicTextY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FFFFFF"
                                fontSize="14"
                                fontFamily="Aileron"
                                fontWeight="600"
                                style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                              >
                                {comicCount}
                              </text>
                              {/* Educator number */}
                              {showEducatorCard && educatorCount > 0 && (
                                <text
                                  x={educatorTextX}
                                  y={educatorTextY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#FFFFFF"
                                  fontSize="14"
                                  fontFamily="Aileron"
                                  fontWeight="600"
                                  style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                >
                                  {educatorCount}
                                </text>
                              )}
                              {/* Third number */}
                              {showThirdCard && thirdCount > 0 && (
                                <text
                                  x={thirdTextX}
                                  y={thirdTextY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#FFFFFF"
                                  fontSize="14"
                                  fontFamily="Aileron"
                                  fontWeight="600"
                                  style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                >
                                  {thirdCount}
                                </text>
                              )}
                              {/* Fourth number */}
                              {showFourthCard && fourthCount > 0 && (
                                <text
                                  x={fourthTextX}
                                  y={fourthTextY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#FFFFFF"
                                  fontSize="14"
                                  fontFamily="Aileron"
                                  fontWeight="600"
                                  style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                >
                                  {fourthCount}
                                </text>
                              )}
                              {/* Fifth number */}
                              {showFifthCard && fifthCount > 0 && (
                                <text
                                  x={fifthTextX}
                                  y={fifthTextY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#FFFFFF"
                                  fontSize="14"
                                  fontFamily="Aileron"
                                  fontWeight="600"
                                  style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                >
                                  {fifthCount}
                                </text>
                              )}
                            </>
                          );
                        })()}
                      </svg>
                  </>
                    );
                  }
                  
                  if (showEducatorCard) {
                    return (
                  // Pie chart when both personas are visible
                  <>
                    <svg width="360" height="360" viewBox="0 0 160 160">
                        {(() => {
                          const comicCount = parseInt(editableContent.creatorStrategyCount, 10) || 1;
                          const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || 1;
                          const total = comicCount + educatorCount;
                          const comicPercentage = comicCount / total;
                          const educatorPercentage = educatorCount / total;
                          
                          // Calculate angles
                          const comicAngle = comicPercentage * 2 * Math.PI;
                          const educatorAngle = educatorPercentage * 2 * Math.PI;
                          
                          // Calculate path for comic segment (purple)
                          const comicEndX = 80 + 70 * Math.sin(comicAngle);
                          const comicEndY = 80 - 70 * Math.cos(comicAngle);
                          const comicLargeArc = comicPercentage > 0.5 ? 1 : 0;
                          
                          // Calculate positions for numbers (middle of each segment)
                          // Comic number position (middle of purple segment)
                          const comicMidAngle = comicAngle / 2;
                          const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                          const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                          
                          // Educator number position (middle of yellow segment)
                          const educatorMidAngle = comicAngle + (educatorAngle / 2);
                          const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                          const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                          
                          return (
                            <>
                              <circle cx="80" cy="80" r="70" fill="#8A5AFE" />
                              <path
                                d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`}
                                fill="#1340FF"
                              />
                              {/* Comic number */}
                              <text
                                x={comicTextX}
                                y={comicTextY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FFFFFF"
                                fontSize="14"
                                fontFamily="Aileron"
                                fontWeight="600"
                                style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                              >
                                {comicCount}
                              </text>
                              {/* Educator number */}
                              <text
                                x={educatorTextX}
                                y={educatorTextY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FFFFFF"
                                fontSize="14"
                                fontFamily="Aileron"
                                fontWeight="600"
                                style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                              >
                                {educatorCount}
                              </text>
                            </>
                          );
                        })()}
                      </svg>
                  </>
                    );
                  }
                  
                  // Full circle when only one persona
                  return (
                  <>
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        fill="#1340FF"
                      />
                    </svg>
                  <Box
                    sx={{
                      position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                    }}
                  >
              <Typography
                sx={{
                          fontFamily: 'Inter Display',
                  fontWeight: 400,
                        fontStyle: 'normal',
                          fontSize: '18px',
                          lineHeight: '22px',
                  letterSpacing: '0%',
                          color: '#FFFFFF',
                          textAlign: 'center',
                          textShadow: '0.5px 0.5px 1px #231F20',
                        }}
                      >
                        {editableContent.creatorStrategyCount || '1'}
                    </Typography>
                  </Box>
                  </>
                  );
                })()}
              </Box>

              {/* Legend - Moved to bottom */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', px: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      bgcolor: '#1340FF',
                      flexShrink: 0,
                  }}
                  />
                  <Typography
                  sx={{
                      fontFamily: 'Aileron',
                      fontWeight: 400,
                      fontSize: '14px',
                      lineHeight: '18px',
                      color: '#231F20',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      }}
                    >
                    {editableContent.comicTitle}
                    </Typography>
                </Box>
                {showEducatorCard && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: '#8A5AFE',
                        flexShrink: 0,
                      }}
                    />
                <Typography
                  sx={{
                        fontFamily: 'Aileron',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '18px',
                        color: '#231F20',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                  }}
                >
                      {editableContent.educatorTitle}
                </Typography>
        </Box>
        )}
                {showThirdCard && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: '#FF3500',
                        flexShrink: 0,
                      }}
                    />
              <Typography
                sx={{
                        fontFamily: 'Aileron',
                  fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '18px',
                        color: '#231F20',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                }}
              >
                      {editableContent.thirdTitle}
              </Typography>
                </Box>
            )}
                {showFourthCard && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: '#D8FF01',
                        flexShrink: 0,
                      }}
                    />
              <Typography
                sx={{
                        fontFamily: 'Aileron',
                  fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '18px',
                        color: '#231F20',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                }}
              >
                      {editableContent.fourthTitle}
              </Typography>
                </Box>
            )}
                {showFifthCard && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      sx={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        bgcolor: '#026D54',
                        flexShrink: 0,
                      }}
                    />
              <Typography
                sx={{
                        fontFamily: 'Aileron',
                  fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '18px',
                        color: '#231F20',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                }}
              >
                      {editableContent.fifthTitle}
              </Typography>
                </Box>
            )}
              </Box>
          </Box>
          </Box>
        </Grid>
      </Grid>
      ) : (
        // Non-edit Mode: Conditional layout based on number of personas
        <Grid container spacing={2}>
          {/* Left side - Persona Cards */}
          <Grid item xs={12} md={7}>
            <Box ref={displayCardsContainerRef} sx={{ display: 'flex', flexDirection: 'column', gap: 3, ml: 10 }}>
          {/* The Comic Card */}
          {editableContent.comicTitle && (
              <Box>
            {showEducatorCard ? (
              // Compact horizontal layout when there are 2 personas
              <Box
                sx={{
                  width: '480px',
                  minHeight: '220px',
                  borderRadius: '20px',
                  background: '#F5F5F5',
                  border: '10px solid #FFFFFF',
                  boxShadow: '0px 4px 4px 0px #8E8E9340',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {/* Circle with Icon */}
                <Box
                  sx={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '8px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    left: '-80px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    boxShadow: '-4px 4px 4px 0px #8E8E9340',
                  }}
                >
                  <Box
                    sx={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1340FF 0%, #1340FF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                    }}
                  >
                    {editableContent.comicEmoji}
      </Box>
    </Box>

                {/* Content */}
                <Box 
                  sx={{ 
                    ml: '80px',
                    maxWidth: 'calc(480px - 92px)',
                    pr: 3,
                    py: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Instrument Serif, serif',
                      fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '32px',
                      lineHeight: '36px',
                      letterSpacing: '0%',
                      color: '#0067D5',
                      mb: 1.5,
                      textAlign: 'left',
                    }}
                  >
                    {editableContent.comicTitle}
      </Typography>
                  
                    <Typography
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '22px',
                        color: '#000000',
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap'
                      }}
                    >
                      {editableContent.comicContentStyle}
                    </Typography>
                  </Box>
              </Box>
            ) : (
              // Compact card layout when there's only 1 persona
      <Box
                      sx={{
                  width: '480px',
                  minHeight: '220px',
                  borderRadius: '20px',
                  background: '#F5F5F5',
                  border: '10px solid #FFFFFF',
                  boxShadow: '0px 4px 4px 0px #8E8E9340',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {/* Circle with Icon */}
      <Box
        sx={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '8px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    left: '-80px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    boxShadow: '-4px 4px 4px 0px #8E8E9340',
                  }}
                >
                  <Box
                    sx={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1340FF 0%, #1340FF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                    }}
                  >
                    {editableContent.comicEmoji}
                  </Box>
                </Box>

                {/* Content */}
              <Box
                sx={{
                    ml: '80px',
                    maxWidth: 'calc(480px - 92px)',
                    pr: 3,
                    py: 3,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                      fontStyle: 'normal',
                      fontSize: '32px',
                      lineHeight: '36px',
                      letterSpacing: '0%',
                    color: '#0067D5',
                      mb: 1.5,
                      textAlign: 'left',
                  }}
                >
                  {editableContent.comicTitle}
      </Typography>
                  
                  <Typography
                    sx={{
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '22px',
                      color: '#000000',
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {editableContent.comicContentStyle}
      </Typography>
              </Box>
                </Box>
            )}
              </Box>
          )}
              
          {/* The Educator Card - Only show if showEducatorCard is true */}
          {showEducatorCard && (
                <Box>
            {/* Card */}
      <Box
        sx={{
                width: '480px',
                minHeight: '220px',
                  borderRadius: '20px',
                background: '#F5F5F5',
                  border: '10px solid #FFFFFF',
                  boxShadow: '0px 4px 4px 0px #8E8E9340',
                position: 'relative',
                  display: 'flex',
                alignItems: 'center',
                }}
              >
            {/* Circle with Icon - Positioned as separate component */}
            <Box
                    sx={{
                  width: '140px',
                  height: '140px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '8px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                  left: '-80px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                boxShadow: '-4px 4px 4px 0px #8E8E9340',
                    }}
                  >
              {/* Inner gradient circle */}
              <Box
                    sx={{
                    width: '110px',
                    height: '110px',
                  borderRadius: '50%',
                    background: '#8A5AFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                    fontSize: '48px',
                    }}
                  >
                {editableContent.educatorEmoji}
                </Box>
                </Box>

            {/* Content - Positioned independently */}
            <Box 
              sx={{ 
                  ml: '80px',
                  maxWidth: 'calc(480px - 92px)',
                  pr: 3,
                  py: 3,
              }}
            >
                  <Typography
                    sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '32px',
                    lineHeight: '36px',
                    letterSpacing: '0%',
                  color: '#0067D5',
                  mb: 1.5,
                    textAlign: 'left',
                    }}
                  >
                {editableContent.educatorTitle}
                  </Typography>
              
                  <Typography
                    sx={{
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '16px',
                    lineHeight: '22px',
                      color: '#000000',
                    textAlign: 'left',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                    }}
                  >
                  {editableContent.educatorContentStyle}
                  </Typography>
                </Box>
              </Box>
            </Box>
            )}

          {/* The Third Card - Only show if showThirdCard is true */}
          {showThirdCard && (
            <Box>
            {/* Card */}
      <Box
        sx={{
                width: '890px',
                minHeight: '220px',
                borderRadius: '20px',
                background: '#F5F5F5',
                border: '10px solid #FFFFFF',
                boxShadow: '0px 4px 4px 0px #8E8E9340',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
            {/* Circle with Icon - Positioned as separate component */}
            <Box
              sx={{
                  width: '140px',
                  height: '140px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '8px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                  left: '-80px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                boxShadow: '-4px 4px 4px 0px #8E8E9340',
              }}
            >
              {/* Inner gradient circle */}
              <Box
                sx={{
                    width: '110px',
                    height: '110px',
                  borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF3500 0%, #FF3500 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                    fontSize: '48px',
                }}
              >
                {editableContent.thirdEmoji}
              </Box>
            </Box>

            {/* Content - Positioned independently */}
            <Box 
              sx={{ 
                  ml: '80px',
                  maxWidth: 'calc(890px - 92px)',
                  pr: 3,
                  py: 3,
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontStyle: 'normal',
                    fontSize: '32px',
                    lineHeight: '36px',
                  letterSpacing: '0%',
                  color: '#0067D5',
                  mb: 1.5,
                    textAlign: 'left',
                }}
              >
                {editableContent.thirdTitle}
              </Typography>
              
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '22px',
                    color: '#000000',
                      textAlign: 'left',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                    {editableContent.thirdContentStyle}
                </Typography>
                </Box>
            </Box>
            </Box>
          )}

          {/* Fourth Persona Card (Display Mode) - Only show if showFourthCard is true */}
          {showFourthCard && editableContent.fourthTitle && (
            <Box>
            {/* Card */}
      <Box
        sx={{
          width: '890px',
          minWidth: '470px',
          flexShrink: 0,
          minHeight: '220px',
          borderRadius: '20px',
          background: '#F5F5F5',
          border: '10px solid #FFFFFF',
          boxShadow: '0px 4px 4px 0px #8E8E9340',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Circle with Icon - Positioned as separate component */}
        <Box
          sx={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '8px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
              left: '-80px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            boxShadow: '-4px 4px 4px 0px #8E8E9340',
          }}
        >
          {/* Inner gradient circle */}
          <Box
            sx={{
                width: '110px',
                height: '110px',
              borderRadius: '50%',
                background: 'linear-gradient(135deg, #D8FF01 0%, #D8FF01 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                fontSize: '48px',
            }}
          >
            {editableContent.fourthEmoji}
          </Box>
        </Box>

        {/* Content - Positioned independently */}
        <Box 
          sx={{ 
              ml: '80px',
              maxWidth: 'calc(890px - 92px)',
              pr: 3,
              py: 3,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontStyle: 'normal',
                fontSize: '32px',
                lineHeight: '36px',
              letterSpacing: '0%',
              color: '#0067D5',
              mb: 1.5,
                textAlign: 'left',
            }}
          >
            {editableContent.fourthTitle}
          </Typography>
          
            <Typography
              sx={{
                fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '22px',
                color: '#000000',
                  textAlign: 'left',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
                {editableContent.fourthContentStyle}
            </Typography>
            </Box>
        </Box>
        </Box>
      )}

          {/* Fifth Persona Card (Display Mode) - Only show if showFifthCard is true */}
          {showFifthCard && editableContent.fifthTitle && (
            <Box>
            {/* Card */}
      <Box
        sx={{
          width: '890px',
          minWidth: '470px',
          flexShrink: 0,
          minHeight: '220px',
          borderRadius: '20px',
          background: '#F5F5F5',
          border: '10px solid #FFFFFF',
          boxShadow: '0px 4px 4px 0px #8E8E9340',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Circle with Icon - Positioned as separate component */}
        <Box
          sx={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '8px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
              left: '-80px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            boxShadow: '-4px 4px 4px 0px #8E8E9340',
          }}
        >
          {/* Inner gradient circle */}
          <Box
            sx={{
                width: '110px',
                height: '110px',
              borderRadius: '50%',
                background: 'linear-gradient(135deg, #026D54 0%, #026D54 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                fontSize: '48px',
            }}
          >
            {editableContent.fifthEmoji}
          </Box>
        </Box>

        {/* Content - Positioned independently */}
        <Box 
          sx={{ 
              ml: '80px',
              maxWidth: 'calc(890px - 92px)',
              pr: 3,
              py: 3,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontStyle: 'normal',
                fontSize: '32px',
                lineHeight: '36px',
              letterSpacing: '0%',
              color: '#0067D5',
              mb: 1.5,
                textAlign: 'left',
            }}
          >
            {editableContent.fifthTitle}
          </Typography>
          
            <Typography
              sx={{
                fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 400,
                  fontSize: '16px',
                  lineHeight: '22px',
                color: '#000000',
                  textAlign: 'left',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
                {editableContent.fifthContentStyle}
            </Typography>
            </Box>
        </Box>
        </Box>
      )}
            </Box>
          </Grid>

          {/* Right side - Creator Strategy Breakdown Chart (Display mode) */}
          {editableContent.comicTitle && (
          <Grid item xs={12} md={5} sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Box
              sx={{
                bgcolor: '#F5F5F5',
                borderRadius: '16px',
                p: 2,
                width: '400px',
                height: (() => {
                  // Calculate height based on number of visible cards
                  const visibleCards = 1 + (showEducatorCard ? 1 : 0) + (showThirdCard ? 1 : 0) + (showFourthCard ? 1 : 0) + (showFifthCard ? 1 : 0);
                  if (visibleCards === 1) return '220px';
                  if (visibleCards === 2) return '465px';
                  if (visibleCards === 3) return '460px';
                  if (visibleCards === 4) return '460px';
                  if (visibleCards === 5) return '460px';
                  return '460px'; // fallback
                })(),
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
                <Typography
                  sx={{
                  fontFamily: 'Aileron',
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: '22px',
                  color: '#231F20',
                  textAlign: 'left',
                  mb: 2,
                  }}
                >
                Creator Strategy Breakdown
                </Typography>

              {/* Circle and Legend Layout */}
                <Box sx={{ display: 'flex', flexDirection: (showEducatorCard || showThirdCard) ? 'column' : 'row', alignItems: 'center', gap: (showEducatorCard || showThirdCard) ? -1 : 2, flex: 1 }}>
                {/* Full Circle Chart or Pie Chart */}
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: (showEducatorCard || showThirdCard) ? 1 : 'none' }}>
                    {(() => {
                      // Render different chart based on number of personas
                      if (showFifthCard || showFourthCard || showThirdCard) {
                        // Pie chart when 3+ personas are visible
                        return (
                      <>
                        <svg width="280" height="280" viewBox="0 0 160 160">
                          {(() => {
                            const comicCount = parseInt(editableContent.creatorStrategyCount, 10) || 1;
                            const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || 1;
                            const thirdCount = parseInt(editableContent.thirdCreatorCount, 10) || 1;
                            const fourthCount = parseInt(editableContent.fourthCreatorCount, 10) || 1;
                            const fifthCount = parseInt(editableContent.fifthCreatorCount, 10) || 1;
                            const total = comicCount + (showEducatorCard ? educatorCount : 0) + (showThirdCard ? thirdCount : 0) + (showFourthCard ? fourthCount : 0) + (showFifthCard ? fifthCount : 0);
                            const comicPercentage = comicCount / total;
                            const educatorPercentage = showEducatorCard ? educatorCount / total : 0;
                            const thirdPercentage = showThirdCard ? thirdCount / total : 0;
                            const fourthPercentage = showFourthCard ? fourthCount / total : 0;
                            const fifthPercentage = showFifthCard ? fifthCount / total : 0;
                            
                            const comicAngle = comicPercentage * 2 * Math.PI;
                            const educatorAngle = educatorPercentage * 2 * Math.PI;
                            const thirdAngle = thirdPercentage * 2 * Math.PI;
                            const fourthAngle = fourthPercentage * 2 * Math.PI;
                            const fifthAngle = fifthPercentage * 2 * Math.PI;
                            
                            let currentAngle = 0;
                            
                            const comicEndAngle = currentAngle + comicAngle;
                            const comicEndX = 80 + 70 * Math.sin(comicEndAngle);
                            const comicEndY = 80 - 70 * Math.cos(comicEndAngle);
                            const comicLargeArc = comicAngle > Math.PI ? 1 : 0;

                            currentAngle = comicEndAngle;
                            const educatorEndAngle = currentAngle + educatorAngle;
                            const educatorEndX = 80 + 70 * Math.sin(educatorEndAngle);
                            const educatorEndY = 80 - 70 * Math.cos(educatorEndAngle);
                            const educatorLargeArc = educatorAngle > Math.PI ? 1 : 0;
                            
                            currentAngle = educatorEndAngle;
                            const thirdEndAngle = currentAngle + thirdAngle;
                            const thirdEndX = 80 + 70 * Math.sin(thirdEndAngle);
                            const thirdEndY = 80 - 70 * Math.cos(thirdEndAngle);
                            const thirdLargeArc = thirdAngle > Math.PI ? 1 : 0;
                            
                            currentAngle = thirdEndAngle;
                            const fourthEndAngle = currentAngle + fourthAngle;
                            const fourthEndX = 80 + 70 * Math.sin(fourthEndAngle);
                            const fourthEndY = 80 - 70 * Math.cos(fourthEndAngle);
                            const fourthLargeArc = fourthAngle > Math.PI ? 1 : 0;
                            
                            currentAngle = fourthEndAngle;
                            const fifthEndAngle = currentAngle + fifthAngle;
                            const fifthEndX = 80 + 70 * Math.sin(fifthEndAngle);
                            const fifthEndY = 80 - 70 * Math.cos(fifthEndAngle);
                            const fifthLargeArc = fifthAngle > Math.PI ? 1 : 0;
  
                            const comicMidAngle = comicAngle / 2;
                            const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                            const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                            
                            const educatorMidAngle = comicAngle + educatorAngle / 2;
                            const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                            const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                            
                            const thirdMidAngle = comicAngle + educatorAngle + thirdAngle / 2;
                            const thirdTextX = 80 + 35 * Math.sin(thirdMidAngle);
                            const thirdTextY = 80 - 35 * Math.cos(thirdMidAngle);
                            
                            const fourthMidAngle = comicAngle + educatorAngle + thirdAngle + fourthAngle / 2;
                            const fourthTextX = 80 + 35 * Math.sin(fourthMidAngle);
                            const fourthTextY = 80 - 35 * Math.cos(fourthMidAngle);
                            
                            const fifthMidAngle = comicAngle + educatorAngle + thirdAngle + fourthAngle + fifthAngle / 2;
                            const fifthTextX = 80 + 35 * Math.sin(fifthMidAngle);
                            const fifthTextY = 80 - 35 * Math.cos(fifthMidAngle);
                            
                            return (
                              <>
                                {/* Comic segment (blue) */}
                                <path
                                  d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`}
                                  fill="#1340FF"
                                />
                                {/* Educator segment (purple) */}
                                {showEducatorCard && (
                                <path
                                  d={`M 80 80 L ${comicEndX} ${comicEndY} A 70 70 0 ${educatorLargeArc} 1 ${educatorEndX} ${educatorEndY} Z`}
                                  fill="#8A5AFE"
                                />
                                )}
                                {/* Third segment (orange-red) */}
                                {showThirdCard && (
                                <path
                                  d={`M 80 80 L ${educatorEndX} ${educatorEndY} A 70 70 0 ${thirdLargeArc} 1 ${thirdEndX} ${thirdEndY} Z`}
                                  fill="#FF3500"
                                />
                                )}
                                {/* Fourth segment (yellow-green) */}
                                {showFourthCard && (
                                <path
                                  d={`M 80 80 L ${thirdEndX} ${thirdEndY} A 70 70 0 ${fourthLargeArc} 1 ${fourthEndX} ${fourthEndY} Z`}
                                  fill="#D8FF01"
                                />
                                )}
                                {/* Fifth segment (teal) - closes the circle */}
                                {showFifthCard && (
                                <path
                                  d={`M 80 80 L ${fourthEndX} ${fourthEndY} A 70 70 0 ${fifthLargeArc} 1 80 10 Z`}
                                  fill="#026D54"
                                />
                                )}
                                {!showFifthCard && showFourthCard && (
                                <path
                                  d={`M 80 80 L ${fourthEndX} ${fourthEndY} A 70 70 0 0 1 80 10 Z`}
                                  fill="#D8FF01"
                                  opacity="0"
                                />
                                )}
                                {!showFifthCard && !showFourthCard && (
                                <path
                                  d={`M 80 80 L ${thirdEndX} ${thirdEndY} A 70 70 0 0 1 80 10 Z`}
                                  fill="#FF3500"
                                  opacity="0"
                                />
                                )}
                                {/* Comic number */}
                                <text
                                  x={comicTextX}
                                  y={comicTextY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#FFFFFF"
                                  fontSize="14"
                                  fontFamily="Aileron"
                                  fontWeight="600"
                                  style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                >
                                  {comicCount}
                                </text>
                                {/* Educator */}
                                <text
                                  x={educatorTextX}
                                  y={educatorTextY}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  fill="#FFFFFF"
                                  fontSize="14"
                                  fontFamily="Aileron"
                                  fontWeight="600"
                                  style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                >
                                  {educatorCount}
                                </text>
                                {/* Third number */}
                                {thirdCount > 0 && showThirdCard && (
                                  <text
                                    x={thirdTextX}
                                    y={thirdTextY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#FFFFFF"
                                    fontSize="14"
                                    fontFamily="Aileron"
                                    fontWeight="600"
                                    style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                  >
                                    {thirdCount}
                                  </text>
                                )}
                                {/* Fourth number */}
                                {fourthCount > 0 && showFourthCard && (
                                  <text
                                    x={fourthTextX}
                                    y={fourthTextY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#FFFFFF"
                                    fontSize="14"
                                    fontFamily="Aileron"
                                    fontWeight="600"
                                    style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                  >
                                    {fourthCount}
                                  </text>
                                )}
                                {/* Fifth number */}
                                {fifthCount > 0 && showFifthCard && (
                                  <text
                                    x={fifthTextX}
                                    y={fifthTextY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#FFFFFF"
                                    fontSize="14"
                                    fontFamily="Aileron"
                                    fontWeight="600"
                                    style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                                  >
                                    {fifthCount}
                                  </text>
                                )}
                              </>
                            );
                          })()}
                        </svg>
                      </>
                        );
                      }
                      
                      if (showEducatorCard) {
                        // Pie chart when both personas are visible
                        return (
                      <>
                        <svg width="280" height="280" viewBox="0 0 160 160">
                          {(() => {
                            const comicCount = parseInt(editableContent.creatorStrategyCount, 10) || 1;
                            const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || 1;
                            const total = comicCount + educatorCount;
                            const comicPercentage = comicCount / total;
                            const educatorPercentage = educatorCount / total;
                            
                            // Calculate angles
                            const comicAngle = comicPercentage * 2 * Math.PI;
                            const educatorAngle = educatorPercentage * 2 * Math.PI;
                            
                            // Calculate path for comic segment (purple)
                            const comicEndX = 80 + 70 * Math.sin(comicAngle);
                            const comicEndY = 80 - 70 * Math.cos(comicAngle);
                            const comicLargeArc = comicPercentage > 0.5 ? 1 : 0;
                            
                            // Calculate positions for numbers (middle of each segment)
                            // Comic number position (middle of purple segment)
                            const comicMidAngle = comicAngle / 2;
                            const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                            const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                            
                            // Educator number position (middle of yellow segment)
                            const educatorMidAngle = comicAngle + (educatorAngle / 2);
                            const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                            const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                            
                            return (
                              <>
                                <circle cx="80" cy="80" r="70" fill="#8A5AFE" />
                                <path
                                  d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`}
                                  fill="#1340FF"
                                />
                              {/* Comic number */}
                              <text
                                x={comicTextX}
                                y={comicTextY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FFFFFF"
                                fontSize="14"
                                fontFamily="Aileron"
                                fontWeight="600"
                                style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                              >
                                {comicCount}
                              </text>
                              {/* Educator number */}
                              <text
                                x={educatorTextX}
                                y={educatorTextY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#FFFFFF"
                                fontSize="14"
                                fontFamily="Aileron"
                                fontWeight="600"
                                style={{ textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' }}
                              >
                                {educatorCount}
                              </text>
                              </>
                            );
                          })()}
                        </svg>
                      </>
                        );
                      }
                      
                      // Full circle when only one persona
                      return (
                      <>
                        <svg width="160" height="160" viewBox="0 0 160 160">
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="#1340FF"
                          />
                        </svg>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: 'Inter Display',
                    fontWeight: 400,
                    fontStyle: 'normal',
                              fontSize: '18px',
                              lineHeight: '22px',
                    letterSpacing: '0%',
                              color: '#FFFFFF',
                              textAlign: 'center',
                              textShadow: '0.5px 0.5px 1px #231F20',
                  }}
                >
                            {editableContent.creatorStrategyCount || '1'}
                </Typography>
                        </Box>
                      </>
                      );
                    })()}
              </Box>

                  {/* Legend - Moved to bottom */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', px: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box
                        sx={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          bgcolor: '#1340FF',
                          flexShrink: 0,
                        }}
                      />
                <Typography
                  sx={{
                          fontFamily: 'Aileron',
                          fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '18px',
                          color: '#231F20',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                  }}
                >
                        {editableContent.comicTitle}
                </Typography>
                    </Box>
                    {showEducatorCard && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            bgcolor: '#8A5AFE',
                            flexShrink: 0,
                          }}
                        />
                <Typography
                  sx={{
                            fontFamily: 'Aileron',
                    fontWeight: 400,
                    fontSize: '14px',
                    lineHeight: '18px',
                            color: '#231F20',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                  }}
                >
                          {editableContent.educatorTitle}
                </Typography>
              </Box>
                    )}
                    {showThirdCard && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            bgcolor: '#FF3500',
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: 'Aileron',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '18px',
                            color: '#231F20',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {editableContent.thirdTitle}
                        </Typography>
            </Box>
                    )}
                    {showFourthCard && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            bgcolor: '#D8FF01',
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: 'Aileron',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '18px',
                            color: '#231F20',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {editableContent.fourthTitle}
                        </Typography>
            </Box>
                    )}
                    {showFifthCard && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box
                          sx={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            bgcolor: '#026D54',
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: 'Aileron',
                            fontWeight: 400,
                            fontSize: '14px',
                            lineHeight: '18px',
                            color: '#231F20',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {editableContent.fifthTitle}
                        </Typography>
            </Box>
                    )}
            </Box>
            </Box>
        </Box>
          </Grid>
          )}
        </Grid>
      )}
    </Box>
    </Box>
                </SortableSection>
              );

              case 'recommendations':
                return (
                 <SortableSection key="recommendations" id="recommendations" isEditMode={isEditMode}>
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
        {isEditMode && !sectionEditStates.recommendations && (
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
        {isEditMode && sectionEditStates.recommendations && (
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

    <Grid container spacing={3} sx={{ mb: 6 }}>
      {/* What Worked Well - Purple */}
      <Grid item xs={12} md={4}>
        <Box sx={{ height: '100%' }}>
          {/* Header */}
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
          
          {/* Content Boxes */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {editableContent.workedWellInsights.length === 0 && !isEditMode && (
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
                  Click Edit Report to edit What Worked Well
                </Typography>
              </Box>
            )}
            {editableContent.workedWellInsights.map((insight, index) => (
      <Box
                key={index}
        sx={{
                  background: getWorkedWellInsightBgColor(index),
                  opacity: getWorkedWellOpacity(index),
                  px: 2,
                  py: 1.5, 
                  color: 'white', 
                  height: '120px', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: index === editableContent.workedWellInsights.length - 1 ? '0 0 12px 12px' : 0,
                  position: 'relative',
                }}
              >
                {isEditMode && !sectionEditStates.recommendations ? (
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
                        value={insight}
                        onChange={(e) => {
                          const newInsights = [...editableContent.workedWellInsights];
                          newInsights[index] = e.target.value;
                          setEditableContent({ ...editableContent, workedWellInsights: newInsights });
                        }}
                        fullWidth
                        multiline
                        rows={2}
                        inputProps={{
                          maxLength: 200,
                        }}
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
                        const newInsights = editableContent.workedWellInsights.filter((_, i) => i !== index);
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
                    {insight}
                  </Typography>
                )}
              </Box>
            ))}
            
            {isEditMode && editableContent.workedWellInsights.length < 3 && (
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
          </Box>
        </Box>
      </Grid>

      {/* What Could Be Improved - Blue */}
      <Grid item xs={12} md={4}>
        <Box sx={{ height: '100%' }}>
          {/* Header */}
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
          
          {/* Content Boxes */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {editableContent.improvedInsights.length === 0 && !isEditMode && (
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
                  Click Edit Report to edit What Can Be Improved
                </Typography>
              </Box>
            )}
            {editableContent.improvedInsights.map((insight, index) => (
      <Box
                key={index}
        sx={{
                  bgcolor: getImprovedInsightBgColor(index),
                  px: 2, // Changed from p: 1.5 to px: 2 for consistent horizontal padding
                  py: 1.5, // Kept vertical padding
                  color: 'white', 
                  height: '120px', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: index === editableContent.workedWellInsights.length - 1 ? '0 0 12px 12px' : 0,
                  position: 'relative',
                }}
              >
                {isEditMode && !sectionEditStates.recommendations ? (
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
                        value={insight}
                        onChange={(e) => {
                          const newInsights = [...editableContent.improvedInsights];
                          newInsights[index] = e.target.value;
                          setEditableContent({ ...editableContent, improvedInsights: newInsights });
                        }}
                        fullWidth
                        multiline
                        rows={2}
                        inputProps={{
                          maxLength: 200,
                        }}
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
                        const newInsights = editableContent.improvedInsights.filter((_, i) => i !== index);
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
                    {insight}
                  </Typography>
                )}
              </Box>
            ))}
            
            {isEditMode && editableContent.improvedInsights.length < 3 && (
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
          </Box>
        </Box>
      </Grid>

      {/* What To Do Next - Green */}
      <Grid item xs={12} md={4}>
        <Box sx={{ height: '100%' }}>
          {/* Header */}
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
          
          {/* Content Boxes */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            {editableContent.nextStepsInsights.length === 0 && !isEditMode && (
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
                  Click Edit Report to edit Next Steps
                </Typography>
    </Box>
            )}
            {editableContent.nextStepsInsights.map((insight, index) => (
              <Box 
                key={index}
                sx={{ 
                  bgcolor: index === 0 ? '#026D54D9' : '#026D54BF',
                  px: 2, // Changed from p: 1 to px: 2 for consistent horizontal padding
                  py: 1.5, // Added vertical padding
                  color: 'white', 
                  height: '120px', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: index === editableContent.nextStepsInsights.length - 1 ? '0 0 12px 12px' : 0,
                  position: 'relative',
                }}
              >
                {isEditMode && !sectionEditStates.recommendations ? (
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
                        value={insight}
                        onChange={(e) => {
                          const newInsights = [...editableContent.nextStepsInsights];
                          newInsights[index] = e.target.value;
                          setEditableContent({ ...editableContent, nextStepsInsights: newInsights });
                        }}
                        fullWidth
                        multiline
                        rows={2}
                        inputProps={{
                          maxLength: 200,
                        }}
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
                        const newInsights = editableContent.nextStepsInsights.filter((_, i) => i !== index);
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
                    {insight}
                  </Typography>
                )}
              </Box>
            ))}
            
            {isEditMode && editableContent.nextStepsInsights.length < 3 && (
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
          </Box>
        </Box>
      </Grid>
    </Grid>
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
    campaignBrief: PropTypes.shape({
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      postingStartDate: PropTypes.string,
      postingEndDate: PropTypes.string,
    }),
    submission: PropTypes.array,
    shortlisted: PropTypes.arrayOf(
      PropTypes.shape({
        creditTier: PropTypes.string,
      })
    ),
  }),
  onBack: PropTypes.func.isRequired,
};

export default PCRReportPage;
