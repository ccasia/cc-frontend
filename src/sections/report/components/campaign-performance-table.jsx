import PropTypes from 'prop-types';
import { useNavigate } from 'react-router';
import React, { useMemo, useState } from 'react';
import { useLocation, useSearchParams, Link as RouterLink } from 'react-router-dom';

import {
  Clear,
  Search,
  ArrowUpward,
  ArrowDownward,
  ChevronLeftRounded,
  ChevronRightRounded,
} from '@mui/icons-material';
import {
  Box,
  Stack,
  Avatar,
  Button,
  Select,
  Divider,
  MenuItem,
  InputBase,
  TextField,
  ButtonBase,
  IconButton,
  Typography,
  FormControl,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetClientCredits from 'src/hooks/use-get-client-credits';
import { useGetPostingSubmissions } from 'src/hooks/use-get-submission';

import { fDate } from 'src/utils/format-time';
import { createSocialProfileUrl } from 'src/utils/media-kit-utils';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import ReportLanding from './report-landing';

const rowNumberSx = {
  minWidth: 24,
  flexShrink: 0,
  fontSize: 14,
  color: '#999',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

const formatNumber = (value) => value.toLocaleString();

// First grapheme, so emoji and accented names never show half a character
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter() : null;
const initialOf = (text = '') => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const first = segmenter
    ? segmenter.segment(trimmed)[Symbol.iterator]().next().value.segment
    : [...trimmed][0];
  return first.toLocaleUpperCase();
};

// Handles are stored as "name", "@name" or a pasted profile URL
const cleanHandle = (value) =>
  value
    ?.trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?(?:instagram|tiktok)\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/[/?#].*$/, '') || null;

// Creators can paste text around the link, so take the post URL out of the field
const POST_URL_REGEX =
  /(?:https?:\/\/)?(?:[\w-]+\.)?(?:instagram\.com\/(?:p|reel|tv)\/[\w-]+|tiktok\.com\/@[^/\s]+\/(?:video|photo)\/\d+|(?:vt|vm|m)\.tiktok\.com\/[\w-]+)[^\s]*/i;
const extractPostUrl = (text) => {
  const match = text?.match(POST_URL_REGEX)?.[0];
  if (!match) return text;
  return /^https?:\/\//i.test(match) ? match : `https://${match}`;
};

const PAGE_SIZE = 8;

// 1 … 4 5 6 … 161, always 7 slots or fewer
const getPageItems = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, Math.min(current - 1, total - 4));
  const end = Math.min(total - 1, Math.max(current + 1, 5));
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  // A gap that would hide a single page shows that page instead
  const before = start === 3 ? [2] : [];
  const after = end === total - 2 ? [total - 1] : [];
  return [
    1,
    ...(start > 3 ? ['start-gap'] : before),
    ...middle,
    ...(end < total - 2 ? ['end-gap'] : after),
    total,
  ];
};

const pageButtonSx = {
  minWidth: 32,
  width: 'auto',
  height: 32,
  px: 1,
  borderRadius: '8px',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '32px',
  color: '#636366',
  fontVariantNumeric: 'tabular-nums',
  transition: 'background-color 160ms ease-out, color 160ms ease-out',
  '&:hover': { bgcolor: '#F5F5F5' },
  '&.Mui-focusVisible': { outline: '2px solid #1340FF', outlineOffset: 2 },
};

const activePageSx = {
  bgcolor: '#1340FF',
  color: '#FFFFFF',
  '&:hover': { bgcolor: '#1340FF' },
};

// "…" turns into a page-number input on click; Enter jumps, Esc or blur cancels
const PageJump = ({ totalPages, onJump }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const close = () => {
    setEditing(false);
    setValue('');
  };

  const submit = () => {
    const page = Number.parseInt(value, 10);
    if (page >= 1 && page <= totalPages) onJump(page);
    close();
  };

  if (!editing) {
    return (
      <ButtonBase
        aria-label="Go to page"
        disableRipple
        title="Go to page"
        onClick={() => setEditing(true)}
        sx={{ ...pageButtonSx, color: '#8E8E93' }}
      >
        …
      </ButtonBase>
    );
  }

  return (
    <InputBase
      autoFocus
      value={value}
      placeholder={`1–${formatNumber(totalPages)}`}
      onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))}
      onBlur={close}
      onKeyDown={(event) => {
        if (event.key === 'Enter') submit();
        if (event.key === 'Escape') close();
      }}
      inputProps={{ inputMode: 'numeric', 'aria-label': `Page number, 1 to ${totalPages}` }}
      sx={{
        width: 64,
        height: 32,
        px: 1,
        borderRadius: '8px',
        border: '1px solid #1340FF',
        fontSize: 14,
        fontVariantNumeric: 'tabular-nums',
        '& input': { p: 0, textAlign: 'center' },
        '& input::placeholder': { color: '#AEAEB2', opacity: 1, fontSize: 12 },
      }}
    />
  );
};

