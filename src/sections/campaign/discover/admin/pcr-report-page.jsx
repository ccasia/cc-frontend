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

import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box, Grid, Link, Button, Avatar, Popover, Snackbar, TextField, Typography, IconButton, InputAdornment, CircularProgress } from '@mui/material';

import { useSocialInsights } from 'src/hooks/use-social-insights';
import useGetCreatorById from 'src/hooks/useSWR/useGetCreatorById';

import { extractPostingSubmissions } from 'src/utils/extractPostingLinks';
import {
  formatNumber,
  getMetricValue,
  calculateSummaryStats,
  calculateEngagementRate,
} from 'src/utils/socialMetricsCalculator';

// Helper function to get background color based on index
const getImprovedInsightBgColor = (index) => {
  if (index === 0) return '#1340FFD9';
  if (index === 1) return '#1340FFBF';
  return '#1340FFA6';
};

// Helper function to get opacity based on index
const getWorkedWellOpacity = (index) => {
  if (index === 0) return 0.85;
  if (index === 1) return 0.75;
  return 0.65;
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
  
  // Show second persona card state
  const [showEducatorCard, setShowEducatorCard] = useState(false);
  
  // Editable content state - Initialize with empty/default values
  const [editableContent, setEditableContent] = useState({
    campaignDescription: '',
    engagementDescription: '',
    viewsDescription: '',
    audienceSentimentDescription: '',
    noteworthyCreatorsDescription: '',
    bestPerformingPersonasDescription: '',
    positiveComments: [],
    neutralComments: [],
    comicTitle: 'The Comic',
    comicEmoji: '🎭',
    comicContentStyle: '',
    comicWhyWork: '',
    educatorTitle: 'The Educator',
    educatorEmoji: '👨‍🏫',
    educatorContentStyle: '',
    educatorWhyWork: '',
    improvedInsights: [],
    workedWellInsights: [],
    nextStepsInsights: [],
  });
  
  // Loading and saving states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPCR, setIsLoadingPCR] = useState(true);
  
  // Emoji picker state
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [emojiPickerType, setEmojiPickerType] = useState(null); // 'comic' or 'educator'
  
  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Ref for PDF export
  const reportRef = useRef(null);
  
  // Extract posting submissions from campaign data
  const submissions = useMemo(() => campaign?.submission || [], [campaign?.submission]);
  const postingSubmissions = useMemo(() => extractPostingSubmissions(submissions), [submissions]);
  const campaignId = campaign?.id;

  // Fetch social insights data
  const { 
    data: insightsData, 
    isLoading: loadingInsights 
  } = useSocialInsights(postingSubmissions, campaignId);

  // Filter insights data for all platforms
  const filteredInsightsData = useMemo(() => {
    if (!insightsData || insightsData.length === 0) return [];
    return insightsData;
  }, [insightsData]);

  // Filter submissions for all platforms  
  const filteredSubmissions = useMemo(() => 
    postingSubmissions.filter((sub) => sub && sub.platform)
  , [postingSubmissions]);

  // Calculate summary statistics from real data
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
    return calculateSummaryStats(filteredInsightsData);
  }, [filteredInsightsData]);

  // Debug logging
  useEffect(() => {
    console.log('PCR Report - Campaign ID:', campaignId);
    console.log('PCR Report - Posting Submissions:', postingSubmissions.length);
    console.log('PCR Report - Insights Data:', insightsData?.length || 0);
    console.log('PCR Report - Loading:', loadingInsights);
    console.log('PCR Report - Summary Stats:', summaryStats);
  }, [campaignId, postingSubmissions, insightsData, loadingInsights, summaryStats]);

  // Fetch engagement heatmap data from backend API
  const { data: heatmapApiData, isLoading: heatmapLoading, error: heatmapError } = useSWR(
    campaign?.id ? `/api/campaign/${campaign.id}/trends/engagement-heatmap?platform=All&weeks=6` : null,
    async (url) => {
      console.log('🔍 Fetching heatmap from:', url);
      const response = await axios.get(url);
      console.log('✅ Heatmap API response:', response.data);
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
          setEditableContent(response.data.data.content);
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
  const saveToHistory = (content) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(content)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditableContent(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditableContent(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // Track changes for undo/redo
  useEffect(() => {
    if (isEditMode && history.length === 0) {
      // Initialize history when entering edit mode
      saveToHistory(editableContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // Save to history when content changes (debounced)
  useEffect(() => {
    if (!isEditMode || history.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      // Only save if content actually changed
      const lastContent = history[historyIndex];
      if (JSON.stringify(lastContent) !== JSON.stringify(editableContent)) {
        saveToHistory(editableContent);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editableContent, isEditMode]);

  const handleSavePCR = async () => {
    if (!campaign?.id) return;
    
    try {
      setIsSaving(true);
      console.log('💾 Saving PCR data for campaign:', campaign.id);
      
      const response = await axios.post(`/api/campaign/${campaign.id}/pcr`, {
        content: editableContent,
      });
      
      if (response.data.success) {
        console.log('✅ PCR data saved successfully');
        setShowSuccessMessage(true);
        setIsEditMode(false);
        // Clear history after successful save
        setHistory([]);
        setHistoryIndex(-1);
      }
    } catch (error) {
      console.error('❌ Error saving PCR data:', error);
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

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        windowWidth: 1078,
      });

      // Show buttons again after capturing
      buttonsToHide.forEach(el => {
        el.style.display = '';
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      // eslint-disable-next-line new-cap
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

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
    }
  };
  
  // Manual refresh function for insights
  const handleRefreshInsights = async () => {
    try {
      console.log('🔄 Triggering manual insights refresh...');
      const response = await axios.post(`/api/campaign/${campaign.id}/trends/refresh`);
      console.log('✅ Refresh response:', response.data);
      alert('Insights refreshed! Please wait a moment and refresh the page.');
      // Revalidate the heatmap data
      window.location.reload();
    } catch (error) {
      console.error('❌ Error refreshing insights:', error);
      alert(`Failed to refresh insights: ${error.response?.data?.message || error.message}`);
    }
  };

  // EngagementRateHeatmap component
  const EngagementRateHeatmap = () => {
    // Process engagement data by day and week
    const heatmapData = useMemo(() => {
      // If API has sufficient data (more than 7 days), use it
      if (heatmapApiData && heatmapApiData.heatmap && heatmapApiData.heatmap.length > 0) {
        // Count how many days have actual data
        let daysWithData = 0;
        heatmapApiData.heatmap.forEach(weekData => {
          weekData.forEach(dayData => {
            if (dayData && dayData.hasData && dayData.engagementRate !== null) {
              daysWithData += 1;
            }
          });
        });
        
        console.log(`Heatmap - API has ${daysWithData} days with data`);
        
        // Only use API data if we have at least 7 days (1 week) of historical data
        if (daysWithData >= 7) {
          console.log('Heatmap - Using API data (sufficient historical data)');
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const processedData = {};
          
          heatmapApiData.heatmap.forEach((weekData, weekIndex) => {
            const weekKey = `W${weekIndex + 1}`;
            processedData[weekKey] = {};
            
            weekData.forEach((dayData, dayIndex) => {
              const dayKey = days[dayIndex];
              processedData[weekKey][dayKey] = dayData?.engagementRate || 0;
            });
          });

          return processedData;
        }
        
        console.log('Heatmap - API data insufficient, falling back to manual calculation');
      }

      // Fall back to manual calculation if API doesn't have data
      console.log('Heatmap - Using manual calculation (API not available)');
      console.log('Heatmap - filteredInsightsData:', filteredInsightsData);
      console.log('Heatmap - filteredInsightsData length:', filteredInsightsData?.length);
      
      if (!filteredInsightsData || filteredInsightsData.length === 0) {
        console.log('⚠️ Heatmap - No insights data available, returning empty grid');
        return {
          W1: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W2: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W3: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W4: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W5: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W6: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
        };
      }

      // Create a map to store engagement rates by day and week
      const weeklyData = {};
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      // Initialize 6 weeks of data
      for (let week = 1; week <= 6; week += 1) {
        weeklyData[`W${week}`] = {};
        days.forEach(day => {
          weeklyData[`W${week}`][day] = [];
        });
      }

      // Find the earliest actual post date from Instagram/TikTok
      const actualPostDates = filteredInsightsData
        .filter(insight => insight.video?.timestamp || insight.video?.create_time)
        .map(insight => new Date(insight.video.timestamp || insight.video.create_time).getTime());
      
      if (actualPostDates.length === 0) {
        return {
          W1: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W2: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W3: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W4: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W5: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
          W6: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
        };
      }
      
      const earliestActualPost = Math.min(...actualPostDates);
      const firstPostDate = new Date(earliestActualPost);
      
      // Calculate the Monday of the week when the first post was published
      const dayOfWeek = firstPostDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStartMonday = new Date(firstPostDate);
      weekStartMonday.setDate(firstPostDate.getDate() - daysToMonday);
      weekStartMonday.setHours(0, 0, 0, 0);
      
      filteredInsightsData.forEach((insightData) => {
        const actualPostTimestamp = insightData.video?.timestamp || insightData.video?.create_time;
        
        if (actualPostTimestamp) {
          const postDate = new Date(actualPostTimestamp);
          const postDateMidnight = new Date(postDate);
          postDateMidnight.setHours(0, 0, 0, 0);
          
          const engagementRate = parseFloat(calculateEngagementRate(insightData.insight));
          
          if (!Number.isNaN(engagementRate) && engagementRate >= 0) {
            // Fill engagement rate for every day from post date onwards through all 6 weeks
            for (let week = 1; week <= 6; week += 1) {
              const weekStartDate = new Date(weekStartMonday);
              weekStartDate.setDate(weekStartMonday.getDate() + (week - 1) * 7);
              
              for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
                const currentDate = new Date(weekStartDate);
                currentDate.setDate(weekStartDate.getDate() + dayIndex);
                currentDate.setHours(0, 0, 0, 0);
                
                if (currentDate >= postDateMidnight) {
                  const dayName = days[dayIndex];
                  weeklyData[`W${week}`][dayName].push(engagementRate);
                }
              }
            }
          }
        }
      });

      // Calculate average engagement rate for each day/week combination
      const processedData = {};
      Object.keys(weeklyData).forEach(week => {
        processedData[week] = {};
        days.forEach(day => {
          const rates = weeklyData[week][day];
          if (rates.length > 0) {
            processedData[week][day] = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
          } else {
            processedData[week][day] = 0;
          }
        });
      });

      return processedData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [heatmapApiData, filteredInsightsData, filteredSubmissions, campaign]);

    // Get color based on engagement rate
    const getHeatmapColor = (rate) => {
      if (rate < 1.5) return '#E6EFFF'; // 0 - 1.5% - very light blue
      if (rate < 3) return '#98BBFF'; // 1.5-3% - light blue  
      if (rate < 6) return '#1340FF'; // 3-6% - medium blue
      return '#01197B'; // > 6% - dark blue
    };

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];

    return (
      <Box
        sx={{
          width: '421px',
          height: '401px',
          borderRadius: '16px',
          gap: '10px',
          opacity: 1,
          paddingTop: '16px',
          paddingRight: '16px',
          paddingBottom: '24px',
          paddingLeft: '16px',
          background: '#F5F5F5',
          border: '1px solid #F5F5F5',
          boxSizing: 'border-box',
          marginLeft: '-92px', 
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Aileron',
            fontWeight: 600,
            fontStyle: 'normal',
            fontSize: '24px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'left',
            color: '#231F20',
          }}
        >
          Engagement Rate Heatmap
        </Typography>

        {/* Heatmap Grid */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 2 }}>
          {/* Heatmap rows */}
          {days.map((day) => (
            <Box key={day} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Box
                sx={{
                  width: '40px',
                  fontFamily: 'Inter Display, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '18px',
                  color: '#231F20',
                  textAlign: 'right',
                  pr: 1,
                }}
              >
                {day}
              </Box>
              {weeks.map((week) => {
                const rate = heatmapData?.[week]?.[day] || 0;
                return (
                  <Box
                    key={`${week}-${day}`}
                    sx={{
                      width: '50px',
                      height: '30px',
                      backgroundColor: getHeatmapColor(rate),
                      borderRadius: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                );
              })}
            </Box>
          ))}
          
          {/* Week labels at bottom */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            <Box sx={{ width: '40px' }} /> {/* Empty space for alignment */}
            {weeks.map((week) => (
              <Box
                key={week}
                sx={{
                  width: '50px',
                  textAlign: 'center',
                  fontFamily: 'Inter Display, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  lineHeight: '18px',
                  color: '#231F20',
                }}
              >
                {week}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 2 }}>
          {/* Color boxes with percentage labels */}
          <Box sx={{ display: 'flex', gap: 0 }}>
            <Box 
              sx={{ 
                minWidth: '80px',
                height: '18px', 
                backgroundColor: '#E6EFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter Display, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: '#231F20',
              }}
            >
              {'< 1.5%'}
            </Box>
            <Box 
              sx={{ 
                minWidth: '90px',
                height: '18px', 
                backgroundColor: '#98BBFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter Display, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: '#231F20',
              }}
            >
              1.5% - 3%
            </Box>
            <Box 
              sx={{ 
                minWidth: '80px',
                height: '18px', 
                backgroundColor: '#1340FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter Display, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              3% - 6%
            </Box>
            <Box 
              sx={{ 
                minWidth: '70px',
                height: '18px', 
                backgroundColor: '#01197B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter Display, sans-serif',
                fontSize: '11px',
                fontWeight: 500,
                color: '#FFFFFF',
              }}
            >
              {'> 6%'}
            </Box>
          </Box>

          {/* Labels below */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '320px', mt: 1 }}>
            <Typography 
              sx={{ 
                fontFamily: 'Inter Display, sans-serif',
                fontSize: '10px', 
                fontWeight: 600,
                lineHeight: '14px',
                letterSpacing: '0%',
                color: '#231F20',
              }}
            >
            Lowest Engagement
          </Typography>
            <Typography 
              sx={{ 
                fontFamily: 'Inter Display, sans-serif',
                fontSize: '10px', 
                fontWeight: 600,
                lineHeight: '14px',
                letterSpacing: '0%',
                color: '#231F20',
              }}
            >
            Highest Engagement
          </Typography>
        </Box>
        </Box>
      </Box>
    );
  };

  // PlatformInteractionsChart component
  const PlatformInteractionsChart = () => {
    // Calculate platform-specific interactions from API data
    const platformData = useMemo(() => {
      console.log('Platform Chart - Insights data:', filteredInsightsData?.length);
      console.log('Platform Chart - Submissions:', filteredSubmissions?.length);
      
      if (!filteredInsightsData || filteredInsightsData.length === 0) {
        console.log('Platform Chart - No data, returning zeros');
        return { instagram: 0, tiktok: 0, total: 0 };
      }

      let instagramInteractions = 0;
      let tiktokInteractions = 0;

      filteredInsightsData.forEach((insightData) => {
        const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);
        console.log('Platform Chart - Submission:', submission?.platform, 'Insight:', insightData.insight);
        
        if (submission && insightData.insight) {
          // Use getMetricValue helper to extract metrics from insight array
          const likes = getMetricValue(insightData.insight, 'likes');
          const comments = getMetricValue(insightData.insight, 'comments');
          const shares = getMetricValue(insightData.insight, 'shares');
          const saved = getMetricValue(insightData.insight, 'saved');
          
          // Calculate total interactions
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

    // Calculate percentages for the donut chart
    const instagramPercentage = platformData.total > 0 ? (platformData.instagram / platformData.total) * 100 : 0;
    const tiktokPercentage = platformData.total > 0 ? (platformData.tiktok / platformData.total) * 100 : 0;
    
    // Add gap between segments (2 degrees gap = ~2.8 units at radius 80)
    const gapDegrees = 2;
    const gapLength = (gapDegrees / 360) * (80 * 2 * Math.PI);
    
    // Calculate angles for segments
    // TikTok starts at -45 degrees (top-left), goes clockwise
    const tiktokStartAngle = -45;
    const tiktokSweepAngle = (tiktokPercentage / 100) * 360 - gapDegrees;
    const tiktokEndAngle = tiktokStartAngle + tiktokSweepAngle;
    
    // Instagram starts at 135 degrees (bottom-right), goes counter-clockwise
    const instagramStartAngle = 135;
    const instagramSweepAngle = (instagramPercentage / 100) * 360 - gapDegrees;
    const instagramEndAngle = instagramStartAngle - instagramSweepAngle;
    
    // Calculate path lengths for stroke-dasharray
    const circumference = 80 * 2 * Math.PI;
    const tiktokPathLength = (tiktokPercentage / 100) * circumference - gapLength;
    const instagramPathLength = (instagramPercentage / 100) * circumference - gapLength;

    return (
      <Box
        sx={{
          width: '292px',
          height: '400px',
          borderRadius: '16px',
          gap: '10px',
          opacity: 1,
          paddingTop: '16px',
          paddingRight: '16px',
          paddingBottom: '24px',
          paddingLeft: '16px',
          background: '#F5F5F5',
          border: '1px solid #F5F5F5',
          boxSizing: 'border-box',
          marginLeft: '10px',
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
            fontSize: '24px',
            lineHeight: '100%',
            letterSpacing: '0%',
            textAlign: 'left',
            color: '#231F20',
            mb: 2,
            alignSelf: 'flex-start',
          }}
        >
          Platform Interactions
        </Typography>

        {/* Donut Chart with External Labels */}
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '280px', overflow: 'visible' }}>
          <svg width="280" height="240" viewBox="0 0 280 240" style={{ overflow: 'visible' }}>
            {/* Background circle */}
            <circle
              cx="140"
              cy="120"
              r="80"
              fill="transparent"
              stroke="#E5E7EB"
              strokeWidth="18"
            />
            
            {/* TikTok segment (black) - connects to top-left arrow */}
            {platformData.tiktok > 0 && (
              <circle
                cx="140"
                cy="120"
                r="80"
                fill="transparent"
                stroke="#000000"
                strokeWidth="18"
                strokeDasharray={`${tiktokPathLength} ${circumference}`}
                strokeLinecap="round"
                // Start at -45 degrees (top-left where arrow connects)
                transform="rotate(-45 140 120)"
              />
            )}
            
            {/* Instagram segment (magenta/pink) - connects to bottom-right arrow */}
            {platformData.instagram > 0 && (
              <circle
                cx="140"
                cy="120"
                r="80"
                fill="transparent"
                stroke="#C13584"
                strokeWidth="18"
                strokeDasharray={`${instagramPathLength} ${circumference}`}
                strokeLinecap="round"
                // Start at 135 degrees (bottom-right where arrow connects)
                // Position after TikTok with gap
                transform={`rotate(${-45 + (tiktokPercentage / 100) * 360 + gapDegrees} 140 120)`}
              />
            )}
            
            {/* TikTok leader line - top left */}
            {platformData.tiktok > 0 && (
              <>
                {/* Calculate connection point: from center (140, 120) to (85, 60) at radius 80 */}
                {/* Angle: atan2(60-120, 85-140) = atan2(-60, -55) ≈ -132 degrees, but we need the point on circle */}
                {/* Point on circle at -45 degrees: 140 + 80*cos(-45), 120 + 80*sin(-45) = 140-56.57, 120-56.57 = 83.43, 63.43 */}
                <line x1="83" y1="63" x2="80" y2="30" stroke="#000000" strokeWidth="1.5" />
                <line x1="80" y1="30" x2="15" y2="30" stroke="#000000" strokeWidth="1.5" />
              </>
            )}
            
            {/* Instagram leader line - bottom right */}
            {platformData.instagram > 0 && (
              <>
                {/* Calculate connection point: from center (140, 120) to (195, 180) at radius 80 */}
                {/* Point on circle at 135 degrees: 140 + 80*cos(135), 120 + 80*sin(135) = 140-56.57, 120+56.57 = 83.43, 176.57 */}
                <line x1="197" y1="177" x2="200" y2="210" stroke="#C13584" strokeWidth="1.5" />
                <line x1="200" y1="210" x2="265" y2="210" stroke="#C13584" strokeWidth="1.5" />
              </>
            )}
          </svg>
          
          {/* Center text */}
          <Box
            sx={{
              position: 'absolute',
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
                fontSize: '32px',
                lineHeight: '36px',
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
                fontSize: '12.52px',
                lineHeight: '100%',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#000000E5',
              }}
            >
              Total Interactions
            </Typography>
          </Box>

          {/* TikTok external label - positioned on the leader line at top-left */}
          {platformData.tiktok > 0 && (
          <Box
            sx={{
              position: 'absolute',
              // The horizontal line segment is at y=30 in SVG viewBox (0 0 280 240)
              // SVG height is 240, container height is 280px
              // Line position: (30/240) * 280 = 35px from top of container
              // Position so the line goes between the two text elements
              top: '28px', // Adjusted to align with line at y=30
              left: '5px', // Moved more to the left to match Instagram positioning
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: '12px',
                lineHeight: '14px',
                letterSpacing: '0%',
                color: '#000000B2',
                mb: 0,
                pb: '6px', // Gap below the word (above the line)
              }}
            >
              TikTok
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '12px',
                lineHeight: '14px',
                letterSpacing: '0%',
                color: '#000000B2',
                mt: 0,
                pt: '6px', // Increased gap above the number (below the line)
              }}
            >
              {formatNumber(platformData.tiktok)}
            </Typography>
          </Box>
          )}

          {/* Instagram external label - positioned on the leader line at bottom-right */}
          {platformData.instagram > 0 && (
          <Box
            sx={{
              position: 'absolute',
              // The horizontal line segment is at y=210 in SVG viewBox (0 0 280 240)
              // SVG height is 240, container height is 280px
              // Line position: (210/240) * 280 = 245px from top of container
              // From bottom: 280 - 245 = 35px, but we need to center the label on the line
              // Position so the line goes between the two text elements
              bottom: '32px', // Adjusted to align with line at y=210
              right: '5px', // Moved more to the right
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: '12px',
                lineHeight: '14px',
                letterSpacing: '0%',
                color: '#000000B2',
                mb: 0,
                pb: '6px', // Increased gap below the word
              }}
            >
              Instagram
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '12px',
                lineHeight: '14px',
                letterSpacing: '0%',
                color: '#000000B2',
                mt: 0,
                pt: '2px', // Space below the line
              }}
            >
              {formatNumber(platformData.instagram)}
            </Typography>
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

      // Get actual post dates from Instagram/TikTok video data
      const actualPostDates = filteredInsightsData
        .filter(insight => insight.video?.timestamp || insight.video?.create_time)
        .map(insight => new Date(insight.video.timestamp || insight.video.create_time).getTime());
      
      const earliestActualPost = actualPostDates.length > 0 ? Math.min(...actualPostDates) : Date.now();
      const campaignStart = new Date(campaign?.startDate || earliestActualPost);
      
      console.log('Chart - Campaign Start:', campaignStart);

      // Group views by week - based on actual Instagram/TikTok post dates
      const weeklyData = {};
      
      filteredInsightsData.forEach((insightData) => {
        if (insightData.insight && insightData.video) {
          // Use actual post timestamp from Instagram/TikTok
          const actualPostTimestamp = insightData.video.timestamp || insightData.video.create_time;
          
          if (actualPostTimestamp) {
            const postDate = new Date(actualPostTimestamp);
            const views = getMetricValue(insightData.insight, 'views');
            
            // Calculate which week this post belongs to
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

      // Find the earliest post date in the highest week
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
      
      // Simulate daily view distribution for the week
      // This assumes views are concentrated in the first few days after posting
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

  // Get creator data for all cards
  const { data: topEngagementCreatorData } = useGetCreatorById(topEngagementCreator?.user);
  const { data: mostViewsCreatorData } = useGetCreatorById(mostViewsCreator?.submission?.user);
  const { data: mostCommentsCreatorData } = useGetCreatorById(mostCommentsCreator?.submission?.user);
  const { data: mostLikesCreatorData } = useGetCreatorById(mostLikesCreator?.submission?.user);

  // TopEngagementCard component
  const TopEngagementCard = () => {
    const creator = topEngagementCreatorData;

    if (!topEngagementCreator) {
      return (
        <Box
          sx={{
            height: '400px',
            width: '100%',
            backgroundColor: '#F5F5F5',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px'
          }}
        >
          <Typography variant="h6" fontWeight={600} fontFamily="Aileron" color="#231F20" sx={{ mb: 2 }}>
            Top Engagement
          </Typography>
          <Typography variant="body2" color="#64748B">
            No engagement data available
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: '228px',
          height: '400px',
          gap: '15px',
          opacity: 1,
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          backgroundColor: '#F5F5F5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          borderRadius: '12px',
          boxSizing: 'border-box',
        }}
      >
        <Typography variant="h6" fontWeight={600} fontFamily="Aileron" color="#231F20">
          Top Engagement
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography
            fontFamily="Instrument Serif"
            fontWeight={400}
            fontSize={55}
            color="#1340FF"
            textAlign="center"
          >
            {topEngagementCreator.engagementRate}%
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 45,
                height: 45,
                bgcolor:
                  topEngagementCreator && topEngagementCreator.platform === 'Instagram'
                    ? '#E4405F'
                    : '#000000',
                mr: 1,
              }}
            >
              {creator?.user?.name?.charAt(0) || 'U'}
            </Avatar>
            <Box
              sx={{
                height: 40,
                maxWidth: 100,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography
                fontSize={14}
                fontWeight={600}
                color="#231F20"
                sx={{ textAlign: 'left' }}
                noWrap
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {creator?.user?.name || 'Unknown'}
              </Typography>
              <Typography fontSize={12} color="#636366" sx={{ textAlign: 'left' }}>
                {creator?.user?.creator?.instagram || creator?.user?.creator?.tiktok || ''}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ alignSelf: 'center' }}>
          <Link
            href={topEngagementCreator.insightData.postUrl}
            target="_blank"
            rel="noopener"
            sx={{
              display: 'block',
              textDecoration: 'none',
              '&:hover': {
                opacity: 0.8,
                transition: 'opacity 0.2s',
              },
            }}
          >
            <Box
              component="img"
              src={
                topEngagementCreator.insightData.thumbnail ||
                topEngagementCreator.insightData.video?.media_url
              }
              alt="Top performing post"
              sx={{
                width: '188px',
                height: '180px',
                mt: 0,
                borderRadius: 2,
                objectFit: 'cover',
                objectPosition: 'left top',
                border: '1px solid #e0e0e0',
              }}
            />
          </Link>
        </Box>
      </Box>
    );
  };

  return (
  <Box
    sx={{
      width: '1078px',
      minHeight: '2923px',
      padding: '24px',
      gap: '10px',
      background: 'linear-gradient(180deg, #1340FF 0%, #8A5AFE 100%)',
      borderRadius: '16px',
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

    {/* Inner white content container */}
    <Box
      sx={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '32px',
        minHeight: 'calc(100% - 48px)',
        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
        opacity: isLoadingPCR ? 0.5 : 1,
        pointerEvents: isLoadingPCR ? 'none' : 'auto',
      }}
    >
    {/* Header with Back Button */}
    <Box className="hide-in-pdf" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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


    {/* Report Header */}
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
      
      {isEditMode ? (
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
            <EditIcon sx={{ fontSize: '18px', color: '#3A3A3C' }} />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editableContent.campaignDescription}
            onChange={(e) => setEditableContent({ ...editableContent, campaignDescription: e.target.value })}
            placeholder="type here"
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'Inter Display',
                fontSize: '20px',
                lineHeight: '24px',
                color: '#231F20',
                bgcolor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px',
                paddingTop: '40px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #E5E7EB',
              },
            }}
          />
        </Box>
      ) : (
      <Typography 
        variant="body1" 
        sx={{ 
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '20px',
          lineHeight: '24px',
          letterSpacing: '0%',
          color: '#231F20',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          whiteSpace: 'pre-line'
        }}
      >
          {editableContent.campaignDescription || (
            <Box component="span" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
              Click &quot;Edit Report&quot; to add a campaign description
            </Box>
          )}
      </Typography>
      )}
    </Box>

    {/* Metrics Cards */}
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={6} md={3}>
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
      <Grid item xs={6} md={3}>
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
      <Grid item xs={6} md={3}>
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
      <Grid item xs={6} md={3}>
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
    </Grid>

    {/* Engagement & Interactions Section */}
    <Box sx={{ mb: 4 }}>
      <Typography 
        variant="h3" 
        sx={{ 
          fontFamily: 'Instrument Serif, serif',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '56px',
          lineHeight: '60px',
          letterSpacing: '0%',
          color: '#231F20',
          mb: 1
        }}
      >
        Engagement & Interactions
      </Typography>
      
      {isEditMode ? (
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
            <EditIcon sx={{ fontSize: '18px', color: '#3A3A3C' }} />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editableContent.engagementDescription}
            onChange={(e) => setEditableContent({ ...editableContent, engagementDescription: e.target.value })}
            placeholder="type here"
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'Inter Display',
                fontSize: '20px',
                lineHeight: '24px',
                color: '#231F20',
                bgcolor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px',
                paddingTop: '40px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #E5E7EB',
              },
            }}
          />
        </Box>
      ) : (
      <Typography 
        variant="body1" 
        sx={{ 
          fontFamily: 'Inter Display, sans-serif',
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
          '& strong': {
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 700,
            fontStyle: 'normal',
            fontSize: '20px',
            lineHeight: '24px',
            letterSpacing: '0%',
            color: '#231F20'
          }
        }}
      >
          {editableContent.engagementDescription || (
            <Box component="span" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
              Click &quot;Edit Report&quot; to add engagement insights
            </Box>
          )}
      </Typography>
      )}

      {/* Analytics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Top Engagement */}
        <Grid item xs={12} md={4}>
          <TopEngagementCard />
        </Grid>

        {/* Engagement Rate Heatmap */}
        <Grid item xs={12} md={4}>
          <EngagementRateHeatmap />
        </Grid>

        {/* Platform Interactions */}
        <Grid item xs={12} md={4}>
          <PlatformInteractionsChart />
        </Grid>
      </Grid>
    </Box>

    {/* Noteworthy Creators Section */}
    <Box sx={{ mb: 4 }}>
      {isEditMode ? (
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
            <EditIcon sx={{ fontSize: '18px', color: '#3A3A3C' }} />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={editableContent.noteworthyCreatorsDescription}
            onChange={(e) => setEditableContent({ ...editableContent, noteworthyCreatorsDescription: e.target.value })}
            placeholder="type here"
              sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'Inter Display',
                fontSize: '20px',
                lineHeight: '24px',
                color: '#231F20',
                bgcolor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px',
                paddingTop: '40px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #E5E7EB',
              },
            }}
          />
        </Box>
      ) : (
        <Typography 
          variant="h6" 
          sx={{ 
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 400,
            fontSize: '20px',
            lineHeight: '24px',
            color: '#231F20',
            mb: 3,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          {editableContent.noteworthyCreatorsDescription || (
            <Box component="span" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
              Click &quot;Edit Report&quot; to add noteworthy creators description
            </Box>
          )}
        </Typography>
      )}
      
      <Grid container spacing={2}>
        {/* Most Views Card */}
        {mostViewsCreator && (
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                  padding: '16px',
                  bgcolor: '#FFFFFF', 
                  borderRadius: '8px', 
                  border: '1px solid #EBEBEB',
                  boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                  position: 'relative',
                  mt: 2
              }}>
                  {/* Most Views Badge */}
                  <Box sx={{
                    position: 'absolute',
                    top: '-10px',
                    right: '24px',
                    bgcolor: '#DBFAE6',
                    borderRadius: '4px',
                    px: 2,
                    py: 0.5,
                    fontFamily: 'Aileron',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#1ABF66'
                  }}>
                    Most Views
                  </Box>
                
                {/* Creator Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: '#E4405F' }}>
                    {mostViewsCreatorData?.user?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ 
                      fontFamily: 'Aileron', 
                      fontWeight: 600, 
                      fontSize: '14px',
                      color: '#231F20' 
                    }}>
                      {mostViewsCreatorData?.user?.name || 'Unknown'}
      </Typography>
                    <Typography sx={{ 
                      fontFamily: 'Aileron', 
                      fontSize: '12px',
                      color: '#636366' 
                    }}>
                      {mostViewsCreatorData?.user?.creator?.instagram || mostViewsCreatorData?.user?.creator?.tiktok || ''}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Metrics */}
                <Grid container spacing={1.5}>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {mostViewsCreator ? calculateEngagementRate(mostViewsCreator.insightData.insight) : 0}%
            </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Engagement Rate
                      </Typography>
          </Box>
        </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(mostViewsCreator.views)}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Views
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(getMetricValue(mostViewsCreator.insightData.insight, 'likes'))}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Likes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(getMetricValue(mostViewsCreator.insightData.insight, 'comments'))}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Comments
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
        )}
        
        {/* Most Comments Card */}
        {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
        {(() => {
          const views = mostCommentsCreator ? getMetricValue(mostCommentsCreator.insightData.insight, 'views') : 0;
          const likes = mostCommentsCreator ? getMetricValue(mostCommentsCreator.insightData.insight, 'likes') : 0;
          const maxComments = mostCommentsCreator ? mostCommentsCreator.comments : 0;
          const engagementRate = mostCommentsCreator ? calculateEngagementRate(mostCommentsCreator.insightData.insight) : 0;
          
          return mostCommentsCreator && (
        <Grid item xs={12} md={4}>
              <Box sx={{ 
                  padding: '16px',
                  bgcolor: '#FFFFFF', 
                borderRadius: '8px',
                  border: '1px solid #EBEBEB',
                  boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                  position: 'relative',
                  mt: 2
              }}>
                  {/* Most Comments Badge */}
                  <Box sx={{
                    position: 'absolute',
                    top: '-10px',
                    right: '24px',
                    bgcolor: '#DBFAE6',
                    borderRadius: '4px',
                    px: 2,
                    py: 0.5,
                    fontFamily: 'Aileron',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#1ABF66'
                  }}>
                    Most Comments
                  </Box>
                
                {/* Creator Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: '#E4405F' }}>
                    {mostCommentsCreatorData?.user?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ 
                      fontFamily: 'Aileron', 
                      fontWeight: 600, 
                      fontSize: '14px',
                      color: '#231F20' 
                    }}>
                      {mostCommentsCreatorData?.user?.name || 'Unknown'}
                    </Typography>
                    <Typography sx={{ 
                      fontFamily: 'Aileron', 
                      fontSize: '12px',
                      color: '#636366' 
                    }}>
                      {mostCommentsCreatorData?.user?.creator?.instagram || mostCommentsCreatorData?.user?.creator?.tiktok || ''}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Metrics */}
                <Grid container spacing={1.5}>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {engagementRate}%
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Engagement Rate
            </Typography>
          </Box>
        </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(views)}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Views
                      </Typography>
                    </Box>
      </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(likes)}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Likes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(maxComments)}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Comments
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          );
        })()}
        
        {/* Most Likes Card */}
        {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
        {(() => {
          const views = mostLikesCreator ? getMetricValue(mostLikesCreator.insightData.insight, 'views') : 0;
          const comments = mostLikesCreator ? getMetricValue(mostLikesCreator.insightData.insight, 'comments') : 0;
          const maxLikes = mostLikesCreator ? mostLikesCreator.likes : 0;
          const engagementRate = mostLikesCreator ? calculateEngagementRate(mostLikesCreator.insightData.insight) : 0;
          
          return mostLikesCreator && (
        <Grid item xs={12} md={4}>
              <Box sx={{ 
                  padding: '16px',
                  bgcolor: '#FFFFFF', 
                  borderRadius: '8px', 
                  border: '1px solid #EBEBEB',
                  boxShadow: '0px -3px 0px 0px #EBEBEB inset',
                  position: 'relative',
                  mt: 2
              }}>
                {/* Most Likes Badge */}
                <Box sx={{
                  position: 'absolute',
                  top: '-10px',
                  right: '24px',
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
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 1 }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: '#E4405F' }}>
                    {mostLikesCreatorData?.user?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ 
                      fontFamily: 'Aileron', 
                      fontWeight: 600, 
                      fontSize: '14px',
                      color: '#231F20' 
                    }}>
                      {mostLikesCreatorData?.user?.name || 'Unknown'}
                    </Typography>
                    <Typography sx={{ 
                      fontFamily: 'Aileron', 
                      fontSize: '12px',
                      color: '#636366' 
                    }}>
                      {mostLikesCreatorData?.user?.creator?.instagram || mostLikesCreatorData?.user?.creator?.tiktok || ''}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Metrics */}
                <Grid container spacing={1.5}>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {engagementRate}%
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Engagement Rate
            </Typography>
          </Box>
        </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(views)}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Views
                      </Typography>
                    </Box>
      </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(maxLikes)}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Likes
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box>
                      <Typography sx={{
                        fontFamily: 'Instrument Serif',
                        fontWeight: 400,
                        fontSize: '26px',
                        lineHeight: '31.9px',
                        textAlign: 'center',
                        color: '#1340FF'
                      }}>
                        {formatNumber(comments)}
                      </Typography>
                      <Typography sx={{
                        fontFamily: 'Aileron',
                        fontWeight: 600,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        color: '#636366'
                      }}>
                        Comments
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          );
        })()}
      </Grid>
    </Box>

    {/* Views Section */}
    <Box sx={{ mb: 2 }}>
      <Typography 
        sx={{ 
          fontFamily: 'Instrument Serif',
          fontWeight: 400,
          fontSize: '40px',
          lineHeight: '44px',
          letterSpacing: '0%',
          color: '#231F20',
          mb: 2 
        }}
      >
        Views
      </Typography>
      
      {isEditMode ? (
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
            <EditIcon sx={{ fontSize: '18px', color: '#3A3A3C' }} />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={5}
            value={editableContent.viewsDescription}
            onChange={(e) => setEditableContent({ ...editableContent, viewsDescription: e.target.value })}
            placeholder="type here"
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'Aileron',
                fontSize: '16px',
                lineHeight: '24px',
                color: '#374151',
                bgcolor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px',
                paddingTop: '40px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #E5E7EB',
              },
            }}
          />
        </Box>
      ) : (
        <Typography 
          sx={{ 
            fontFamily: 'Aileron',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#374151',
            mb: 3,
            whiteSpace: 'pre-line',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          {editableContent.viewsDescription || (
            <Box component="span" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
              Click &quot;Edit Report&quot; to add views analysis
            </Box>
          )}
        </Typography>
      )}
      
      <Box sx={{ mb: 1 }}>
        <Typography 
          sx={{ 
            fontFamily: 'Aileron',
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: '22px',
            letterSpacing: '0%',
            color: '#231F20',
            mb: 3 
          }}
        >
          Highest View Week
        </Typography>
        <HighestViewWeekChart />
      </Box>
    </Box>

    {/* Audience Sentiment */}
    <Box sx={{ mb: 6, mt: 0 }}>
      <Typography 
        sx={{ 
          fontFamily: 'Instrument Serif',
          fontWeight: 400,
          fontSize: '40px',
          lineHeight: '44px',
          letterSpacing: '0%',
          color: '#231F20',
          mb: 2 
        }}
      >
        Audience Sentiment
      </Typography>
      
      {isEditMode ? (
        <Box sx={{ position: 'relative', mb: 4 }}>
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
            <EditIcon sx={{ fontSize: '18px', color: '#3A3A3C' }} />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editableContent.audienceSentimentDescription}
            onChange={(e) => setEditableContent({ ...editableContent, audienceSentimentDescription: e.target.value })}
            placeholder="type here"
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'Aileron',
                fontSize: '16px',
                lineHeight: '24px',
                color: '#374151',
                bgcolor: '#F3F4F6',
                borderRadius: '8px',
                padding: '12px',
                paddingTop: '40px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #E5E7EB',
              },
            }}
          />
        </Box>
      ) : (
        <Typography 
          sx={{ 
            fontFamily: 'Aileron',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#374151',
            mb: 4,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          {editableContent.audienceSentimentDescription || (
            <Box component="span" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
              Click &quot;Edit Report&quot; to add audience sentiment analysis
            </Box>
          )}
        </Typography>
      )}
      
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
          {isEditMode && (
            <EditIcon sx={{ fontSize: '16px', color: '#10B981' }} />
          )}
      </Box>
          {isEditMode ? (
            <>
              <Grid container spacing={2}>
                {editableContent.positiveComments.map((comment, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Box sx={{ p: 2, bgcolor: '#F3F4F6', borderRadius: '8px', position: 'relative' }}>
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
              ) : (
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                  Click &quot;Edit Report&quot; to add positive comments
                </Typography>
              )}
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
          {isEditMode && (
            <EditIcon sx={{ fontSize: '16px', color: '#F59E0B' }} />
          )}
      </Box>
          {isEditMode ? (
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
              ) : (
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', py: 3 }}>
                  Click &quot;Edit Report&quot; to add neutral comments
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>

    {/* Best Performing Creator Personas */}
    <Box sx={{ mb: 6 }}>
      <Typography 
        sx={{ 
          fontFamily: 'Instrument Serif',
          fontWeight: 400,
          fontSize: '40px',
          lineHeight: '44px',
          color: '#231F20',
          mb: 2,
        }}
      >
        Best Performing Creator Personas
      </Typography>
      {isEditMode ? (
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
            <EditIcon sx={{ fontSize: '18px', color: '#3A3A3C' }} />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editableContent.bestPerformingPersonasDescription}
            onChange={(e) => setEditableContent({ ...editableContent, bestPerformingPersonasDescription: e.target.value })}
            sx={{
              bgcolor: '#F3F4F6',
              borderRadius: '8px',
              '& .MuiInputBase-root': {
                fontFamily: 'Inter Display',
                fontSize: '20px',
                lineHeight: '24px',
                color: '#231F20',
                padding: '12px',
                paddingTop: '40px',
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
            fontFamily: 'Aileron',
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#374151',
            mb: 4,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}
        >
          {editableContent.bestPerformingPersonasDescription || (
            <Box component="span" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
              Click &quot;Edit Report&quot; to add creator personas description
            </Box>
          )}
        </Typography>
      )}
      {/* Creator Persona Cards */}
      {isEditMode ? (
        // Edit Mode: Show + button horizontally with card 1 if there's only 1 card
      <Box sx={{ display: 'flex', gap: 17, justifyContent: 'flex-start', alignItems: 'center' }}>
        {/* The Comic Card with Number */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 7 }}>
          {/* Number - Outside the card */}
          <Typography
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontStyle: 'normal',
              fontSize: '40px',
              lineHeight: '44px',
              letterSpacing: '0%',
              color: '#1340FF',
              position: 'relative',
              left: '-55px',
            }}
          >
            1.
          </Typography>
          
          {/* Card */}
          <Box
            sx={{
              width: '347px',
              height: isEditMode ? '380px' : '189px',
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
                <EditIcon sx={{ fontSize: '14px', color: '#3A3A3C' }} />
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
              maxWidth: 'calc(347px - 82px)', // Card width minus circle space
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
                  <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
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
                      textAlign: 'center',
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
                    textAlign: 'center',
                      padding: '8px',
                      paddingTop: '26px',
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
            
            <Box sx={{ mb: 0.75, textAlign: 'left' }}>
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 700,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '18px',
                  letterSpacing: '0%',
                  color: '#000000',
                  mb: 0.5,
                }}
              >
                Content Style
              </Typography>
              {isEditMode ? (
                <Box sx={{ position: 'relative' }}>
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
                    <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
                  </Box>
                <TextField
                  value={editableContent.comicContentStyle}
                  onChange={(e) => setEditableContent({ ...editableContent, comicContentStyle: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                  inputProps={{
                    maxLength: 50,
                  }}
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
              ) : (
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {editableContent.comicContentStyle}
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: 'left' }}>
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 700,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '18px',
                  letterSpacing: '0%',
                  color: '#000000',
                  mb: 0.5,
                }}
              >
                Why They Work
              </Typography>
              {isEditMode ? (
                <Box sx={{ position: 'relative' }}>
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
                    <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
                  </Box>
                <TextField
                  value={editableContent.comicWhyWork}
                  onChange={(e) => setEditableContent({ ...editableContent, comicWhyWork: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                  inputProps={{
                    maxLength: 50,
                  }}
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
              ) : (
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {editableContent.comicWhyWork}
                </Typography>
              )}
            </Box>
          </Box>
          </Box>
        </Box>

        {/* Show + button if educator card is hidden, otherwise show educator card */}
        {!showEducatorCard ? (
          // Add Persona Button
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 10 }}>
            <IconButton
              onClick={() => setShowEducatorCard(true)}
              sx={{
                width: '140px',
                height: '140px',
                bgcolor: '#F5F5F5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 3,
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
        ) : (
          // The Educator Card with Number
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
          {/* Delete Button - Top right of the entire card container */}
          <IconButton
            onClick={() => setShowEducatorCard(false)}
            sx={{
              position: 'absolute',
              top: -10,
              right: -10,
              zIndex: 10,
              bgcolor: '#EF4444',
              color: 'white',
              width: '32px',
              height: '32px',
              '&:hover': {
                bgcolor: '#DC2626',
              },
            }}
          >
            <DeleteIcon sx={{ fontSize: '20px' }} />
          </IconButton>

          {/* Number - Outside the card */}
          <Typography
            sx={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontStyle: 'normal',
              fontSize: '40px',
              lineHeight: '44px',
              letterSpacing: '0%',
              color: '#1340FF',
              position: 'relative',
              left: '-55px',
            }}
          >
            2.
          </Typography>
          
          {/* Card */}
          <Box
            sx={{
              width: '347px',
              height: isEditMode ? '380px' : '189px',
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
                <EditIcon sx={{ fontSize: '14px', color: '#3A3A3C' }} />
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
                background: 'linear-gradient(135deg, #1340FF 0%, #3B82F6 100%)',
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
              maxWidth: 'calc(347px - 82px)', // Card width minus circle space
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
                  <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
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
                      textAlign: 'center',
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
                    textAlign: 'center',
                      padding: '8px',
                      paddingTop: '26px',
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
            
            <Box sx={{ mb: 0.75, textAlign: 'left' }}>
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 700,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '18px',
                  letterSpacing: '0%',
                  color: '#000000',
                  mb: 0.5,
                }}
              >
                Content Style
              </Typography>
              {isEditMode ? (
                <Box sx={{ position: 'relative' }}>
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
                    <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
                  </Box>
                <TextField
                  value={editableContent.educatorContentStyle}
                  onChange={(e) => setEditableContent({ ...editableContent, educatorContentStyle: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                  inputProps={{
                    maxLength: 50,
                  }}
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
              ) : (
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {editableContent.educatorContentStyle}
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: 'left' }}>
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 700,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '18px',
                  letterSpacing: '0%',
                  color: '#000000',
                  mb: 0.5,
                }}
              >
                Why They Work
              </Typography>
              {isEditMode ? (
                <Box sx={{ position: 'relative' }}>
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
                    <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
                  </Box>
                <TextField
                  value={editableContent.educatorWhyWork}
                  onChange={(e) => setEditableContent({ ...editableContent, educatorWhyWork: e.target.value })}
                  fullWidth
                    multiline
                    rows={2}
                  inputProps={{
                    maxLength: 50,
                  }}
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
              ) : (
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {editableContent.educatorWhyWork}
                </Typography>
              )}
            </Box>
          </Box>
          </Box>
        </Box>
        )}
        </Box>
      ) : (
        // Non-edit Mode: Conditional layout based on number of personas
        <Box sx={{ display: 'flex', gap: 17, justifyContent: 'flex-start', alignItems: showEducatorCard ? 'center' : 'flex-start' }}>
          {/* The Comic Card with Number */}
          <Box sx={{ display: 'flex', alignItems: showEducatorCard ? 'center' : 'flex-start', gap: showEducatorCard ? 2 : 3, ml: showEducatorCard ? 7 : 0 }}>
            {/* Number - Outside the card */}
            <Typography
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '40px',
                lineHeight: '44px',
                letterSpacing: '0%',
                color: '#1340FF',
                ...(showEducatorCard ? {
                  position: 'relative',
                  left: '-55px',
                } : {
                  mt: 12,
                }),
              }}
            >
              1.
            </Typography>
            
            {showEducatorCard ? (
              // Compact horizontal layout when there are 2 personas
              <Box
                sx={{
                  width: '347px',
                  height: '189px',
                  borderRadius: '20px',
                  background: '#F5F5F5',
                  border: '10px solid #FFFFFF',
                  boxShadow: '0px 4px 4px 0px #8E8E9340',
                  position: 'relative',
                }}
              >
                {/* Circle with Icon */}
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
                  <Box
                    sx={{
                      width: '95px',
                      height: '95px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8A5AFE 0%, #A855F7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                    }}
                  >
                    {editableContent.comicEmoji}
      </Box>
    </Box>

                {/* Content */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    right: '12px',
                    left: '70px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    maxWidth: 'calc(347px - 82px)',
                  }}
                >
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
                  
                  <Box sx={{ mb: 0.75, textAlign: 'left' }}>
                    <Typography
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '18px',
                        letterSpacing: '0%',
                        color: '#000000',
                        mb: 0.5,
                      }}
                    >
                      Content Style
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '18px',
                        letterSpacing: '0%',
                        color: '#000000',
                      }}
                    >
                      {editableContent.comicContentStyle}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: 'left' }}>
                    <Typography
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '18px',
                        letterSpacing: '0%',
                        color: '#000000',
                        mb: 0.5,
                      }}
                    >
                      Why They Work
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'Inter Display, sans-serif',
                        fontWeight: 400,
                        fontStyle: 'normal',
                        fontSize: '14px',
                        lineHeight: '18px',
                        letterSpacing: '0%',
                        color: '#000000',
                      }}
                    >
                      {editableContent.comicWhyWork}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ) : (
              // Large vertical layout when there's only 1 persona
              <>
                {/* Emoji Circle */}
      <Box
        sx={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '10px solid #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '-4px 4px 4px 0px #8E8E9340',
                    flexShrink: 0,
                    mt: 3,
                  }}
                >
                  {/* Inner gradient circle */}
                  <Box
                    sx={{
                      width: '130px',
                      height: '130px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8A5AFE 0%, #A855F7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                    }}
                  >
                    {editableContent.comicEmoji}
                  </Box>
                </Box>

            {/* Content Box */}
            <Box sx={{ flex: 1, maxWidth: '950px', display: 'flex', gap: 3 }}>
              {/* Title Box */}
              <Box
                sx={{
                  bgcolor: '#F5F5F5',
                  borderRadius: '20px',
                  border: '10px solid #FFFFFF',
                  boxShadow: '0px 4px 4px 0px #8E8E9340',
                  p: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '320px',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Instrument Serif, serif',
                    fontWeight: 400,
                    fontSize: '40px',
                    lineHeight: '44px',
                    color: '#0067D5',
                    textAlign: 'center',
                  }}
                >
                  {editableContent.comicTitle}
      </Typography>
              </Box>
              
              {/* Content Style and Why They Work Box */}
      <Box
        sx={{
                  bgcolor: '#F5F5F5',
                  borderRadius: '20px',
                  border: '10px solid #FFFFFF',
                  boxShadow: '0px 4px 4px 0px #8E8E9340',
                  p: 4,
                  flex: 1,
                  minWidth: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 3,
                }}
              >
                {/* Content Style */}
                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#000000',
                      mb: 1,
                    }}
                  >
                    Content Style
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '24px',
                      color: '#000000',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {editableContent.comicContentStyle}
                  </Typography>
                </Box>

                {/* Why They Work */}
                <Box>
                  <Typography
                    sx={{
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#000000',
                      mb: 1,
                    }}
                  >
                    Why They Work
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'Inter Display, sans-serif',
                      fontWeight: 400,
                      fontSize: '16px',
                      lineHeight: '24px',
                      color: '#000000',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {editableContent.comicWhyWork}
                  </Typography>
                </Box>
              </Box>
            </Box>
              </>
            )}
          </Box>

          {/* The Educator Card with Number - Only show if showEducatorCard is true */}
          {showEducatorCard && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Number - Outside the card */}
              <Typography
                sx={{
                  fontFamily: 'Instrument Serif, serif',
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '40px',
                  lineHeight: '44px',
                  letterSpacing: '0%',
                  color: '#1340FF',
                  position: 'relative',
                  left: '-55px',
                }}
              >
              2.
            </Typography>
            
            {/* Card */}
      <Box
        sx={{
                width: '347px',
                height: '189px',
                borderRadius: '20px',
                background: '#F5F5F5',
                border: '10px solid #FFFFFF',
                boxShadow: '0px 4px 4px 0px #8E8E9340',
                position: 'relative',
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
              {/* Inner gradient circle */}
              <Box
                sx={{
                  width: '95px',
                  height: '95px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8A5AFE 0%, #A855F7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
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
                left: '70px',
                top: '50%',
                transform: 'translateY(-50%)',
                maxWidth: 'calc(347px - 82px)',
              }}
            >
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
              
              <Box sx={{ mb: 0.75, textAlign: 'left' }}>
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    mb: 0.5,
                  }}
                >
                  Content Style
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {editableContent.educatorContentStyle}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 700,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    mb: 0.5,
                  }}
                >
                  Why They Work
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Inter Display, sans-serif',
                    fontWeight: 400,
                    fontStyle: 'normal',
                    fontSize: '14px',
                    lineHeight: '18px',
                    letterSpacing: '0%',
                    color: '#000000',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {editableContent.educatorWhyWork}
                </Typography>
              </Box>
            </Box>
            </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>

    {/* Three Column Insights Section */}
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
              <Box sx={{ 
                bgcolor: '#1340FFD9', 
                p: 3, 
                color: 'white', 
                height: '120px', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0 0 12px 12px',
              }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontStyle: 'italic', opacity: 0.8 }}>
                  Click &quot;Edit Report&quot; to add improvement suggestions
                </Typography>
              </Box>
            )}
            {editableContent.improvedInsights.map((insight, index) => (
      <Box
                key={index}
        sx={{
                  bgcolor: getImprovedInsightBgColor(index),
                  p: 1, 
                  color: 'white', 
                  height: '120px', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: index === editableContent.improvedInsights.length - 1 ? '0 0 12px 12px' : 0,
                  position: 'relative',
                }}
              >
                {isEditMode ? (
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
                        <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
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
                          maxLength: 120,
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
              <Box sx={{ 
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
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontStyle: 'italic', opacity: 0.9 }}>
                  Click &quot;Edit Report&quot; to add what worked well
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
                {isEditMode ? (
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
                        <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
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
                          maxLength: 120,
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
              <Box sx={{ 
                bgcolor: '#026D54D9',
                p: 3, 
                color: 'white', 
                height: '120px', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0 0 12px 12px',
              }}>
                <Typography sx={{ fontFamily: 'Aileron', fontSize: '14px', fontStyle: 'italic', opacity: 0.9 }}>
                  Click &quot;Edit Report&quot; to add next steps
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
                {isEditMode ? (
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
                        <EditIcon sx={{ fontSize: '12px', color: '#3A3A3C' }} />
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
                          maxLength: 120,
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
          }
          setEmojiPickerAnchor(null);
          setEmojiPickerType(null);
        }}
      />
    </Popover>

    {/* Success Snackbar */}
    <Snackbar
      open={showSuccessMessage}
      autoHideDuration={4000}
      onClose={() => setShowSuccessMessage(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: '#10B981',
          color: 'white',
          px: 3,
          py: 2,
          borderRadius: '12px',
          boxShadow: '0px 8px 24px rgba(16, 185, 129, 0.3)',
          minWidth: '320px',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: '32px' }} />
        <Box>
          <Typography sx={{ fontFamily: 'Inter Display', fontWeight: 600, fontSize: '16px', mb: 0.5 }}>
            Success!
          </Typography>
          <Typography sx={{ fontFamily: 'Aileron', fontWeight: 400, fontSize: '14px' }}>
            PCR saved successfully
          </Typography>
        </Box>
      </Box>
    </Snackbar>
    </Box>
  </Box>
  );
};

PCRReportPage.propTypes = {
  campaign: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    campaignBrief: PropTypes.shape({
      startDate: PropTypes.string,
      endDate: PropTypes.string,
    }),
    submission: PropTypes.array,
  }),
  onBack: PropTypes.func.isRequired,
};

export default PCRReportPage;
