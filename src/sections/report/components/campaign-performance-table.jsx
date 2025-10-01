import { useNavigate } from 'react-router';
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material';
import {
  Box,
  Avatar,
  Button,
  Select,
  MenuItem,
  Typography,
  FormControl,
  CircularProgress,
} from '@mui/material';

import { useGetAllSubmissions } from 'src/hooks/use-get-submission';
import { useAuthContext } from 'src/auth/hooks';
import useGetClientCredits from 'src/hooks/use-get-client-credits';

const CampaignPerformanceTable = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [selectedCampaign, setSelectedCampaign] = useState(() => searchParams.get('campaign') || 'all');

  const itemsPerPage = 7;

  const { user } = useAuthContext();
  const { company } = useGetClientCredits();
  const { data: submissionData, isLoadingSubmissions } = useGetAllSubmissions();

  const reportList = React.useMemo(() => {
    if (!submissionData) return [];

    return submissionData?.submissions
      ?.filter((submission) => {
        if (!submission.content) return false;

        // More specific regex patterns for actual post links
        const instagramPostRegex =
          /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+/i;
        const tiktokPostRegex =
          /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[^/]+\/(?:video|photo)\/\d+/i;

        const hasValidContent = instagramPostRegex.test(submission.content) || tiktokPostRegex.test(submission.content);
        
        if (!hasValidContent) return false;

        // Filter by company/client association
        if (user?.role === 'client') {
          const campaignCompanyId = submission.campaign?.company.id;
          
          const userCompanyId = user.client?.companyId || company?.id;
          const submissionByCompanyId = campaignCompanyId === userCompanyId;
          
          return submissionByCompanyId;
        }

        // For non-client users (admin, etc.), show all submissions
        return true;
      })
      .map((submission) => ({
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
        const campaignCompare = a.campaignName.localeCompare(b.campaignName);
        return campaignCompare === 0 ? a.creatorName.localeCompare(b.creatorName) : campaignCompare;
      });
  }, [submissionData, user, company]);

  // Get unique campaigns for filter dropdown
  const uniqueCampaigns = useMemo(() => {
    const campaigns = [...new Set(reportList.map((item) => item.campaignName))];
    return campaigns.filter((name) => name !== 'N/A').sort();
  }, [reportList]);

  // Filter reports based on selected campaign
  const filteredReports = useMemo(() => {
    if (selectedCampaign === 'all') return reportList;
    return reportList.filter((report) => report.campaignName === selectedCampaign);
  }, [reportList, selectedCampaign]);

  const updateUrlParams = (page, campaign) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (campaign !== 'all') params.set('campaign', campaign);
    
    // Update URL without causing a page refresh
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/dashboard/report${newUrl}`);
  };

  if (isLoadingSubmissions) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleViewReport = (row) => {
    // Include current pagination state in the navigation
    const params = new URLSearchParams({
      url: row.content,
      submissionId: row.submissionId,
      campaignId: row.campaignId,
      userId: row.userId,
      creatorName: row.creatorName,
      campaignName: row.campaignName,
      // Add return state for back navigation
      returnPage: currentPage.toString(),
      returnCampaign: selectedCampaign
    });

    navigate(`/dashboard/report/view?${params.toString()}`);
  };

  const handleNextPage = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    updateUrlParams(newPage, selectedCampaign);
  };

  const handlePrevPage = () => {
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    updateUrlParams(newPage, selectedCampaign);
  };

  // Add this new function:
  const handlePageClick = (page) => {
    setCurrentPage(page);
    updateUrlParams(page, selectedCampaign);
  };

  // Replace handleCampaignFilterChange:
  const handleCampaignFilterChange = (event) => {
    const newCampaign = event.target.value;
    setSelectedCampaign(newCampaign);
    setCurrentPage(1); // Reset to first page when filter changes
    updateUrlParams(1, newCampaign);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedReports = filteredReports.slice(startIndex, endIndex);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <Box sx={{ mt: 4 }}>
      {/* Header with title */}
      <Typography
        variant="h5"
        sx={{
          fontFamily: 'Aileron',
          fontSize: { xs: 18, md: 24 },
          fontWeight: 600,
          color: '#333',
          mb: 2,
        }}
      >
        Your Campaigns
      </Typography>

      {/* Campaign Filter Dropdown - Left aligned above table */}
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ width: 400 }}>
          <Select
            value={selectedCampaign}
            onChange={handleCampaignFilterChange}
            displayEmpty
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              height: 48,
              fontSize: '16px',
              fontWeight: 400,
              color: '#000000',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E7E7E7',
                borderRadius: '8px',
                borderWidth: '1px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E7E7E7',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E7E7E7',
              },
              '& .MuiSelect-select': {
                paddingTop: '12px',
                paddingRight: '12px',
                paddingBottom: '12px',
                paddingLeft: '14px',
                display: 'flex',
                alignItems: 'center',
              },
              '& .MuiSelect-icon': {
                color: '#231F20',
                height: 20,
                width: 20,
              },
            }}
          >
            <MenuItem value="all" sx={{ fontSize: '14px', fontWeight: 400 }}>
              All Campaigns
            </MenuItem>
            {uniqueCampaigns.map((campaign) => (
              <MenuItem key={campaign} value={campaign} sx={{ fontSize: '14px', fontWeight: 400 }}>
                {campaign}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
            <Box sx={{ flex: '0 0 25%' }}>
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
                Creator&apos;s Email
              </Typography>
            </Box>
            <Box sx={{ flex: '0 0 25%' }}>
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
            <Box sx={{ flex: '0 0 15%', textAlign: 'right' }}>
              {/* Empty space for action column */}
            </Box>
          </Box>

          {/* Table Body */}
          <Box sx={{ width: '100%' }}>
            {displayedReports.map((row, index) => (
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
                <Box
                  sx={{
                    flex: '0 0 20%',
                    minWidth: 200,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
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
                      maxWidth: 260,
                      color: '#666',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.creatorEmail}
                  </Typography>
                </Box>
                <Box sx={{ flex: '0 0 25%', pr: 2 }}>
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
                <Box sx={{ flex: '0 0 15%', textAlign: 'right' }}>
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
                      },
                    }}
                  >
                    View Performance Report
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Pagination Controls - Clean minimal design */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                mt: 3,
                pb: 2,
                gap: 0.3,
              }}
            >
              {/* Previous Button */}
              <Button
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                sx={{
                  minWidth: 'auto',
                  p: 0,
                  backgroundColor: 'transparent',
                  color: hasPrevPage ? '#000000' : '#8E8E93',
                  border: 'none',
                  fontSize: 20,
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                  '&:disabled': {
                    backgroundColor: 'transparent',
                    color: '#8E8E93',
                  },
                }}
              >
                <ChevronLeftRounded size={16} />
              </Button>

              {/* Page Numbers */}
              {(() => {
                const pageButtons = [];
                const showEllipsis = totalPages > 3;

                if (!showEllipsis) {
                  // Show all pages if 3 or fewer
                  // eslint-disable-next-line no-plusplus
                  for (let i = 1; i <= totalPages; i++) {
                    pageButtons.push(
                      <Button
                        key={i}
                        onClick={() => handlePageClick(i)}
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          mx: 1,
                          backgroundColor: 'transparent',
                          color: currentPage === i ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: 16,
                          fontWeight: 400,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {i}
                      </Button>
                    );
                  }
                } else {
                  // Show 1, current-1, current, current+1, ..., last
                  pageButtons.push(
                    <Button
                      key={1}
                      onClick={() => handlePageClick(i)}
                      sx={{
                        minWidth: 'auto',
                        p: 0,
                        mx: 1,
                        backgroundColor: 'transparent',
                        color: currentPage === 1 ? '#000000' : '#8E8E93',
                        border: 'none',
                        fontSize: 16,
                        fontWeight: 400,
                        '&:hover': {
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      1
                    </Button>
                  );

                  if (currentPage > 3) {
                    pageButtons.push(
                      <Typography key="ellipsis1" sx={{ mx: 1, color: '#8E8E93', fontSize: 16 }}>
                        ...
                      </Typography>
                    );
                  }

                  // Show current page and adjacent pages
                  for (
                    let i = Math.max(2, currentPage - 1);
                    i <= Math.min(totalPages - 1, currentPage + 1);
                    // eslint-disable-next-line no-plusplus
                    i++
                  ) {
                    pageButtons.push(
                      <Button
                        key={i}
                        onClick={() => handlePageClick(i)}
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          mx: 1,
                          backgroundColor: 'transparent',
                          color: currentPage === i ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: 16,
                          fontWeight: 400,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {i}
                      </Button>
                    );
                  }

                  if (currentPage < totalPages - 2) {
                    pageButtons.push(
                      <Typography key="ellipsis2" sx={{ mx: 1, color: '#8E8E93', fontSize: 16 }}>
                        ...
                      </Typography>
                    );
                  }

                  if (totalPages > 1) {
                    pageButtons.push(
                      <Button
                        key={totalPages}
                        onClick={() => handlePageClick(i)}
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          mx: 1,
                          backgroundColor: 'transparent',
                          color: currentPage === totalPages ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: 16,
                          fontWeight: 400,
                          '&:hover': {
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {totalPages}
                      </Button>
                    );
                  }
                }

                return pageButtons;
              })()}

              {/* Next Button */}
              <Button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                sx={{
                  minWidth: 'auto',
                  p: 0,
                  backgroundColor: 'transparent',
                  color: hasNextPage ? '#000000' : '#8E8E93',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 400,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                  '&:disabled': {
                    backgroundColor: 'transparent',
                    color: '#8E8E93',
                  },
                }}
              >
                <ChevronRightRounded size={16} />
              </Button>
            </Box>
          )}

          {/* Empty state - show when no data */}
          {filteredReports.length === 0 && (
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
                {selectedCampaign === 'all'
                  ? 'No campaigns found'
                  : `No results for "${selectedCampaign}"`}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: '#999',
                }}
              >
                {selectedCampaign === 'all'
                  ? 'Campaigns with completed submissions from creators with connected social accounts will appear here'
                  : 'Try selecting a different campaign or check "All Campaigns"'}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CampaignPerformanceTable;