PageJump.propTypes = {
  totalPages: PropTypes.number,
  onJump: PropTypes.func,
};

const PaginationBar = ({ currentPage, totalPages, totalItems, onPageChange }) => {
  const first = (currentPage - 1) * PAGE_SIZE + 1;
  const last = Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <Box
      component="nav"
      aria-label="Report pages"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        mt: 2,
        pb: 1,
      }}
    >
      <Typography sx={{ fontSize: 13, color: '#8E8E93', fontVariantNumeric: 'tabular-nums' }}>
        Showing {formatNumber(first)}–{formatNumber(last)} of {formatNumber(totalItems)} posts
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          disableRipple
          sx={{ ...pageButtonSx, p: 0 }}
        >
          <ChevronLeftRounded sx={{ fontSize: 20 }} />
        </IconButton>

        {getPageItems(currentPage, totalPages).map((item) =>
          typeof item === 'number' ? (
            <ButtonBase
              key={item}
              onClick={() => item !== currentPage && onPageChange(item)}
              aria-current={item === currentPage ? 'page' : undefined}
              disableRipple
              sx={{ ...pageButtonSx, ...(item === currentPage && activePageSx) }}
            >
              {formatNumber(item)}
            </ButtonBase>
          ) : (
            <PageJump key={item} totalPages={totalPages} onJump={onPageChange} />
          )
        )}

        <IconButton
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          disableRipple
          sx={{ ...pageButtonSx, p: 0 }}
        >
          <ChevronRightRounded sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Box>
  );
};

PaginationBar.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  totalItems: PropTypes.number,
  onPageChange: PropTypes.func,
};

// One column template for the header and every row, so they always line up
const DESKTOP_GRID = {
  gridTemplateColumns:
    '44px minmax(0, 1.3fr) minmax(0, 1.5fr) 96px 120px 112px minmax(0, 1fr) 216px',
  columnGap: 3,
  alignItems: 'center',
  px: 2.5,
};

const headLabelSx = { fontWeight: 600, fontSize: 14, color: '#666' };
const cellTextSx = { fontSize: 14, color: '#231F20', lineHeight: 1.4 };
const subTextSx = { fontSize: 13, color: '#8E8E93', lineHeight: 1.4 };
const ellipsisSx = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

const formatCredits = (row) => {
  const credits = row.isCreditTier ? row.creditTierCredits || 1 : 1;
  return `${credits} ${credits === 1 ? 'credit' : 'credits'}`;
};

