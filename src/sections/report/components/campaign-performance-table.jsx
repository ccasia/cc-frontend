import React, { useState } from 'react';
import {
  Avatar,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useGetAllSubmissions } from 'src/hooks/use-get-submission';
import { useNavigate } from 'react-router';

const CampaignPerformanceTable = () => {
  const navigate = useNavigate();

  const { data: submissionData, isLoading } = useGetAllSubmissions();
  
  const reportList = React.useMemo(() => {
    if (!submissionData) return [];
    
    return submissionData?.submissions
      ?.filter((submission) => {
        if (!submission.content) return false;
        
        // More specific regex patterns for actual post links
        const instagramPostRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+/i;
        const tiktokPostRegex = /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^\/]+\/(?:video|photo)\/\d+/i;
        
        return instagramPostRegex.test(submission.content) || tiktokPostRegex.test(submission.content);
      })
      ?.map((submission) => ({
        id: submission.id,
        creatorName: submission.user?.name || 'N/A',
        creatorEmail: submission.user?.email || 'N/A',
        campaignName: submission.campaign?.name || 'N/A',
        creatorAvatar: submission.user?.photoURL || null,
        content: submission.content,
        submissionId: submission.id,
        campaignId: submission.campaignId,
        userId: submission.user?.id,
      }))
      .sort((a, b) => {
        // First sort by campaign name
        const campaignCompare = a.campaignName.localeCompare(b.campaignName);
        // If campaign names are the same, sort by creator name
        return campaignCompare === 0 ? a.creatorName.localeCompare(b.creatorName) : campaignCompare;
      });

  }, [submissionData]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleViewReport = (row) => {
    // Navigate to reporting view with URL parameters
    const params = new URLSearchParams({
      url: row.content,
      submissionId: row.submissionId,
      campaignId: row.campaignId,
      userId: row.userId,
      creatorName: row.creatorName,
      campaignName: row.campaignName
    });
    
    navigate(`/dashboard/report/view?${params.toString()}`);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontFamily: 'Aileron',
          fontSize: { xs: 18, md: 24 },
          fontWeight: 600,
          mb: 2,
          color: '#333',
        }}
      >
        Your Campaigns
      </Typography>

      {/* Scrollable Container */}
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          // Hide scrollbar on WebKit browsers but keep functionality
          '&::-webkit-scrollbar': {
            height: 3,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: 3,
            '&:hover': {
              backgroundColor: '#a8a8a8',
            },
          },
        }}
      >
        {/* Table Container with minimum width */}
        <Box sx={{ minWidth: { xs: 1000, md: '100%' } }}>
          {/* Custom Table Header */}
          <Box
            sx={{
              width: '100%',
              height: 32,
              backgroundColor: '#F5F5F5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              px: 3,
              mb: 0,
            }}
          >
            <Box sx={{ flex: '0 0 20%' }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#666',
                }}
              >
                Creator
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 30%' }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#666',
                }}
              >
                Creator's Email
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 30%' }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#666',
                }}
              >
                Campaign Name
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 20%', textAlign: 'right' }}>
              {/* Empty space for action column */}
            </Box>
          </Box>

          {/* Table Body */}
          <Box sx={{ width: '100%' }}>
            {reportList.map((row, index) => (
              <Box
                key={row.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 3,
                  py: 2.5,
                  borderBottom: '1px solid #f0f0f0',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                }}
              >
                <Box sx={{ 
                  flex: '0 0 20%', 
                  minWidth: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2 
                }}>
                  <Avatar
                    src={row.creatorAvatar}
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: '#e0e0e0',
                      color: '#666',
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {row.creatorName.charAt(0)}
                  </Avatar>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: 14,
                      color: '#333',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.creatorName}
                  </Typography>
                </Box>
                <Box sx={{ flex: '0 0 30%', pr: 2 }}>
                  <Typography
                    sx={{
                      fontWeight: 400,
                      fontSize: 14,
                      color: '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.creatorEmail}
                  </Typography>
                </Box>
                <Box sx={{ flex: '0 0 30%', pr: 2 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: '#333',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.campaignName}
                  </Typography>
                </Box>
                <Box sx={{ flex: '0 0 20%', textAlign: 'right' }}>
                  <Button
                    variant="text"
                    onClick={() => handleViewReport(row)}
                    sx={{
                      width: 192,
                      height: 38,
                      padding: '8px 12px 11px 12px',
                      gap: '4px',
                      borderRadius: '8px',
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                      backgroundColor: '#FFFFFF',
                      color: '#1340FF',
                      fontSize: 14,
                      fontWeight: 600,
                      flexShrink: 0,
                      '&:hover': {
                        backgroundColor: '#F8F9FA',
                        border: '1px solid #E7E7E7',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                      },
                      '&:active': {
                        boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                        transform: 'translateY(1px)',
                      }
                    }}
                  >
                    View Performance Report
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Empty state - show when no data */}
          {reportList.length === 0 && (
            <Box
              sx={{
                p: 6,
                textAlign: 'center',
                mt: 2,
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Typography
                sx={{
                  fontSize: 16,
                  color: '#666',
                  mb: 1,
                }}
              >
                No campaigns found
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: '#999',
                }}
              >
                Campaigns with completed submissions will appear here
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CampaignPerformanceTable;