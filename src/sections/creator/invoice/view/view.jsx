import dayjs from 'dayjs';
import { debounce } from 'lodash';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stack,
  Select,
  Button,
  MenuItem,
  Container,
  InputBase,
  Typography,
  CircularProgress,
} from '@mui/material';

import useGetInvoicesByCreator from 'src/hooks/use-get-invoices-creator';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import InvoiceLists from '../invoice-lists';

const Invoice = () => {
  const settings = useSettingsContext();
  const theme = useTheme();
  const { invoices, isLoading } = useGetInvoicesByCreator();
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [search, setSearch] = useState({
    query: '',
    results: [],
  });
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetQuery = useCallback(
    debounce((q) => setDebouncedQuery(q), 300), // 300ms delay
    []
  );

  // Search input ref for keyboard shortcut focus
  const searchInputRef = useRef(null);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for CMD+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (_, newValue) => {
    setCurrentTab(newValue);
  };

  const sortedData = applyFilter({
    inputData: invoices,
    sort: sortBy,
    search,
  });

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Typography
        variant="h2"
        sx={{
          mb: 0.2,
          mt: { lg: 2, xs: 2, sm: 2 },
          fontFamily: theme.typography.fontSecondaryFamily,
          fontWeight: 'normal',
        }}
      >
        Invoices 🧾
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontFamily: theme.typography.fontFamily, color: '#636366', mb: 3 }}
      >
        All your invoices, in one place!
      </Typography>

      <Box
        sx={{
          mb: 2.5,
        }}
      >
        {/* Main Controls Container */}
        <Box
          sx={{
            border: '1px solid #e7e7e7',
            borderRadius: 1,
            p: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, md: 1.5 },
            bgcolor: 'background.paper',
          }}
        >
          {/* Filter Buttons */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flex: { xs: 'none', md: '0 0 auto' },
            }}
          >
            <Button
              onClick={() => setCurrentTab('all')}
              sx={{
                px: 2,
                py: 1,
                minHeight: '38px',
                height: '38px',
                minWidth: 'fit-content',
                color: currentTab === 'all' ? '#ffffff' : '#666666',
                bgcolor: currentTab === 'all' ? '#1340ff' : 'transparent',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: 0.75,
                textTransform: 'none',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '1px',
                  left: '1px',
                  right: '1px',
                  bottom: '1px',
                  borderRadius: 0.75,
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: currentTab === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 64, 255, 0.08)',
                },
                '&:hover': {
                  bgcolor: currentTab === 'all' ? '#1340ff' : 'transparent',
                  color: currentTab === 'all' ? '#ffffff' : '#1340ff',
                  transform: 'scale(0.98)',
                },
                '&:focus': {
                  outline: 'none',
                },
              }}
            >
              All Invoices
            </Button>
          </Stack>

          {/* Search and Sort Controls */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              flex: { xs: 'none', md: '1 1 auto' },
              justifyContent: { xs: 'stretch', md: 'flex-end' },
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            {/* Search Box */}
            <Box
              sx={{
                width: { xs: '100%', sm: '240px', md: '280px' },
                border: '1px solid #e7e7e7',
                borderRadius: 0.75,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                height: '38px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&:hover': {
                  borderColor: '#1340ff',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(19, 64, 255, 0.1)',
                },
                '&:focus-within': {
                  borderColor: '#1340ff',
                  boxShadow: '0 0 0 3px rgba(19, 64, 255, 0.1)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <InputBase
                inputRef={searchInputRef}
                value={search.query}
                onChange={(e) => {
                  setSearch((prev) => ({ ...prev, query: e.target.value }));
                  debouncedSetQuery(e.target.value);
                }}
                placeholder="Search invoices"
                startAdornment={
                  <Iconify
                    icon="eva:search-fill"
                    sx={{
                      width: 18,
                      height: 18,
                      color: 'text.disabled',
                      ml: 1.5,
                      mr: 1,
                      transition: 'color 0.2s ease',
                    }}
                  />
                }
                endAdornment={
                  <Box
                    sx={{
                      display: { xs: 'none', md: 'flex' },
                      alignItems: 'center',
                      gap: 0.25,
                      mr: 1.5,
                      ml: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        bgcolor: '#f5f5f5',
                        borderRadius: 0.5,
                        border: '1px solid #e0e0e0',
                        minHeight: '22px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: '#eeeeee',
                          borderColor: '#d0d0d0',
                          transform: 'scale(1.05)',
                        },
                        '&:active': {
                          transform: 'scale(0.95)',
                        },
                      }}
                      onClick={() => searchInputRef.current?.focus()}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#666666',
                          lineHeight: 1,
                          fontFamily: 'monospace',
                        }}
                      >
                        {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#666666',
                          lineHeight: 1,
                          fontFamily: 'monospace',
                        }}
                      >
                        K
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{
                  width: '100%',
                  color: 'text.primary',
                  fontSize: '0.95rem',
                  '& input': {
                    py: 1,
                    px: 1,
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&::placeholder': {
                      color: '#999999',
                      opacity: 1,
                      transition: 'color 0.2s ease',
                    },
                    '&:focus::placeholder': {
                      color: '#cccccc',
                    },
                  },
                }}
              />
            </Box>

            {/* Sort Dropdown */}
            <Box
              sx={{
                width: { xs: '100%', sm: '140px' },
                minWidth: { xs: '100%', sm: '140px' },
                maxWidth: { xs: '100%', sm: '140px' },
                border: '1px solid #e7e7e7',
                borderRadius: 0.75,
                bgcolor: 'background.paper',
                height: '38px',
                transition: 'border-color 0.2s ease',
                '&:hover': {
                  borderColor: '#1340ff',
                },
              }}
            >
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                input={<InputBase />}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: 'white',
                      border: '1px solid #e7e7e7',
                      borderRadius: 1,
                      mt: 0.5,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                  },
                }}
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      pr: 0.5, // Space for the arrow
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: selected ? '#1340ff' : '#666666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {selected || 'Sort by'}
                    </Typography>
                  </Box>
                )}
                sx={{
                  width: '100%',
                  height: '100%',
                  '& .MuiSelect-select': {
                    py: 1,
                    px: 1.25,
                    pr: '28px !important', // Reduced space for arrow
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: 'unset',
                  },
                  '& .MuiSelect-icon': {
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: sortBy ? '#1340ff' : 'text.secondary',
                    transition: 'color 0.2s ease',
                    position: 'absolute',
                    width: '16px',
                    height: '16px',
                  },
                  '&.Mui-focused': {
                    outline: 'none',
                  },
                }}
              >
                <MenuItem
                  value="Latest"
                  sx={{
                    mx: 0.5,
                    my: 0.25,
                    borderRadius: 0.75,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                      color: '#1340ff',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.12)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.04)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Latest
                    {sortBy === 'Latest' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 16, height: 16, color: '#1340ff' }}
                      />
                    )}
                  </Stack>
                </MenuItem>
                <MenuItem
                  value="Status"
                  sx={{
                    mx: 0.5,
                    my: 0.25,
                    borderRadius: 0.75,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                      color: '#1340ff',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.12)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.04)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Status
                    {sortBy === 'Status' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 16, height: 16, color: '#1340ff' }}
                      />
                    )}
                  </Stack>
                </MenuItem>
                <MenuItem
                  value="Price"
                  sx={{
                    mx: 0.5,
                    my: 0.25,
                    borderRadius: 0.75,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(19, 64, 255, 0.08) !important',
                      color: '#1340ff',
                      '&:hover': {
                        bgcolor: 'rgba(19, 64, 255, 0.12)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(19, 64, 255, 0.04)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                    Price
                    {sortBy === 'Price' && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        sx={{ ml: 'auto', width: 16, height: 16, color: '#1340ff' }}
                      />
                    )}
                  </Stack>
                </MenuItem>
              </Select>
            </Box>
          </Stack>
        </Box>
      </Box>

      {!isLoading && <InvoiceLists invoices={sortedData} />}
      {isLoading && (
        <Box
          sx={{
            position: 'relative',
            top: 200,
            textAlign: 'center',
          }}
        >
          <CircularProgress
            thickness={7}
            size={25}
            sx={{
              color: theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}
    </Container>
  );
};

export default Invoice;

function applyFilter({ inputData, sort, search }) {
  let filteredData = inputData;

  // Apply search filter
  if (search?.query) {
    filteredData = filteredData?.filter(
      (invoice) =>
        invoice.invoiceNumber?.toLowerCase().includes(search.query.toLowerCase()) ||
        invoice.campaign?.name?.toLowerCase().includes(search.query.toLowerCase()) ||
        invoice.campaign?.company?.name?.toLowerCase().includes(search.query.toLowerCase()) ||
        invoice.campaign?.brand?.name?.toLowerCase().includes(search.query.toLowerCase()) ||
        invoice.status?.toLowerCase().includes(search.query.toLowerCase())
    );
  }

  // Apply sort filter
  if (sort) {
    switch (sort) {
      case 'Price':
        return filteredData.sort((a, b) => a.amount - b.amount);
      case 'Latest':
        return filteredData.sort((a, b) =>
          dayjs(a.createdAt).isAfter(dayjs(b.createdAt), 'date') ? -1 : 1
        );
      case 'Status':
        return filteredData.sort((a, b) => (a.status === 'draft' ? -1 : 1));
      default:
        return filteredData;
    }
  }

  return filteredData;
}