const SortHeader = ({ label, column, sortBy, sortDirection, onSort, descFirst = false }) => {
  const isActive = sortBy === column;
  // Posting Date shows newest first, so its arrows point the other way
  const pointsUp = isActive ? (sortDirection === 'asc') !== descFirst : !descFirst;
  const ArrowIcon = pointsUp ? ArrowUpward : ArrowDownward;

  return (
    <Box
      onClick={() => onSort(column)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Typography sx={{ ...headLabelSx, color: isActive ? '#1340FF' : '#666' }}>{label}</Typography>
      <ArrowIcon sx={{ fontSize: 14, color: isActive ? '#1340FF' : '#bbb' }} />
    </Box>
  );
};

SortHeader.propTypes = {
  label: PropTypes.string,
  column: PropTypes.string,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string,
  onSort: PropTypes.func,
  descFirst: PropTypes.bool,
};

const filterFieldSx = {
  bgcolor: '#FFFFFF',
  borderRadius: '8px',
  height: 44,
  fontSize: 14,
  color: '#231F20',
  '& .MuiSelect-select': { display: 'flex', alignItems: 'center', py: 0, pl: 1.25 },
  '& .MuiOutlinedInput-notchedOutline, & fieldset': { borderColor: '#E7E7E7', borderRadius: '8px' },
  '&:hover .MuiOutlinedInput-notchedOutline, &:hover fieldset': { borderColor: '#C7C7CC' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline, &.Mui-focused fieldset': {
    borderColor: '#1340FF',
    borderWidth: '1px',
  },
};

// Without a name it is the "All Campaigns" option
const CampaignOption = ({ name, image, count, selected = false }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minWidth: 0 }}>
    <Avatar
      variant="rounded"
      src={name ? image : undefined}
      sx={{
        width: 28,
        height: 28,
        borderRadius: '6px',
        bgcolor: '#F0F3FF',
        color: '#1340FF',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {name ? initialOf(name) : <Iconify icon="mingcute:grid-line" width={16} />}
    </Avatar>
    <Typography
      sx={{
        ...ellipsisSx,
        flex: 1,
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        color: selected ? '#1340FF' : '#231F20',
      }}
    >
      <span dir="auto" title={name}>
        {name || 'All Campaigns'}
      </span>
    </Typography>
    {count !== undefined && (
      <Box
        component="span"
        sx={{
          minWidth: 24,
          px: 0.75,
          py: 0.25,
          borderRadius: '999px',
          bgcolor: selected ? '#E0E7FF' : '#F5F5F5',
          color: selected ? '#1340FF' : '#8E8E93',
          fontSize: 12,
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: '18px',
        }}
      >
        {formatNumber(count)}
      </Box>
    )}
    {count !== undefined && (
      <Iconify
        icon="eva:checkmark-fill"
        width={18}
        sx={{ flexShrink: 0, color: '#1340FF', visibility: selected ? 'visible' : 'hidden' }}
      />
    )}
  </Box>
);

CampaignOption.propTypes = {
  name: PropTypes.string,
  image: PropTypes.string,
  count: PropTypes.number,
  selected: PropTypes.bool,
};

const PostLink = ({ url }) =>
  url ? (
    <Typography
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: 13,
        color: '#1340FF',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      <Box component="span" sx={ellipsisSx}>
        {url
          .replace(/^https?:\/\/(www\.)?[^/]+\//, '')
          .replace(/[?#].*$/, '')
          .replace(/\/$/, '')}
      </Box>
      <Iconify icon="eva:external-link-fill" width={14} sx={{ flexShrink: 0 }} />
    </Typography>
  ) : null;

PostLink.propTypes = {
  url: PropTypes.string,
};

const CampaignPerformanceTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [selectedCampaign, setSelectedCampaign] = useState(
    () => searchParams.get('campaign') || 'all'
  );

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');

  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('asc');

  const { user } = useAuthContext();
  const { company } = useGetClientCredits();
  const { data: submissionData, isLoading: isLoadingSubmissions } = useGetPostingSubmissions();

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
        const tiktokMobileRegex = /(?:https?:\/\/)?(?:vt|vm|m)\.tiktok\.com\/[A-Za-z0-9_-]+/i;

        const isInstagramPost = instagramPostRegex.test(submission.content);
        const isTiktokPost =
          tiktokPostRegex.test(submission.content) || tiktokMobileRegex.test(submission.content);

        if (!isInstagramPost && !isTiktokPost) return false;

        // Stored metrics (scraped or API snapshots) work without a connected account
        if (!submission.hasStoredMetrics) {
          if (isInstagramPost && !submission.isInstagramConnected) return false;
          if (isTiktokPost && !isInstagramPost && !submission.isTiktokConnected) return false;

          if (isInstagramPost && submission.isInstagramTokenValid === false) return false;
          if (isTiktokPost && !isInstagramPost && submission.isTiktokTokenValid === false)
            return false;
        }

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
          creatorId: submission.user?.creator?.id,
          creatorName: submission.user?.name?.trim() || null,
          campaignName: submission.campaign?.name || 'N/A',
          campaignImage: submission.campaign?.campaignBrief?.images?.[0] || null,
          isCreditTier: submission.campaign.isCreditTier || false,
          creditTier: submission.user?.creator?.creditTier?.name || null,
          creditTierCredits: submission.user?.creator?.creditTier?.creditsPerVideo || null,
          creatorAvatar: submission.user?.photoURL || null,
          tiktokUsername: submission.user?.creator?.tiktok || null,
          instagramUsername: submission.user?.creator?.instagram || null,
          video: submission.video || null,
          platform: isInstagram ? 'Instagram' : 'TikTok',
          socialUsername: cleanHandle(
            isInstagram ? submission.user?.creator?.instagram : submission.user?.creator?.tiktok
          ),
          content: extractPostUrl(submission.content),
          submissionId: submission.id,
          campaignId: submission.campaignId,
          userId: submission.user?.id,
          updatedAt: submission.updatedAt,
          postedAt: submission.postingDate || submission.updatedAt,
        };
      })
      .map((row) => ({
        ...row,
        // No name on the account: the handle still identifies the creator
        creatorName:
          row.creatorName || (row.socialUsername ? `@${row.socialUsername}` : 'Unknown creator'),
        socialProfileUrl: createSocialProfileUrl(
          row.socialUsername,
          row.platform === 'Instagram' ? 'instagram' : 'tiktok'
        ),
      }))
      .sort((a, b) => {
        const campaignCompare = a.campaignName.localeCompare(b.campaignName);
        return campaignCompare === 0 ? a.creatorName.localeCompare(b.creatorName) : campaignCompare;
      });
  }, [submissionData, user, company]);

  // Get unique campaigns for filter dropdown
  // Keyed by id: two brands can both run a campaign called "Ramadan Sale"
  const uniqueCampaigns = useMemo(() => {
    const byId = new Map();
    reportList.forEach(({ campaignId, campaignName, campaignImage }) => {
      const entry = byId.get(campaignId) || {
        id: campaignId,
        name: campaignName,
        image: null,
        count: 0,
      };
      byId.set(campaignId, {
        ...entry,
        image: entry.image || campaignImage,
        count: entry.count + 1,
      });
    });
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [reportList]);

  // Older links filter by name, newer ones by id
  const activeCampaign = uniqueCampaigns.find(
    (campaign) => campaign.id === selectedCampaign || campaign.name === selectedCampaign
  );

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    let filtered = reportList;
    if (selectedCampaign !== 'all') {
      filtered = filtered.filter((report) => report.campaignId === activeCampaign?.id);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (report) =>
          report.campaignName.toLowerCase().includes(query) ||
          report.creatorName.toLowerCase().includes(query) ||
          report.socialUsername?.toLowerCase().includes(query)
      );
    }
    return [...filtered].sort((a, b) => {
      if (sortBy === 'updatedAt') {
        const aTime = a.postedAt ? new Date(a.postedAt).getTime() : 0;
        const bTime = b.postedAt ? new Date(b.postedAt).getTime() : 0;
        const cmp = aTime - bTime;
        return sortDirection === 'asc' ? -cmp : cmp;
      }

      if (sortBy === 'creditTierCredits') {
        const aCredit = a.creditTierCredits || 0;
        const bCredit = b.creditTierCredits || 0;
        const creditSort = aCredit - bCredit;
        return sortDirection === 'asc' ? -creditSort : creditSort;
      }

      const aVal = (a[sortBy] || '').toLowerCase();
      const bVal = (b[sortBy] || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [reportList, selectedCampaign, activeCampaign, searchQuery, sortBy, sortDirection]);

  console.log('Report List: ', reportList);

  const buildCampaignDetailsPath = (campaignId) => {
    const returnTo = `${location.pathname}${location.search}`;
    return `${paths.dashboard.campaign.details(campaignId)}?returnTo=${encodeURIComponent(returnTo)}`;
  };

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
      creatorId: row.creatorId,
      creatorName: row.creatorName,
      campaignName: row.campaignName,
      video: row.video,
      // Add return state for back navigation
      returnPage: currentPage.toString(),
      returnCampaign: selectedCampaign,
      returnSearch: searchQuery,
    });

    navigate(`/dashboard/report/view?${params.toString()}`);
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
  const totalPages = Math.ceil(filteredReports.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const displayedReports = filteredReports.slice(startIndex, endIndex);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'Aileron',
            fontSize: { xs: 18, md: 24 },
            fontWeight: 600,
            color: '#333',
          }}
        >
          Your Campaigns
        </Typography>
        {!isLoadingSubmissions && (
          <Typography sx={{ fontSize: 14, color: '#8E8E93' }}>
            {formatNumber(filteredReports.length)} {filteredReports.length === 1 ? 'post' : 'posts'}
          </Typography>
        )}
      </Box>

      {/* Campaign Filter Dropdown + Search Bar */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <FormControl sx={{ width: { xs: '100%', sm: 360 } }}>
          <Select
            value={activeCampaign ? activeCampaign.id : 'all'}
            onChange={handleCampaignFilterChange}
            displayEmpty
            renderValue={(value) => {
              const campaign = uniqueCampaigns.find((item) => item.id === value);
              return <CampaignOption name={campaign?.name} image={campaign?.image} />;
            }}
            sx={{
              ...filterFieldSx,
              '& .MuiSelect-icon': { color: '#231F20', width: 20, height: 20 },
            }}
            MenuProps={{
              // Same width and left edge as the field; long names truncate instead of widening the menu
              anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
              transformOrigin: { vertical: 'top', horizontal: 'left' },
              PaperProps: {
                sx: {
                  mt: 0.75,
                  width: { xs: 'calc(100% - 32px)', sm: 360 },
                  maxHeight: 360,
                  // Solid panel: the theme's blurred gradient makes the rows hard to read
                  bgcolor: '#FFFFFF',
                  backgroundImage: 'none',
                  backdropFilter: 'none',
                  borderRadius: '10px',
                  border: '1px solid #E7E7E7',
                  boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.10)',
                  '& .MuiMenu-list': { p: 0.75 },
                  '& .MuiMenuItem-root': {
                    minHeight: 44,
                    px: 1.25,
                    py: 0.75,
                    mb: 0.25,
                    borderRadius: '6px',
                    '&:last-of-type': { mb: 0 },
                    '&:hover, &.Mui-focusVisible': { bgcolor: '#F5F5F5' },
                    '&.Mui-selected, &.Mui-selected.Mui-focusVisible': { bgcolor: '#F5F7FF' },
                    '&.Mui-selected:hover': { bgcolor: '#EEF2FF' },
                  },
                },
              },
            }}
          >
            <MenuItem value="all">
              <CampaignOption count={reportList.length} selected={!activeCampaign} />
            </MenuItem>
            {uniqueCampaigns.length > 0 && (
              <Divider sx={{ my: '4px !important', borderColor: '#F0F0F0' }} />
            )}
            {uniqueCampaigns.map((campaign) => (
              <MenuItem key={campaign.id} value={campaign.id}>
                <CampaignOption
                  name={campaign.name}
                  image={campaign.image}
                  count={campaign.count}
                  selected={activeCampaign?.id === campaign.id}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search campaigns or creators..."
          sx={{ width: { xs: '100%', sm: 360 }, '& .MuiOutlinedInput-root': filterFieldSx }}
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
              ...DESKTOP_GRID,
              display: { xs: 'none', lg: 'grid' },
              py: 1.25,
              bgcolor: '#F5F5F5',
              borderRadius: 1,
            }}
          >
            <Typography sx={headLabelSx}>#</Typography>
            <SortHeader
              label="Creator"
              column="creatorName"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortHeader
              label="Campaign"
              column="campaignName"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortHeader
              label="Tier"
              column="creditTierCredits"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortHeader
              label="Platform"
              column="platform"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <SortHeader
              label="Posting Date"
              column="updatedAt"
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
              descFirst
            />
            <Typography sx={headLabelSx}>Post</Typography>
            <Box />
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
                    flexDirection: { xs: 'column', lg: 'row' },
                    alignItems: { xs: 'stretch', lg: 'center' },
                    borderBottom: '1px solid #f0f0f0',
                    '&:hover': {
                      backgroundColor: '#f8f9fa',
                    },
                  }}
                >
                  {/* Mobile Card Layout */}
                  <Box
                    sx={{
                      display: { xs: 'flex', lg: 'none' },
                      flexDirection: 'column',
                      gap: 1.5,
                      p: 2,
                    }}
                  >
                    {/* Creator Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={rowNumberSx}>
                        {formatNumber(startIndex + index + 1)}
                      </Typography>
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
                        {initialOf(row.creatorName)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          dir="auto"
                          title={row.creatorName}
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
                            title={`@${row.socialUsername}`}
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
                            @{row.socialUsername}
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
                      <PostLink url={row.content} />
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
                      {row.campaignId ? (
                        <Typography
                          component={RouterLink}
                          to={buildCampaignDetailsPath(row.campaignId)}
                          sx={{
                            fontSize: 13,
                            color: '#333',
                            fontWeight: 500,
                            overflowWrap: 'anywhere',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: '#1340FF',
                            },
                          }}
                        >
                          {row.campaignName}
                        </Typography>
                      ) : (
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: '#333',
                            fontWeight: 500,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {row.campaignName}
                        </Typography>
                      )}
                    </Box>

                    {/* Posting Date */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: '#999',
                          fontWeight: 500,
                          mb: 0.25,
                        }}
                      >
                        Posting Date
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: '#333',
                          fontWeight: 500,
                        }}
                      >
                        {fDate(row.postedAt)}
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
                      ...DESKTOP_GRID,
                      display: { xs: 'none', lg: 'grid' },
                      width: '100%',
                      minHeight: 76,
                      py: 1.5,
                    }}
                  >
                    <Typography sx={{ ...cellTextSx, color: '#8E8E93' }}>
                      {formatNumber(startIndex + index + 1)}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar
                        src={row.creatorAvatar}
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          bgcolor: '#e0e0e0',
                          color: '#666',
                          fontSize: 14,
                        }}
                      >
                        {initialOf(row.creatorName)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          dir="auto"
                          title={row.creatorName}
                          sx={{ ...cellTextSx, ...ellipsisSx, fontWeight: 500 }}
                        >
                          {row.creatorName}
                        </Typography>
                        {row.socialUsername && (
                          <Typography
                            component="a"
                            href={row.socialProfileUrl}
                            title={`@${row.socialUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              ...subTextSx,
                              ...ellipsisSx,
                              display: 'block',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline', color: '#1340FF' },
                            }}
                          >
                            @{row.socialUsername}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar
                        variant="rounded"
                        src={row.campaignImage}
                        alt={row.campaignName}
                        sx={{
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          bgcolor: '#e0e0e0',
                          color: '#666',
                          fontSize: 14,
                        }}
                      >
                        {initialOf(row.campaignName)}
                      </Avatar>
                      <Typography
                        dir="auto"
                        title={row.campaignName}
                        {...(row.campaignId && {
                          component: RouterLink,
                          to: buildCampaignDetailsPath(row.campaignId),
                        })}
                        sx={{
                          ...cellTextSx,
                          fontWeight: 500,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          overflowWrap: 'anywhere',
                          textDecoration: 'none',
                          ...(row.campaignId && {
                            '&:hover': { textDecoration: 'underline', color: '#1340FF' },
                          }),
                        }}
                      >
                        {row.campaignName}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={cellTextSx}>{formatCredits(row)}</Typography>
                      {row.creditTier && <Typography sx={subTextSx}>{row.creditTier}</Typography>}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Iconify
                        icon={row.platform === 'Instagram' ? 'mdi:instagram' : 'ic:baseline-tiktok'}
                        width={18}
                        sx={{ color: '#636366', flexShrink: 0 }}
                      />
                      <Typography sx={cellTextSx}>{row.platform}</Typography>
                    </Box>

                    <Typography sx={cellTextSx}>{fDate(row.postedAt)}</Typography>

                    <Box sx={{ minWidth: 0 }}>
                      <PostLink url={row.content} />
                    </Box>

                    <Button
                      variant="text"
                      onClick={() => handleViewReport(row)}
                      sx={{
                        justifySelf: 'end',
                        height: 38,
                        px: 2,
                        pb: '11px',
                        whiteSpace: 'nowrap',
                        borderRadius: '8px',
                        border: '1px solid #E7E7E7',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        bgcolor: '#FFFFFF',
                        color: '#1340FF',
                        fontSize: 14,
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: '#F8F9FA',
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
          )}

          {!isLoadingSubmissions && totalPages > 1 && (
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredReports.length}
              onPageChange={handlePageClick}
            />
          )}

          {/* Empty state - show when no data */}
          {/* No posts at all: the landing message sits under the table header */}
          {!isLoadingSubmissions && reportList.length === 0 && (
            <ReportLanding sx={{ minHeight: 360 }} />
          )}

          {!isLoadingSubmissions && reportList.length > 0 && filteredReports.length === 0 && (
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
                  : `No results for "${activeCampaign?.name || selectedCampaign}"`}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: '#999',
                }}
              >
                {selectedCampaign === 'all'
                  ? 'Campaigns with posted content and performance data will appear here'
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
