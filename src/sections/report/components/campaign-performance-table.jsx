import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Button,
  Typography,
  Box,
} from '@mui/material';

const CampaignPerformanceTable = () => {
  // Sample data - replace with actual data from backend
  const campaignData = [
    {
      id: 1,
      creatorName: 'Shermaine Wong',
      creatorEmail: 'shermaine@cultcreative.asia',
      campaignName: 'GrabUnlimited Deals',
      creatorAvatar: null, // Will show placeholder
    },
    // Add more sample data as needed
    {
      id: 2,
      creatorName: 'John Doe',
      creatorEmail: 'john.doe@cultcreative.asia',
      campaignName: 'Summer Collection 2024',
      creatorAvatar: null,
    },
    {
      id: 3,
      creatorName: 'Sarah Johnson',
      creatorEmail: 'sarah.johnson@cultcreative.asia',
      campaignName: 'Tech Product Launch',
      creatorAvatar: null,
    },
  ];

  const handleViewReport = (campaignId) => {
    // Handle view performance report action
    console.log('View performance report for campaign:', campaignId);
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
          color: '#231F20',
        }}
      >
        Your Campaigns
      </Typography>

      {/* Custom Table Header */}
      <Box
        sx={{
          width: '100%',
          height: 35,
          backgroundColor: '#F5F5F5',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          px: 3,
          mb: 0,
        }}
      >
        <Box sx={{ flex: '0 0 25%' }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 14,
              color: '#231F20',
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
              color: '#231F20',
            }}
          >
            Creator's Email
          </Typography>
        </Box>
        <Box sx={{ flex: '0 0 25%' }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: 14,
              color: '#231F20',
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
        {campaignData.map((row, index) => (
          <Box
            key={row.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 3,
              py: 2.5,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Box sx={{ flex: '0 0 25%', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={row.creatorAvatar}
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#e0e0e0',
                  color: '#666',
                  fontSize: 14,
                }}
              >
                {row.creatorName.charAt(0)}
              </Avatar>
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#333',
                }}
              >
                {row.creatorName}
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 30%' }}>
              <Typography
                sx={{
                  fontSize: 14,
                  color: '#666',
                }}
              >
                {row.creatorEmail}
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 25%' }}>
              <Typography
                sx={{
                  fontSize: 14,
                  color: '#333',
                  fontWeight: 500,
                }}
              >
                {row.campaignName}
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 20%', textAlign: 'right' }}>
              <Button
                variant="text"
                onClick={() => handleViewReport(row.id)}
                sx={{
                  color: '#2196F3',
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.04)',
                  },
                }}
              >
                View Performance Report
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Empty state - show when no data */}
      {campaignData.length === 0 && (
        <Box
          sx={{
            p: 6,
            textAlign: 'center',
            mt: 2,
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            width: '100%',
            maxWidth: 1088,
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
  );
};

export default CampaignPerformanceTable;