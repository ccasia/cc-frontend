import dayjs from 'dayjs';
import React, { useState } from 'react';

import {
  Box,
  Tab,
  Tabs,
  Stack,
  Select,
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
  const { invoices, isLoading } = useGetInvoicesByCreator();
  const [currentTab, setCurrentTab] = useState('all');
  const [sortBy, setSortBy] = useState('');

  const handleChange = (_, newValue) => {
    setCurrentTab(newValue);
  };

  const sortedData = applyFilter({
    inputData: invoices,
    sort: sortBy,
  });

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography
        variant="h2"
        sx={{ 
          mb: 0.2, 
          fontFamily: (theme) => theme.typography.fontSecondaryFamily,
          fontWeight: 'normal'
         }}
      >
        Invoices 🧾
      </Typography>

      <Box
        sx={{
          my: 3,
          position: 'relative',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleChange}
            sx={{
              '& .MuiTabs-indicator': {
                bgcolor: '#1340FF',
              },
            }}
          >
            <Tab label="All Invoices" value="all" />
          </Tabs>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: '40%',
            transform: 'translateY(-50%)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" color="text.secondary">
              Sort by:
            </Typography>
            <Select
              size="small"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              displayEmpty
              input={<InputBase />}
              renderValue={(selected) => <strong>{selected || 'Sort By'}</strong>}
              sx={{
                border: 1,
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                borderColor: 'divider',
                borderRadius: 1,
                '& .MuiSelect-select': {
                  pl: 2,
                  pr: 4,
                  py: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
              IconComponent={(props) => <Iconify icon="eva:chevron-down-fill" {...props} />}
            >
              <MenuItem value="Latest">
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={4}>
                  <Typography variant="subtitle2">Latest</Typography>
                  {sortBy === 'Latest' && <Iconify icon="ic:round-check" />}
                </Stack>
              </MenuItem>
              <MenuItem value="Status">
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={4}>
                  <Typography variant="subtitle2">Status</Typography>
                  {sortBy === 'Status' && <Iconify icon="ic:round-check" />}
                </Stack>
              </MenuItem>
              <MenuItem value="Price">
                <Stack direction="row" alignItems="center" justifyContent="space-between" gap={4}>
                  <Typography variant="subtitle2">Price</Typography>
                  {sortBy === 'Price' && <Iconify icon="ic:round-check" />}
                </Stack>
              </MenuItem>
            </Select>
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
              color: (theme) => theme.palette.common.black,
              strokeLinecap: 'round',
            }}
          />
        </Box>
      )}
    </Container>
  );
};

export default Invoice;

function applyFilter({ inputData, sort }) {
  if (sort) {
    switch (sort) {
      case 'Price':
        return inputData.sort((a, b) => a.amount - b.amount);
      case 'Latest':
        return inputData.sort((a, b) =>
          dayjs(a.issued).isAfter(dayjs(b.issued), 'date') ? -1 : 1
        );
      case 'Status':
        return inputData.sort((a, b) => (a.status === 'draft' ? -1 : 1));
      default:
        return inputData;
    }
  }

  return inputData;
}
