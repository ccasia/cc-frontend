import { useNavigate } from 'react-router';
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Clear, Search , ArrowUpward, ArrowDownward, ChevronLeftRounded, ChevronRightRounded } from '@mui/icons-material';
import {
  Box,
  Stack,
  Avatar,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  FormControl,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import useGetClientCredits from 'src/hooks/use-get-client-credits';
import { useGetAllSubmissions } from 'src/hooks/use-get-submission';

import { createSocialProfileUrl } from 'src/utils/media-kit-utils';

import { useAuthContext } from 'src/auth/hooks';

const CampaignPerformanceTable = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [selectedCampaign, setSelectedCampaign] = useState(
    () => searchParams.get('campaign') || 'all'
  );

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('search') || ''
  );

  const [sortBy, setSortBy] = useState('campaignName');
  const [sortDirection, setSortDirection] = useState('asc');

  const itemsPerPage = 7;

  const { user } = useAuthContext();
  const { company } = useGetClientCredits();
  const { data: submissionData, isLoading: isLoadingSubmissions } = useGetAllSubmissions();

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
        const tiktokMobileRegex =
          /(?:https?:\/\/)?(?:vt|vm|m)\.tiktok\.com\/[A-Za-z0-9_-]+/i;

        const isInstagramPost = instagramPostRegex.test(submission.content);
        const isTiktokPost =
          tiktokPostRegex.test(submission.content) || tiktokMobileRegex.test(submission.content);

        if (!isInstagramPost && !isTiktokPost) return false;

        // Only show creators who have connected their media kit for the relevant platform
        if (isInstagramPost && !submission.isInstagramConnected) return false;
        if (isTiktokPost && !isInstagramPost && !submission.isTiktokConnected) return false;

        // Filter by company/client association
        if (user?.role === 'client') {
          const campaignCompanyId = submission.campaign?.company?.id;

          const userCompanyId = user.client?.companyId || company?.id;
          const submissionByCompanyId = campaignCompanyId === userCompanyId;

          return submissionByCompanyId;
        }

        // For non-client users (admin, etc.), show all submissions
        return true;
      })
      .map((submission) => {
        const instagramPostRegex2 =
          /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+/i;
        const isInstagram = instagramPostRegex2.test(submission.content);
        return {
          id: submission.id,
          creatorName: submission.user?.name || 'N/A',
          campaignName: submission.campaign?.name || 'N/A',
          creatorAvatar: submission.user?.photoURL || null,
          tiktokUsername: submission.user?.creator?.tiktok || null,
          instagramUsername: submission.user?.creator?.instagram || null,
          platform: isInstagram ? 'Instagram' : 'TikTok',
          socialUsername: isInstagram
            ? submission.user?.creator?.instagram
            : submission.user?.creator?.tiktok,
          socialProfileUrl: createSocialProfileUrl(
            isInstagram
              ? submission.user?.creator?.instagram
              : submission.user?.creator?.tiktok,
            isInstagram ? 'instagram' : 'tiktok'
          ),
          content: submission.content,
          submissionId: submission.id,
          campaignId: submission.campaignId,
          userId: submission.user?.id,
        };
      })
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

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = reportList;
    if (selectedCampaign !== 'all') {
      filtered = filtered.filter((report) => report.campaignName === selectedCampaign);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (report) =>
          report.campaignName.toLowerCase().includes(query) ||
          report.creatorName.toLowerCase().includes(query)
      );
    }
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortBy] || '').toLowerCase();
      const bVal = (b[sortBy] || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [reportList, selectedCampaign, searchQuery, sortBy, sortDirection]);

  const updateUrlParams = (page, campaign, search) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (campaign !== 'all') params.set('campaign', campaign);
    if (search) params.set('search', search);

    // Update URL without causing a page refresh
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/dashboard/report${newUrl}`);
  };

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
      returnCampaign: selectedCampaign,
      returnSearch: searchQuery,
    });

    navigate(`/dashboard/report/view?${params.toString()}`);
  };

  const handleNextPage = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    updateUrlParams(newPage, selectedCampaign, searchQuery);
  };

  const handlePrevPage = () => {
    const newPage = currentPage - 1;
    setCurrentPage(newPage);
    updateUrlParams(newPage, selectedCampaign, searchQuery);
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    updateUrlParams(page, selectedCampaign, searchQuery);
  };

  const handleCampaignFilterChange = (event) => {
    const newCampaign = event.target.value;
    setSelectedCampaign(newCampaign);
    setCurrentPage(1);
    updateUrlParams(1, newCampaign, searchQuery);
  };

  const handleSearchChange = (event) => {
    const newSearch = event.target.value;
    setSearchQuery(newSearch);
    setCurrentPage(1);
    updateUrlParams(1, selectedCampaign, newSearch);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    updateUrlParams(1, selectedCampaign, '');
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
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

      {/* Campaign Filter Dropdown + Search Bar */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
        <FormControl sx={{ width: { xs: '100%', sm: 400 } }}>
          <Select
            value={selectedCampaign}
            onChange={handleCampaignFilterChange}
            displayEmpty
            sx={{
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              height: { xs: 44, sm: 48 },
              fontSize: { xs: '14px', sm: '16px' },
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
                paddingTop: { xs: '10px', sm: '12px' },
                paddingRight: '12px',
                paddingBottom: { xs: '10px', sm: '12px' },
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
            MenuProps={{
              sx: {
                maxHeight: 400,
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

        <TextField
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search campaigns or creators..."
          sx={{
            width: { xs: '100%', sm: 400 },
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              height: { xs: 44, sm: 48 },
              fontSize: { xs: '14px', sm: '16px' },
              fontWeight: 400,
              color: '#000000',
              '& fieldset': {
                borderColor: '#E7E7E7',
                borderRadius: '8px',
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: '#E7E7E7',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#E7E7E7',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#999', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <Clear
                  sx={{ color: '#999', fontSize: 18, cursor: 'pointer' }}
                  onClick={handleClearSearch}
                />
              </InputAdornment>
            ),
          }}
        />
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
        <Box>
          {/* Custom Table Header */}
          <Box
            sx={{
              width: '100%',
              backgroundColor: '#F5F5F5',
              borderRadius: 1,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                flex: '0 0 30%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 2,
                py: 1,
                borderRadius: 1,
                userSelect: 'none',
              }}
              onClick={() => handleSort('creatorName')}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: sortBy === 'creatorName' ? '#1340FF' : '#666',
                }}
              >
                Creator
              </Typography>
              {(() => {
                if (sortBy === 'creatorName') {
                  if (sortDirection === 'asc') {
                    return <ArrowUpward sx={{ fontSize: 14, color: '#1340FF' }} />;
                  }
                  return <ArrowDownward sx={{ fontSize: 14, color: '#1340FF' }} />;
                }
                return <ArrowUpward sx={{ fontSize: 14, color: '#bbb' }} />;
              })()}
            </Box>
            <Box
              sx={{
                flex: '0 0 30%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 2,
                py: 1,
                borderRadius: '4px', // Only one borderRadius key
                userSelect: 'none',
              }}
              onClick={() => handleSort('campaignName')}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: sortBy === 'campaignName' ? '#1340FF' : '#666',
                }}
              >
                Campaign Name
              </Typography>
              {(() => {
                if (sortBy === 'campaignName') {
                  if (sortDirection === 'asc') {
                    return <ArrowUpward sx={{ fontSize: 14, color: '#1340FF' }} />;
                  }
                  return <ArrowDownward sx={{ fontSize: 14, color: '#1340FF' }} />;
                }
                return <ArrowUpward sx={{ fontSize: 14, color: '#bbb' }} />;
              })()}
            </Box>
            <Box
              sx={{
                flex: '0 0 10%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 2,
                py: 1,
                borderRadius: '4px', // Only one borderRadius key
                userSelect: 'none',
              }}
              onClick={() => handleSort('platform')}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: sortBy === 'platform' ? '#1340FF' : '#666',
                }}
              >
                Platform
              </Typography>
              {(() => {
                if (sortBy === 'platform') {
                  if (sortDirection === 'asc') {
                    return <ArrowUpward sx={{ fontSize: 14, color: '#1340FF' }} />;
                  }
                  return <ArrowDownward sx={{ fontSize: 14, color: '#1340FF' }} />;
                }
                return <ArrowUpward sx={{ fontSize: 14, color: '#bbb' }} />;
              })()}
            </Box>
            <Box sx={{ flex: '0 0 30%', textAlign: 'right' }}>
              {/* Empty space for action column */}
            </Box>
          </Box>

          {/* Table Body */}
          {isLoadingSubmissions ? (
            <Stack p={3} spacing={2} alignItems="center">
              <Typography>Loading reports...</Typography>
              <CircularProgress />
            </Stack>
          ) : (
          <Box sx={{ width: '100%' }}>
            {displayedReports.map((row, index) => (
              <Box
                key={row.id}
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'stretch', md: 'center' },
                  borderBottom: '1px solid #f0f0f0',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                }}
              >
                {/* Mobile Card Layout */}
                <Box
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  {/* Creator Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={row.creatorAvatar}
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: '#e0e0e0',
                        color: '#666',
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {row.creatorName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.creatorName}
                      </Typography>
                      {row.socialUsername && (
                        <Typography
                          component="a"
                          href={row.socialProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontWeight: 400,
                            fontSize: 12,
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          {row.platform === 'Instagram' ? row.socialUsername : `@${row.socialUsername}`}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Platform */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: '#999',
                        fontWeight: 500,
                        mb: 0.25,
                      }}
                    >
                      Platform
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: '#333',
                        fontWeight: 500,
                      }}
                    >
                      {row.platform}
                    </Typography>
                  </Box>

                  {/* Campaign Name */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: '#999',
                        fontWeight: 500,
                        mb: 0.25,
                      }}
                    >
                      Campaign
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: '#333',
                        fontWeight: 500,
                      }}
                    >
                      {row.campaignName}
                    </Typography>
                  </Box>

                  {/* Action Button */}
                  <Button
                    variant="text"
                    onClick={() => handleViewReport(row)}
                    fullWidth
                    sx={{
                      height: 40,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                      backgroundColor: '#FFFFFF',
                      color: '#1340FF',
                      fontSize: 14,
                      fontWeight: 600,
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

                {/* Desktop Table Layout */}
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    width: '100%'
                  }}
                >
                  <Box
                    sx={{
                      flex: '0 0 30%',
                      maxWidth: '30%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 1.5,
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
                    <Stack sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 400,
                          fontSize: 14,
                          color: '#333',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.creatorName}
                      </Typography>
                      {row.socialUsername && (
                        <Typography
                          component="a"
                          href={row.socialProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            fontWeight: 400,
                            fontSize: 13,
                            color: '#666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline', color: '#1340FF' },
                          }}
                        >
                          {row.platform === 'Instagram' ? row.socialUsername : `@${row.socialUsername}`}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  <Box sx={{ flex: '0 0 30%', px: 2, py: 1.5, }}>
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
                  <Box sx={{ flex: '0 0 10%', px: 2, py: 1.5, }}>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: 14,
                        color: '#333',
                      }}
                    >
                      {row.platform}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '0 0 30%', textAlign: 'right', px: 2 }}>
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
              </Box>
            ))}
          </Box>
          )}

          {/* Pagination Controls - Clean minimal design */}
          {!isLoadingSubmissions && totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mt: { xs: 2, md: 3 },
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
                const showEllipsis = totalPages > 5;

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
                          mx: { xs: 0.5, md: 1 },
                          backgroundColor: 'transparent',
                          color: currentPage === i ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: { xs: 14, md: 16 },
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
                      onClick={() => handlePageClick(1)}
                      sx={{
                        minWidth: 'auto',
                        p: 0,
                        mx: { xs: 0.5, md: 1 },
                        backgroundColor: 'transparent',
                        color: currentPage === 1 ? '#000000' : '#8E8E93',
                        border: 'none',
                        fontSize: { xs: 14, md: 16 },
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
                      <Typography key="ellipsis1" sx={{ mx: { xs: 0.5, md: 1 }, color: '#8E8E93', fontSize: { xs: 14, md: 16 } }}>
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
                          mx: { xs: 0.5, md: 1 },
                          backgroundColor: 'transparent',
                          color: currentPage === i ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: { xs: 14, md: 16 },
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
                      <Typography key="ellipsis2" sx={{ mx: { xs: 0.5, md: 1 }, color: '#8E8E93', fontSize: { xs: 14, md: 16 } }}>
                        ...
                      </Typography>
                    );
                  }

                  if (totalPages > 1) {
                    pageButtons.push(
                      <Button
                        key={totalPages}
                        onClick={() => handlePageClick(totalPages)}
                        sx={{
                          minWidth: 'auto',
                          p: 0,
                          mx: { xs: 0.5, md: 1 },
                          backgroundColor: 'transparent',
                          color: currentPage === totalPages ? '#000000' : '#8E8E93',
                          border: 'none',
                          fontSize: { xs: 14, md: 16 },
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
          {!isLoadingSubmissions && filteredReports.length === 0 && (
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
