import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Table,
  Button,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  Stack,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import useGetPackages from 'src/hooks/use-get-packges';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import EmptyContent from 'src/components/empty-content/empty-content';

import PackageEdit from '../package-edit';
import PackageCreate from '../package-create';
import PackageTableRow from '../package-table-row';

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
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        justifyContent={align === 'center' ? 'center' : 'flex-start'}
      >
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

const Packages = () => {
  const { data, isLoading, mutate } = useGetPackages();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [tableData, setTableData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleEditRow = useCallback((row) => {
    setEditItem(row);
    setOpenEdit(true);
  }, []);

  useEffect(() => {
    if (!isLoading && data) {
      setTableData(data);
    }
  }, [data, isLoading]);

  const getPriceAmount = useCallback((row, currency) => {
    const prices = row?.prices ?? [];
    const match = prices.find((p) => p?.currency === currency);
    const amount = match?.amount;
    return typeof amount === 'number' ? amount : Number(amount ?? 0);
  }, []);

  const handleColumnSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredData = useMemo(() => {
    let filtered = [...(tableData || [])];

    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((pkg) => pkg?.name?.toLowerCase().includes(query));
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'name':
          comparison = (a?.name || '').localeCompare(b?.name || '');
          break;
        case 'priceMYR':
          comparison = getPriceAmount(a, 'MYR') - getPriceAmount(b, 'MYR');
          break;
        case 'priceSGD':
          comparison = getPriceAmount(a, 'SGD') - getPriceAmount(b, 'SGD');
          break;
        case 'credits':
          comparison = (a?.credits || 0) - (b?.credits || 0);
          break;
        case 'validityPeriod':
          comparison = (a?.validityPeriod || 0) - (b?.validityPeriod || 0);
          break;
        case 'createdAt':
          comparison = new Date(a?.createdAt || 0).getTime() - new Date(b?.createdAt || 0).getTime();
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [getPriceAmount, searchQuery, sortColumn, sortDirection, tableData]);

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
        heading="Packages Information"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Packages' },
          { name: 'Lists' },
        ]}
        action={
          <Button
            onClick={() => setOpenCreate(true)}
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
            startIcon={<Iconify icon="mingcute:add-fill" width={16} />}
          >
            Create new Package
          </Button>
        }
        sx={{
          mb: 2,
        }}
      />

      {/* Search Bar (match Credit Tier Management design) */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by package name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: 340,
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
        <Scrollbar>
          <Table size="medium" sx={{ minWidth: 960, width: '100%' }}>
            <TableHead>
              <TableRow>
                <SortableHeader column="name" label="Name" isFirst sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="priceMYR" label="Price in MYR" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="priceSGD" label="Price in SGD" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="credits" label="UGC Credits" align="center" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="validityPeriod" label="Validity Period" align="center" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <SortableHeader column="createdAt" label="Created At" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleColumnSort} />
                <TableCell
                  sx={{
                    py: 1,
                    px: 2,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 110,
                    borderRadius: '0 10px 10px 0',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                />
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData?.map((row) => (
                <PackageTableRow key={row.id} row={row} onEditRow={() => handleEditRow(row)} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      {(!filteredData || filteredData.length === 0) && (
        <EmptyContent
          title="No packages found"
          description={searchQuery ? 'Try adjusting your search query.' : 'Create your first package to get started.'}
          sx={{ py: 10 }}
        />
      )}

      <PackageCreate open={openCreate} onClose={() => setOpenCreate(false)} />
      <PackageEdit
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

export default Packages;
