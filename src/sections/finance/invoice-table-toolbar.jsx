import PropTypes from 'prop-types';
import { memo, useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import usePopover from 'src/components/custom-popover/use-popover';
import CustomPopover from 'src/components/custom-popover/custom-popover';

// ----------------------------------------------------------------------

const filterButtonSx = {
  height: 44,
  border: '1px solid',
  borderBottom: '3.5px solid',
  borderColor: 'divider',
  borderRadius: 1.5,
  bgcolor: 'background.paper',
  color: 'text.secondary',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  px: 1.5,
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: 'action.hover' },
};

function InvoiceTableToolbar({
  filters,
  onFilters,
  campaignOptions = [],
  selectedCampaigns = [],
  onFilterCampaigns,
  dateRange,
  onDatePreset,
  onExportCSV,
}) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const campaignPopover = usePopover();
  const datePopover = usePopover();

  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleToggleCampaign = useCallback(
    (campaignName) => {
      const newSelected = selectedCampaigns.includes(campaignName)
        ? selectedCampaigns.filter((c) => c !== campaignName)
        : [...selectedCampaigns, campaignName];
      onFilterCampaigns(newSelected);
    },
    [selectedCampaigns, onFilterCampaigns]
  );

  const handleClearCampaigns = useCallback(() => {
    onFilterCampaigns([]);
    setCampaignSearch('');
  }, [onFilterCampaigns]);

  const handleDatePreset = useCallback(
    (preset) => {
      onDatePreset(preset);
      datePopover.onClose();
    },
    [onDatePreset, datePopover]
  );

  const handleCustomRange = useCallback(() => {
    datePopover.onClose();
    dateRange?.onOpen();
  }, [datePopover, dateRange]);

  const filteredCampaignOptions = useMemo(
    () =>
      campaignOptions.filter((name) =>
        name.toLowerCase().includes(campaignSearch.toLowerCase())
      ),
    [campaignOptions, campaignSearch]
  );

  // Determine date button label
  const dateLabel = useMemo(() => {
    if (!dateRange?.selected) return 'Date';
    if (dateRange.presetLabel) return dateRange.presetLabel;
    return dateRange.shortLabel;
  }, [dateRange]);

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{
        xs: 'column',
        md: 'row',
      }}
      sx={{
        px: 2.5,
        py: 1.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} flexGrow={1} sx={{ width: 1 }}>
        <Box
          sx={{
            flex: 1,
            border: '1px solid',
            borderBottom: '3.5px solid',
            borderColor: isSearchFocused ? '#1340ff' : 'divider',
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            height: 44,
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.2s ease',
          }}
        >
          <InputBase
            value={filters.name}
            onChange={handleFilterName}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search by Creator Name, Campaign Name or Invoice ID"
            startAdornment={
              <Iconify
                icon="eva:search-fill"
                sx={{ width: 20, height: 20, mr: 1, ml: 1.5, color: 'text.disabled', flexShrink: 0 }}
              />
            }
            sx={{
              width: '100%',
              height: '100%',
              color: 'text.primary',
              '& input': {
                py: 0,
                px: 0.5,
              },
            }}
          />
        </Box>

        {/* Campaign Filter Button */}
        <Button
          onClick={campaignPopover.onOpen}
          sx={{
            ...filterButtonSx,
            ...(selectedCampaigns.length > 0 && {
              borderColor: '#1340ff',
              color: '#1340ff',
            }),
          }}
          startIcon={<Iconify icon="solar:filter-bold" width={18} />}
        >
          Campaign
          {selectedCampaigns.length > 0 && (
            <Box
              component="span"
              sx={{
                ml: 0.75,
                width: 20,
                height: 20,
                minWidth: 20,
                borderRadius: '50%',
                bgcolor: '#1340ff',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {selectedCampaigns.length}
            </Box>
          )}
        </Button>

        <CustomPopover
          open={campaignPopover.open}
          onClose={campaignPopover.onClose}
          arrow="top-right"
          sx={{ width: 280, p: 0 }}
        >
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <InputBase
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
              placeholder="Search campaigns..."
              fullWidth
              startAdornment={
                <Iconify
                  icon="eva:search-fill"
                  sx={{ width: 18, height: 18, mr: 1, color: 'text.disabled', flexShrink: 0 }}
                />
              }
              sx={{
                height: 36,
                fontSize: '0.85rem',
                '& input': { py: 0 },
              }}
            />
          </Box>

          <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
            {filteredCampaignOptions.length === 0 ? (
              <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>
                No campaigns found
              </Typography>
            ) : (
              filteredCampaignOptions.map((name) => (
                <Box
                  key={name}
                  onClick={() => handleToggleCampaign(name)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1,
                    py: 0.25,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selectedCampaigns.includes(name)}
                    sx={{ p: 0.5 }}
                  />
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ ml: 0.5, flex: 1, fontSize: '0.85rem' }}
                  >
                    {name}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          {selectedCampaigns.length > 0 && (
            <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="small" color="error" onClick={handleClearCampaigns}>
                Clear ({selectedCampaigns.length})
              </Button>
            </Box>
          )}
        </CustomPopover>

        {/* Date Range Filter Button */}
        <Button
          onClick={datePopover.onOpen}
          sx={{
            ...filterButtonSx,
            ...(dateRange?.selected && {
              borderColor: '#1340ff',
              color: '#1340ff',
            }),
          }}
          startIcon={<Iconify icon="solar:calendar-bold" width={18} />}
        >
          {dateLabel}
        </Button>

        <CustomPopover
          open={datePopover.open}
          onClose={datePopover.onClose}
          arrow="top-right"
          sx={{ width: 180, p: 0 }}
        >
          <Box
            onClick={() => handleDatePreset('week')}
            sx={{
              px: 2,
              py: 1.25,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              '&:hover': { bgcolor: 'action.hover' },
              ...(dateRange?.presetLabel === 'This Week' && {
                color: '#1340ff',
                fontWeight: 600,
              }),
            }}
          >
            This Week
          </Box>
          <Box
            onClick={() => handleDatePreset('month')}
            sx={{
              px: 2,
              py: 1.25,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              '&:hover': { bgcolor: 'action.hover' },
              ...(dateRange?.presetLabel === 'This Month' && {
                color: '#1340ff',
                fontWeight: 600,
              }),
            }}
          >
            This Month
          </Box>
          <Divider />
          <Box
            onClick={handleCustomRange}
            sx={{
              px: 2,
              py: 1.25,
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Custom Range...
          </Box>
          {dateRange?.selected && (
            <>
              <Divider />
              <Box
                onClick={() => handleDatePreset('clear')}
                sx={{
                  px: 2,
                  py: 1.25,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'error.main',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                Clear Date
              </Box>
            </>
          )}
        </CustomPopover>

        {/* <Tooltip title="Print">
          <IconButton sx={iconButtonSx}>
            <Iconify icon="solar:printer-minimalistic-bold" />
          </IconButton>
        </Tooltip> */}

        {/* <Tooltip title="Import">
          <IconButton sx={iconButtonSx}>
            <Iconify icon="solar:import-bold" />
          </IconButton>
        </Tooltip> */}

        <Button
          onClick={onExportCSV}
          sx={filterButtonSx}
          startIcon={<Iconify icon="solar:export-bold" width={18} />}
        >
          Export
        </Button>
      </Stack>
    </Stack>
  );
}

InvoiceTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  campaignOptions: PropTypes.array,
  selectedCampaigns: PropTypes.array,
  onFilterCampaigns: PropTypes.func,
  dateRange: PropTypes.object,
  onDatePreset: PropTypes.func,
  onExportCSV: PropTypes.func,
};

// OPTIMIZED: Memoize component to prevent unnecessary re-renders when props haven't changed
export default memo(InvoiceTableToolbar);
