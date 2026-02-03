import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Stack,
  Table,
  Button,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  TableContainer,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetCreditTiers from 'src/hooks/use-get-credit-tiers';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import CreditTierEdit from '../credit-tier-edit';
import CreditTierCreate from '../credit-tier-create';
import CreditTierTableRow from '../credit-tier-table-row';

// ----------------------------------------------------------------------

const SortableHeader = ({ column, label, align, isFirst, isLast, sortColumn, sortDirection, onSort }) => {
  const getBorderRadius = () => {
    if (isFirst) return '10px 0 0 10px';
    if (isLast) return '0 10px 10px 0';
    return 0;
  };

  return (
    <TableCell
      onClick={() => onSort(column)}
      sx={{
        py: 1,
        px: 2,
        color: '#221f20',
        fontWeight: 600,
        bgcolor: '#f5f5f5',
        whiteSpace: 'nowrap',
        fontSize: '0.875rem',
        cursor: 'pointer',
        borderRadius: getBorderRadius(),
        '&:hover': {
          bgcolor: '#ebebeb',
        },
      }}
      align={align}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={align === 'center' ? 'center' : 'flex-start'}>
        {label}
        {sortColumn === column && (
          <Iconify
            icon={sortDirection === 'asc' ? 'eva:arrow-upward-fill' : 'eva:arrow-downward-fill'}
            width={16}
            sx={{ color: '#1340FF' }}
          />
        )}
      </Stack>
    </TableCell>
  );
};

SortableHeader.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  align: PropTypes.string,
  isFirst: PropTypes.bool,
  isLast: PropTypes.bool,
  sortColumn: PropTypes.string.isRequired,
  sortDirection: PropTypes.string.isRequired,
  onSort: PropTypes.func.isRequired,
};

SortableHeader.defaultProps = {
  align: 'left',
  isFirst: false,
  isLast: false,
};

// ----------------------------------------------------------------------

const defaultFilters = {
  name: '',
};

const CreditTierView = () => {
  const { data, isLoading, mutate } = useGetCreditTiers();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('minFollowers');
  const [sortDirection, setSortDirection] = useState('asc');

  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState(defaultFilters);

  const canReset = !isEqual(defaultFilters, filters);

  const handleEditRow = useCallback((row) => {
    setEditItem(row);
    setOpenEdit(true);
  }, []);

  useEffect(() => {
    if (!isLoading && data) {
      setTableData(data);
    }
  }, [data, isLoading]);

  // Handle column sort click
  const handleColumnSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const filteredData = React.useMemo(() => {
    let filtered = [...(tableData || [])];

    // Search filter
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((tier) => tier?.name?.toLowerCase().includes(query));
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'minFollowers':
          comparison = (a.minFollowers || 0) - (b.minFollowers || 0);
          break;
        case 'maxFollowers':
          comparison = (a.maxFollowers || Infinity) - (b.maxFollowers || Infinity);
          break;
        case 'creditsPerVideo':
          comparison = (a.creditsPerVideo || 0) - (b.creditsPerVideo || 0);
          break;
        case 'isActive':
          comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [tableData, searchQuery, sortColumn, sortDirection]);

  if (isLoading) {
    return (
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
    );
  }

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Credit Tier Management"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Credit Tier' },
          { name: 'Lists' },
        ]}
        action={
          <Button
            onClick={() => setOpenCreate(true)}
            startIcon={<Iconify icon="mingcute:add-fill" width={16} />}
            sx={{
              bgcolor: '#FFFFFF',
              border: '1.5px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1.15,
              color: '#1340FF',
              height: 44,
              px: 2.5,
              fontWeight: 600,
              fontSize: '0.85rem',
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: 'rgba(19, 64, 255, 0.08)',
                border: '1.5px solid #1340FF',
                borderBottom: '3px solid #1340FF',
                color: '#1340FF',
              },
            }}
          >
            Create new Credit Tier
          </Button>
        }
        sx={{
          mb: 2,
        }}
      />

      <Box sx={{ width: '100%' }}>
        {/* Search Bar */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <TextField
            placeholder="Search by tier name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: 300,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#FFFFFF',
                border: '1.5px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1.15,
                height: 44,
                fontSize: '0.85rem',
                '& fieldset': {
                  border: 'none',
                },
                '&.Mui-focused': {
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                },
              },
              '& .MuiOutlinedInput-input': {
                py: 1.25,
                px: 0,
                color: '#637381',
                fontWeight: 600,
                '&::placeholder': {
                  color: '#637381',
                  opacity: 1,
                  fontWeight: 400,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: '#637381' }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Table */}
        <TableContainer
          sx={{
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            position: 'relative',
            bgcolor: 'transparent',
            borderBottom: '1px solid',
            borderColor: 'divider',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f5f5f5',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#d0d0d0',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: '#b0b0b0',
              },
            },
          }}
        >
          <Table size="medium" sx={{ minWidth: 800, width: '100%' }}>
            <TableHead>
              <TableRow>
                <SortableHeader column="name" label="Tier Name" isFirst sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="minFollowers" label="Min Followers" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="maxFollowers" label="Max Followers" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="creditsPerVideo" label="Credits/Video" align="center" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <TableCell
                  sx={{
                    py: 1,
                    px: 2,
                    color: '#221f20',
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                    fontSize: '0.875rem',
                  }}
                  align="center"
                >
                  Creators
                </TableCell>
                <SortableHeader column="isActive" label="Status" align="center" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="createdAt" label="Created At" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <TableCell
                  sx={{
                    py: 1,
                    px: 2,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 100,
                    borderRadius: '0 10px 10px 0',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData?.map((row) => (
                <CreditTierTableRow
                  key={row.id}
                  row={row}
                  onEditRow={() => handleEditRow(row)}
                  mutate={mutate}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Empty state */}
        {(!filteredData || filteredData.length === 0) && (
          <EmptyContent
            title="No credit tiers found"
            description={searchQuery ? 'Try adjusting your search query.' : 'Create your first credit tier to get started.'}
            sx={{ py: 10 }}
          />
        )}
      </Box>

      <CreditTierCreate open={openCreate} onClose={() => setOpenCreate(false)} mutate={mutate} />
      <CreditTierEdit
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setEditItem(null);
        }}
        item={editItem}
        mutate={mutate}
      />
    </Container>
  );
};

export default CreditTierView;
