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

const getWorkedWellOpacity = (index) => {
  if (index === 0) return 0.85;
  if (index === 1) return 0.75;
  return 0.65;
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
  };

  const handleInput = (e) => {
    onChange({ target: { value: e.currentTarget.innerHTML } });
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
          if (hasEducatorContent) {
            setShowEducatorCard(true);
          }
          if (hasThirdContent) {
            setShowThirdCard(true);
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
  
  // Save PCR data to backend
  // Save content to history for undo/redo
  const saveToHistory = (content, visibility, order, showEducator, showThird) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify({
      content,
      sectionVisibility: visibility,
      sectionOrder: order,
      showEducatorCard: showEducator,
      showThirdCard: showThird,
    })));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
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
    }
  };
  
  // Generate preview - simulates PDF export view with page breaks
  const handleGeneratePreview = async () => {
    try {
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
        const pageHeight = 297; // A4 height in mm
        const pageWidth = 210; // A4 width in mm
        const margin = 10;
        const contentWidth = pageWidth - (2 * margin);
        const maxPageHeight = pageHeight - (2 * margin);
        
        const pages = [];
        let currentPage = [];
        let currentPageHeight = 0;
        
        // Batch process sections with yield to UI thread
        const processSections = async () => {
          const results = [];
          
          // Process sections sequentially to maintain order
          // eslint-disable-next-line no-restricted-syntax
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
              scale: 2, // Higher quality for preview
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
          currentPageHeight += imgHeight + 5;
        });
        
        if (currentPage.length > 0) {
          pages.push(currentPage);
        }
        
        // Create page images with gradient background at higher DPI for preview
        const dpi = 150; // Increased DPI for better quality
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
              yOffset += sectionHeight + ((5 * dpi) / 25.4);
            });
            
            // Use PNG for preview to maintain quality
            pageImages.push(pageCanvas.toDataURL('image/png', 1.0));
          }
          
          return pageImages;
        };
        
        const pageImages = await renderPages();
        setPreviewImages(pageImages);
      }

      // Show buttons again
      buttonsToHide.forEach(el => {
        el.style.display = '';
      });
      
      // Restore edit mode if it was active
      if (wasInEditMode) {
        setIsEditMode(true);
      }

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
    }
  };

  // Track changes for undo/redo
  useEffect(() => {
    if (isEditMode && history.length === 0) {
      // Initialize history when entering edit mode
      saveToHistory(editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // Initialize Creator Tiers editor content
  useEffect(() => {
    if (creatorTiersEditorRef.current && editableContent.creatorTiersDescription) {
      creatorTiersEditorRef.current.innerHTML = editableContent.creatorTiersDescription;
    }
  }, [isEditMode, editableContent.creatorTiersDescription]);

  // Save to history when content changes (debounced)
  useEffect(() => {
    if (!isEditMode || history.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      // Only save if state actually changed
      const lastState = history[historyIndex];
      const currentState = {
        content: editableContent,
        sectionVisibility,
        sectionOrder,
        showEducatorCard,
        showThirdCard,
      };
      
      if (JSON.stringify(lastState) !== JSON.stringify(currentState)) {
        saveToHistory(editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableContent, sectionVisibility, sectionOrder, showEducatorCard, showThirdCard, isEditMode]);

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
          const gap = 24; // gap: 3 = 24px
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
  }, [showEducatorCard, showThirdCard, editableContent.comicContentStyle, editableContent.educatorContentStyle, editableContent.thirdContentStyle]);

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
  }, [showEducatorCard, showThirdCard, editableContent.comicContentStyle, editableContent.educatorContentStyle, editableContent.thirdContentStyle]);

  const handleSavePCR = async () => {
    if (!campaign?.id) return;
    
    try {
      setIsSaving(true);
      console.log('💾 Saving PCR data for campaign:', campaign.id);
      
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
            setShowEducatorCard(hasEducatorContent);
            setShowThirdCard(hasThirdContent);
            
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

      // Remove margins and border-radius from sections to prevent white lines
      const allSections = pdfContainer.querySelectorAll('.pcr-section');
      allSections.forEach(el => {
        el.style.marginBottom = '0';
        el.style.borderRadius = '0';
      });

      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true, // Enable compression
      });

      const pageWidth = 210; 
      const pageHeight = 297; 
      const margin = 10; 
      const contentWidth = pageWidth - (2 * margin);
      
      const addGradientBackground = async () => {
        // Create gradient as a canvas image for smooth rendering
        const gradientCanvas = document.createElement('canvas');
        const dpi = 96;
        gradientCanvas.width = (pageWidth * dpi) / 25.4;
        gradientCanvas.height = (pageHeight * dpi) / 25.4;
        const ctx = gradientCanvas.getContext('2d');
        
        // Create smooth gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, gradientCanvas.height);
        gradient.addColorStop(0, '#1340FF');
        gradient.addColorStop(1, '#8A5AFE');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gradientCanvas.width, gradientCanvas.height);
        
        // Add gradient as image to PDF
        const gradientData = gradientCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(gradientData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      };
      
      // Get all sections
      const sections = pdfContainer.querySelectorAll('.pcr-section');
      
      if (sections.length === 0) {
        await addGradientBackground();

        const canvas = await html2canvas(pdfContainer, {
          scale: 1.5, 
          useCORS: true,
          logging: false,
          backgroundColor: null,
          windowWidth: 1078,
          imageTimeout: 0,
          removeContainer: true,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG with 90% quality
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        // Add gradient to first page
        await addGradientBackground();
        
        // Capture each section separately
        let currentY = margin;
        let isFirstSection = true;

        const processPdfSections = async () => {
          // Process sections sequentially to maintain order and add to PDF
          // eslint-disable-next-line no-restricted-syntax
          for (let i = 0; i < sections.length; i += 1) {
            const section = sections[i];
            
            // Yield to UI thread every 2 sections
            if (i % 2 === 0 && i > 0) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise(resolve => { setTimeout(resolve, 0); });
            }
            
            // Capture this section with optimized settings
            // eslint-disable-next-line no-await-in-loop
            const canvas = await html2canvas(section, {
              scale: 1.5, // Reduced from 2 for better performance
              useCORS: true,
              logging: false,
              backgroundColor: '#FFFFFF',
              windowWidth: 1078,
              imageTimeout: 0,
              removeContainer: true,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG with 90% quality
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Check if section fits on current page
            if (currentY + imgHeight > pageHeight - margin && !isFirstSection) {
              pdf.addPage();
              // eslint-disable-next-line no-await-in-loop
              await addGradientBackground();
              currentY = margin;
            }
            
            // Add section to PDF with FAST compression - slight overlap to prevent white lines
            pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight, undefined, 'FAST');
            currentY += imgHeight - 0.5; // Slight overlap (0.5mm) to prevent white lines 
            
            isFirstSection = false;
          }
        };
        
        await processPdfSections();
      }

      // Restore buttons, margins, and border-radius
      buttonsToHide.forEach(el => {
        el.style.display = '';
      });
      allSections.forEach(el => {
        el.style.marginBottom = '';
        el.style.borderRadius = '';
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
      // Revalidate the heatmap data
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
        console.log('No posting period dates available');
        console.log('Campaign Brief:', campaign?.campaignBrief);
        return [];
      }

      const campaignStart = new Date(postingStartDate);
      const campaignEnd = new Date(postingEndDate);
      const campaignDuration = (campaignEnd - campaignStart) / (1000 * 60 * 60 * 24);
      

      const firstWeekStart = 1; 
      const firstWeekEnd = 8; 
      const midCampaignStart = 12; 
      const midCampaignEnd = campaignDuration; 
      const afterPeriodStart = campaignDuration; 
      const afterPeriodEnd = campaignDuration + 7;

      const creatorPhaseData = new Map();
      
      filteredInsightsData.forEach((insightData, idx) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        if (!submission) return;

        // Get post date
        let postDate = null;
        if (insightData.insight?.timestamp) {
          postDate = new Date(insightData.insight.timestamp * 1000);
        } else if (submission.createdAt) {
          postDate = new Date(submission.createdAt);
        }
        
        if (!postDate) return;

        // Calculate days from campaign start
        const daysFromStart = (postDate - campaignStart) / (1000 * 60 * 60 * 24);
        
        // Determine which phase this post belongs to
        let phase = null;
        if (daysFromStart >= firstWeekStart && daysFromStart <= firstWeekEnd) {
          phase = 'firstWeek';
        } else if (daysFromStart >= midCampaignStart && daysFromStart <= midCampaignEnd) {
          phase = 'midCampaign';
        } else if (daysFromStart >= afterPeriodStart && daysFromStart <= afterPeriodEnd) {
          phase = 'afterPeriod';
        }
        
        if (!phase) return;

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
            midCampaign: [],
            afterPeriod: [],
            totalER: 0,
            postCount: 0,
            firstPostPhase: null,
          });
        }

        const creatorData = creatorPhaseData.get(userId);
        const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));
        
        if (!Number.isNaN(engagementRate) && engagementRate > 0) {
          creatorData[phase].push(engagementRate);
          creatorData.totalER += engagementRate;
          creatorData.postCount += 1;
          
          // Track first post phase
          if (!creatorData.firstPostPhase) {
            creatorData.firstPostPhase = phase;
          }
        }
      });

      // Calculate average ER per phase for each creator and determine which boxes to show
      const creatorsWithAverages = Array.from(creatorPhaseData.values()).map(creator => {
        const firstWeekAvg = creator.firstWeek.length > 0
          ? creator.firstWeek.reduce((a, b) => a + b, 0) / creator.firstWeek.length
          : null;
        
        const midCampaignAvg = creator.midCampaign.length > 0
          ? creator.midCampaign.reduce((a, b) => a + b, 0) / creator.midCampaign.length
          : null;
        
        const afterPeriodAvg = creator.afterPeriod.length > 0
          ? creator.afterPeriod.reduce((a, b) => a + b, 0) / creator.afterPeriod.length
          : null;

        let showFirstWeek = firstWeekAvg !== null;
        let showMidCampaign = midCampaignAvg !== null;
        const showAfterPeriod = afterPeriodAvg !== null;
        
        if (creator.firstPostPhase === 'midCampaign') {
          showMidCampaign = false;
        }
        
        // If first post was in after period, only show after period
        if (creator.firstPostPhase === 'afterPeriod') {
          showFirstWeek = false;
          showMidCampaign = false;
        }

        return {
          userId: creator.userId,
          name: creator.name,
          isManualEntry: creator.isManualEntry,
          creatorUsername: creator.creatorUsername,
          firstWeek: showFirstWeek ? firstWeekAvg : null,
          midCampaign: showMidCampaign ? midCampaignAvg : null,
          afterPeriod: showAfterPeriod ? afterPeriodAvg : null,
          overallER: creator.postCount > 0 ? creator.totalER / creator.postCount : 0,
        };
      });

      // Sort by overall ER and take top 5
      const top5 = creatorsWithAverages
        .filter(c => c.overallER > 0)
        .sort((a, b) => b.overallER - a.overallER)
        .slice(0, 5);

      return top5;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredInsightsData, filteredSubmissions, campaign]);

    const creatorIdsToFetch = top5CreatorsPhases
      .filter(c => !c.isManualEntry && c.userId)
      .map(c => c.userId);
    
    // Call hooks for each creator ID (up to 5 creators)
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
                  {/* First Week of Post - only show if has data */}
                  {creator.firstWeek !== null && (
            <Box 
              sx={{ 
                        flex: 1,
                        height: '40px',
                        backgroundColor: getPhaseColor(creator.firstWeek),
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
                          color: '#FFFFFF'
                        }}
                      >
                        {creator.firstWeek.toFixed(1)}%
                      </Typography>
            </Box>
                  )}

                  {/* Mid Posting Period - only show if has data */}
                  {creator.midCampaign !== null && (
            <Box 
              sx={{ 
                        flex: 1,
                        height: '40px',
                        backgroundColor: getPhaseColor(creator.midCampaign),
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
                          color: '#FFFFFF'
                        }}
                      >
                        {creator.midCampaign.toFixed(1)}%
                      </Typography>
            </Box>
                  )}

                  {/* 1 Week After Posting Period - only show if has data */}
                  {creator.afterPeriod !== null && (
                    <Box
              sx={{ 
                        flex: 1,
                        height: '40px',
                        backgroundColor: getPhaseColor(creator.afterPeriod),
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
                          color: '#FFFFFF'
              }}
            >
                        {creator.afterPeriod.toFixed(1)}%
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
        {displayData.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mt: 'auto' }}>
            <Box sx={{ minWidth: '80px' }} /> 
            <Box sx={{ display: 'flex', gap: '8px', flex: 1 }}>
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                First Week of Post
              </Typography>
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                Mid Posting Period
              </Typography>
              <Typography sx={{ flex: 1, textAlign: 'center', fontFamily: 'Aileron', fontSize: '11px', fontWeight: 400, color: '#231F20', whiteSpace: 'nowrap' }}>
                1 Week After Posting Period
              </Typography>
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
        )}
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
    
    const chartData = [
      { id: 0, value: platformData.tiktok, label: 'TikTok', color: '#000000' },
      { id: 1, value: platformData.instagram, label: 'Instagram', color: '#C13584' },
    ].filter((item) => item.value > 0);

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
        result = { submission, insightData, likes };
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
        result = { submission, insightData, shares };
      }
    });
    
    return result;
  }, [filteredInsightsData, filteredSubmissions]);

  // Get creator data for all cards
  // For manual entries, submission.user is an object; for regular ones, it's a string ID
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
            // Check if this is a manual entry (user.id matches submission.id)
            const isManualEntry = creator.submission.user?.id === creator.submission.id;
            
            let username;
            if (isManualEntry) {
              // For manual entries, get username from submission data
              username = creator.platform === 'Instagram' 
                ? creator.submission.user?.creator?.instagram 
                : creator.submission.user?.creator?.tiktok;
            } else {
              // For regular creators, get from fetched data
              const creatorData = creatorDataList[index]?.data;
              username = creator.platform === 'Instagram' 
                ? creatorData?.user?.creator?.instagram 
                : creatorData?.user?.creator?.tiktok;
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
                  <Typography sx={{
                    fontFamily: 'Aileron',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#636366'
                  }}>
                    {username || 'Unknown'}
        </Typography>
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
            // Check if this is a manual entry (user.id matches submission.id)
            const isManualEntry = creator.submission.user?.id === creator.submission.id;
            
            let username;
            if (isManualEntry) {
              // For manual entries, get username from submission data
              username = creator.platform === 'Instagram' 
                ? creator.submission.user?.creator?.instagram 
                : creator.submission.user?.creator?.tiktok;
            } else {
              // For regular creators, get from fetched data
              const creatorData = creatorDataList[index]?.data;
              username = creator.platform === 'Instagram' 
                ? creatorData?.user?.creator?.instagram 
                : creatorData?.user?.creator?.tiktok;
            }
            
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
                  <Typography sx={{
                    fontFamily: 'Aileron',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#636366'
                  }}>
                    {username || 'Unknown'}
                  </Typography>
                </Box>

                {/* Progress bar and value on bottom */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Box sx={{ flex: 1, maxWidth: '360px' }}>
                    <Box sx={{
                      height: '32px',
                      backgroundColor: '#1340FF',
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
    // Calculate top 5 creators by engagement rate
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
            // Check if this is a manual entry (user.id matches submission.id)
            const isManualEntry = creator.submission.user?.id === creator.submission.id;
            
            let username;
            if (isManualEntry) {
              // For manual entries, get username from submission data
              username = creator.platform === 'Instagram' 
                ? creator.submission.user?.creator?.instagram 
                : creator.submission.user?.creator?.tiktok;
            } else {
              // For regular creators, get from fetched data
              const creatorData = creatorDataList[index]?.data;
              username = creator.platform === 'Instagram' 
                ? creatorData?.user?.creator?.instagram 
                : creatorData?.user?.creator?.tiktok;
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
                  <Typography
              sx={{
                      fontFamily: 'Aileron',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#636366',
                      lineHeight: '16px'
                    }}
              >
                    {username || 'Unknown'}
              </Typography>
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
                background: '#1340FF',
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
                  background: '#0F35E6',
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
            width: '79px',
            height: '44px',
            borderRadius: '8px',
            gap: '6px',
            padding: '10px 16px 13px 16px',
            background: '#1340FF',
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
              background: '#0F35E6',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.55) inset',
            },
            '&:active': {
              boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.45) inset',
              transform: 'translateY(1px)',
            }
          }}
        >
          Share
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
              startIcon={<Typography>+</Typography>}
              onClick={() => setSectionVisibility({ ...sectionVisibility, engagement: true })}
              sx={{
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                color: '#374151',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}
            >
              Engagements
            </Button>
          )}
          {!sectionVisibility.platformBreakdown && (
            <Button
              size="small"
              startIcon={<Typography>+</Typography>}
              onClick={() => setSectionVisibility({ ...sectionVisibility, platformBreakdown: true })}
              sx={{
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                color: '#374151',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}
            >
              Platform Breakdown
            </Button>
          )}
          {!sectionVisibility.views && (
            <Button
              size="small"
              startIcon={<Typography>+</Typography>}
              onClick={() => setSectionVisibility({ ...sectionVisibility, views: true })}
              sx={{
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                color: '#374151',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}
            >
              Views
            </Button>
          )}
          {!sectionVisibility.audienceSentiment && (
            <Button
              size="small"
              startIcon={<Typography>+</Typography>}
              onClick={() => setSectionVisibility({ ...sectionVisibility, audienceSentiment: true })}
              sx={{
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                color: '#374151',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}
            >
              Audience Sentiment
            </Button>
          )}
          {!sectionVisibility.creatorTiers && (
            <Button
              size="small"
              startIcon={<Typography>+</Typography>}
              onClick={() => setSectionVisibility({ ...sectionVisibility, creatorTiers: true })}
              sx={{
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                color: '#374151',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}
            >
              Creator Tiers
            </Button>
          )}
          {!sectionVisibility.strategies && (
            <Button
              size="small"
              startIcon={<Typography>+</Typography>}
              onClick={() => setSectionVisibility({ ...sectionVisibility, strategies: true })}
              sx={{
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                color: '#374151',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}
            >
              Strategies
            </Button>
          )}
          {!sectionVisibility.recommendations && (
            <Button
              size="small"
              startIcon={<Typography>+</Typography>}
              onClick={() => setSectionVisibility({ ...sectionVisibility, recommendations: true })}
              sx={{
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                border: '1px solid #E7E7E7',
                color: '#374151',
                '&:hover': { bgcolor: '#F9FAFB' }
              }}
            >
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
        
        <Box sx={{ position: 'relative', right: '-20px' }}>
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
            {formatNumber(summaryStats.totalLikes) || '0'}
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
            Total Likes
          </Typography>
        </Box>
      </Grid>
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
            {formatNumber(summaryStats.totalComments) || '0'}
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
            Total Comments
          </Typography>
        </Box>
      </Grid>
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
            {formatNumber(summaryStats.totalSaved) || '0'}
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
            Total Saved
          </Typography>
        </Box>
      </Grid>
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
                            {mostLikesCreatorData?.user?.creator?.instagram || mostLikesCreator?.submission?.user?.creator?.instagram || mostLikesCreatorData?.user?.creator?.tiktok || mostLikesCreator?.submission?.user?.creator?.tiktok || ''}
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
                            {mostSharesCreatorData?.user?.creator?.instagram || mostSharesCreator?.submission?.user?.creator?.instagram || mostSharesCreatorData?.user?.creator?.tiktok || mostSharesCreator?.submission?.user?.creator?.tiktok || ''}
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
                      const newComments = [...editableContent.positiveComments, { username, comment }];
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
              ) : null}
            </>
          )}
      </Box>
    </Box>

      {/* Neutral Comments */}
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
                      const newComments = [...editableContent.neutralComments, { username, comment }];
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
              ) : null}
            </>
          )}
        </Box>
        </Box>
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
                        const strong = document.createElement('strong');
                        strong.textContent = selectedText;
                        range.deleteContents();
                        range.insertNode(strong);
                        // Move cursor after the inserted element
                        const newRange = document.createRange();
                        newRange.setStartAfter(strong);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        const event = new Event('input', { bubbles: true });
                        document.querySelector('[data-creator-tiers-editor]').dispatchEvent(event);
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
                        const em = document.createElement('em');
                        em.textContent = selectedText;
                        range.deleteContents();
                        range.insertNode(em);
                        // Move cursor after the inserted element
                        const newRange = document.createRange();
                        newRange.setStartAfter(em);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        const event = new Event('input', { bubbles: true });
                        document.querySelector('[data-creator-tiers-editor]').dispatchEvent(event);
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
                        const u = document.createElement('u');
                        u.textContent = selectedText;
                        range.deleteContents();
                        range.insertNode(u);
                        // Move cursor after the inserted element
                        const newRange = document.createRange();
                        newRange.setStartAfter(u);
                        newRange.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        const event = new Event('input', { bubbles: true });
                        document.querySelector('[data-creator-tiers-editor]').dispatchEvent(event);
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
          // Calculate tier data from submissions
          const tierDataMap = new Map();
          
          if (campaign?.isCreditTier && submissions?.length > 0) {
            submissions.forEach((submission) => {
              const tier = submission?.user?.creator?.creditTier;
              if (tier) {
                const tierName = tier.name || 'Unknown';
                const engagementRate = submission?.insightData?.insight?.engagementRate || 
                                      submission?.engagementRate || 
                                      null;
                
                if (!tierDataMap.has(tierName)) {
                  tierDataMap.set(tierName, {
                    name: tierName,
                    engagementRates: [],
                  });
                }
                
                if (engagementRate !== null && engagementRate !== undefined) {
                  tierDataMap.get(tierName).engagementRates.push(parseFloat(engagementRate));
                }
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
                background: 'linear-gradient(135deg, #8A5AFE 0%, #A855F7 100%)',
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
              right: '12px',
              left: '70px', // Space for circle
              top: isEditMode ? '20px' : '50%',
              transform: isEditMode ? 'none' : 'translateY(-50%)',
               maxWidth: 'calc(480px - 82px)', // Card width minus circle space
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
                background: '#D4FF00',
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
              right: '12px',
              left: '70px', // Space for circle
              top: isEditMode ? '20px' : '50%',
              transform: isEditMode ? 'none' : 'translateY(-50%)',
               maxWidth: 'calc(480px - 82px)', // Card width minus circle space
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
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
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

        {/* Add Persona Button - Show when there are less than 3 cards */}
        {(!showEducatorCard || !showThirdCard) && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3, ml: 2 }}>
            <IconButton
              onClick={() => {
                if (!showEducatorCard) {
                  setShowEducatorCard(true);
                } else if (!showThirdCard) {
                  setShowThirdCard(true);
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
                const visibleCards = 1 + (showEducatorCard ? 1 : 0) + (showThirdCard ? 1 : 0);
                if (visibleCards === 1) return '220px';
                if (visibleCards === 2) return '580px';
                if (visibleCards === 3) return '580px';
                return '460px'; // 3 cards
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
            <Box sx={{ display: 'flex', flexDirection: (showEducatorCard || showThirdCard) ? 'column' : 'row', alignItems: 'center', gap: (showEducatorCard || showThirdCard) ? 3 : 2, flex: 1 }}>
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
                          const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || 1;
                          const thirdCount = parseInt(editableContent.thirdCreatorCount, 10) || 1;
                          const total = comicCount + educatorCount + thirdCount;
                          const comicPercentage = comicCount / total;
                          const educatorPercentage = educatorCount / total;
                          const thirdPercentage = thirdCount / total;
                          
                          // Calculate cumulative angles
                          const comicAngle = comicPercentage * 2 * Math.PI;
                          const educatorAngle = educatorPercentage * 2 * Math.PI;
                          const thirdAngle = thirdPercentage * 2 * Math.PI;
                          
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
                          
                          const comicMidAngle = comicAngle / 2;
                          const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                          const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                          
                          const educatorMidAngle = comicAngle + educatorAngle / 2;
                          const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                          const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                          
                          const thirdMidAngle = comicAngle + educatorAngle + thirdAngle / 2;
                          const thirdTextX = 80 + 35 * Math.sin(thirdMidAngle);
                          const thirdTextY = 80 - 35 * Math.cos(thirdMidAngle);
                          
                          return (
                            <>
                              {/* Comic segment (purple) */}
                              <path
                                d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`}
                                fill="#8A5AFE"
                              />
                              {/* Educator segment (yellow-green) */}
                              <path
                                d={`M 80 80 L ${comicEndX} ${comicEndY} A 70 70 0 ${educatorLargeArc} 1 ${educatorEndX} ${educatorEndY} Z`}
                                fill="#D4FF00"
                              />
                              {/* Third segment (orange-red) */}
                              <path
                                d={`M 80 80 L ${educatorEndX} ${educatorEndY} A 70 70 0 ${thirdLargeArc} 1 80 10 Z`}
                                fill="#FF6B35"
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
                              {/* Third number */}
                              {thirdCount > 0 && (
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
                          const educatorPercentage = educatorCount / total;
                          const comicPercentage = comicCount / total;
                          
                          // Calculate angles
                          const educatorAngle = educatorPercentage * 2 * Math.PI;
                          const comicAngle = comicPercentage * 2 * Math.PI;
                          
                          // Calculate path for educator segment
                          const educatorEndX = 80 + 70 * Math.sin(educatorAngle);
                          const educatorEndY = 80 - 70 * Math.cos(educatorAngle);
                          const educatorLargeArc = educatorPercentage > 0.5 ? 1 : 0;
                          
                          // Calculate positions for numbers (middle of each segment)
                          // Educator number position (middle of yellow segment)
                          const educatorMidAngle = educatorAngle / 2;
                          const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                          const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                          
                          // Comic number position (middle of purple segment)
                          const comicMidAngle = educatorAngle + (comicAngle / 2);
                          const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                          const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                          
                          return (
                            <>
                              <circle cx="80" cy="80" r="70" fill="#D4FF00" />
                              <path
                                d={`M 80 80 L 80 10 A 70 70 0 ${educatorLargeArc} 1 ${educatorEndX} ${educatorEndY} Z`}
                                fill="#8A5AFE"
                              />
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
                        fill="#8A5AFE"
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
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', px: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: '12px',
                      height: '12px',
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
                      }}
                    >
                    {editableContent.comicTitle} ({editableContent.creatorStrategyCount || '1'})
                    </Typography>
                </Box>
                {showEducatorCard && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        bgcolor: '#D4FF00',
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
                  }}
                >
                      {editableContent.educatorTitle} ({editableContent.educatorCreatorCount || '1'})
                </Typography>
        </Box>
        )}
                {showThirdCard && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        bgcolor: '#FF6B35',
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
                }}
              >
                      {editableContent.thirdTitle} ({editableContent.thirdCreatorCount || '1'})
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
                      background: 'linear-gradient(135deg, #8A5AFE 0%, #A855F7 100%)',
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
                      background: 'linear-gradient(135deg, #8A5AFE 0%, #A855F7 100%)',
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
                    background: '#D4FF00',
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
                    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
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
                  const visibleCards = 1 + (showEducatorCard ? 1 : 0) + (showThirdCard ? 1 : 0);
                  if (visibleCards === 1) return '220px';
                  if (visibleCards === 2) return '340px';
                  return '460px'; // 3 cards
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
                <Box sx={{ display: 'flex', flexDirection: (showEducatorCard || showThirdCard) ? 'column' : 'row', alignItems: 'center', gap: (showEducatorCard || showThirdCard) ? 3 : 2, flex: 1 }}>
                {/* Full Circle Chart or Pie Chart */}
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: (showEducatorCard || showThirdCard) ? 1 : 'none' }}>
                    {(() => {
                      // Render different chart based on number of personas
                      if (showThirdCard) {
                        // Pie chart when 3 personas are visible
                        return (
                      <>
                        <svg width="280" height="280" viewBox="0 0 160 160">
                          {(() => {
                            const comicCount = parseInt(editableContent.creatorStrategyCount, 10) || 1;
                            const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || 1;
                            const thirdCount = parseInt(editableContent.thirdCreatorCount, 10) || 1;
                            const total = comicCount + educatorCount + thirdCount;
                            const comicPercentage = comicCount / total;
                            const educatorPercentage = educatorCount / total;
                            const thirdPercentage = thirdCount / total;
                            
                            const comicAngle = comicPercentage * 2 * Math.PI;
                            const educatorAngle = educatorPercentage * 2 * Math.PI;
                            const thirdAngle = thirdPercentage * 2 * Math.PI;
                            
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
  
                            const comicMidAngle = comicAngle / 2;
                            const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                            const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                            
                            const educatorMidAngle = comicAngle + educatorAngle / 2;
                            const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                            const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                            
                            const thirdMidAngle = comicAngle + educatorAngle + thirdAngle / 2;
                            const thirdTextX = 80 + 35 * Math.sin(thirdMidAngle);
                            const thirdTextY = 80 - 35 * Math.cos(thirdMidAngle);
                            
                            return (
                              <>
                                {/* Comic segment (purple) */}
                                <path
                                  d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`}
                                  fill="#8A5AFE"
                                />
                                {/* Educator segment (yellow-green) */}
                                <path
                                  d={`M 80 80 L ${comicEndX} ${comicEndY} A 70 70 0 ${educatorLargeArc} 1 ${educatorEndX} ${educatorEndY} Z`}
                                  fill="#D4FF00"
                                />
                                {/* Third segment (orange-red) */}
                                <path
                                  d={`M 80 80 L ${educatorEndX} ${educatorEndY} A 70 70 0 ${thirdLargeArc} 1 80 10 Z`}
                                  fill="#FF6B35"
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
                                {thirdCount > 0 && (
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
                            const educatorPercentage = educatorCount / total;
                            const comicPercentage = comicCount / total;
                            
                            // Calculate angles
                            const educatorAngle = educatorPercentage * 2 * Math.PI;
                            const comicAngle = comicPercentage * 2 * Math.PI;
                            
                            // Calculate path for educator segment
                            const educatorEndX = 80 + 70 * Math.sin(educatorAngle);
                            const educatorEndY = 80 - 70 * Math.cos(educatorAngle);
                            const educatorLargeArc = educatorPercentage > 0.5 ? 1 : 0;
                            
                            // Calculate positions for numbers (middle of each segment)
                            // Educator number position (middle of yellow segment)
                            const educatorMidAngle = educatorAngle / 2;
                            const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
                            const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);
                            
                            // Comic number position (middle of purple segment)
                            const comicMidAngle = educatorAngle + (comicAngle / 2);
                            const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
                            const comicTextY = 80 - 35 * Math.cos(comicMidAngle);
                            
                            return (
                              <>
                                <circle cx="80" cy="80" r="70" fill="#D4FF00" />
                                <path
                                  d={`M 80 80 L 80 10 A 70 70 0 ${educatorLargeArc} 1 ${educatorEndX} ${educatorEndY} Z`}
                                  fill="#8A5AFE"
                                />
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
                            fill="#8A5AFE"
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%', px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: '12px',
                          height: '12px',
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
                  }}
                >
                        {editableContent.comicTitle} ({editableContent.creatorStrategyCount || '1'})
                </Typography>
                    </Box>
                    {showEducatorCard && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            bgcolor: '#D4FF00',
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
                  }}
                >
                          {editableContent.educatorTitle} ({editableContent.educatorCreatorCount || '1'})
                </Typography>
              </Box>
                    )}
                    {showThirdCard && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            bgcolor: '#FF6B35',
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
                          }}
                        >
                          {editableContent.thirdTitle} ({editableContent.thirdCreatorCount || '1'})
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
                  p: 1.5, 
                  color: 'white', 
                  height: '120px', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: index === editableContent.improvedInsights.length - 1 ? '0 0 12px 12px' : 0,
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
                    fontSize: '12px', 
                    lineHeight: '18px',
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {editableContent.workedWellInsights.length === 0 && !isEditMode && (
              <Box className="hide-in-pdf" sx={{ 
                background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
                opacity: 0.85,
                p: 3, 
                color: 'white', 
                height: '120px', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0 0 12px 12px',
              }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '20px', opacity: 0.9 }}>
                  Click Edit Report to edit What Worked Well
                </Typography>
              </Box>
            )}
            {editableContent.workedWellInsights.map((insight, index) => (
              <Box 
                key={index}
                sx={{ 
                  background: 'linear-gradient(0deg, #8A5AFE, #8A5AFE)',
                  opacity: getWorkedWellOpacity(index),
                  p: 1, 
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
                    fontSize: '12px', 
                    lineHeight: '18px',
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
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
                  p: 1, 
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
                    fontSize: '12px', 
                    lineHeight: '18px',
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
  }),
  onBack: PropTypes.func.isRequired,
};

export default PCRReportPage;
