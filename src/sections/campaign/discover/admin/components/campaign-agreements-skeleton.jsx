import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';

import { useColumnOrder } from '../agreement-column-reorder';
import { getSkeletonCount, readCampaignCache } from './campaign-cache';
import {
  StaticToolbar,
  StaticSortButton,
  StaticFilterPill,
  StaticSearchField,
} from './static-list-toolbar';

const CHECKBOX_CELL_SX = { width: 28, minWidth: 28, pl: 1.5, pr: 0 };
const INDEX_CELL_SX = { width: 32, minWidth: 32, pl: 0.5, pr: 1.5, textAlign: 'center' };
const STATUS_CELL_PX = { xs: 0, sm: 2 };
const CHIP_HEIGHT = 31;

const HEADER_SX = {
  py: 1,
  color: '#221f20',
  fontWeight: 600,
  bgcolor: '#f5f5f5',
  whiteSpace: 'nowrap',
};

const COLUMN_LABELS = {
  creator: 'Creator',
  tier: 'Tier',
  outreach: 'Outreach',
  status: 'Status',
  budget: 'Budget',
  price: 'Price',
  receipt: 'Receipt',
};

const ROWS = [
  { name: 120, email: 160, tier: 64, outreach: 96, status: 112, amount: 72, cta: 132, view: true },
  { name: 96, email: 140, tier: 52, outreach: 80, status: 88, amount: 64, cta: 132, view: false },
  { name: 140, email: 176, tier: 70, outreach: 104, status: 120, amount: 80, cta: 96, view: true },
  { name: 104, email: 128, tier: 58, outreach: 88, status: 96, amount: 68, cta: 132, view: false },
  { name: 88, email: 150, tier: 66, outreach: 92, status: 104, amount: 76, cta: 96, view: true },
];

// Same look as the toolbar buttons with nothing ticked, which is how the page opens.
const ICON_BUTTON_SX = {
  width: 38,
  height: 38,
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
};

const BULK_SX = {
  ...ICON_BUTTON_SX,
  bgcolor: 'rgba(145, 158, 171, 0.24)',
  border: '1px solid #EDEDED',
  pb: '3px',
};

const ADDITIONAL_SX = {
  ...ICON_BUTTON_SX,
  background:
    'linear-gradient(0deg, #B0B0B1, #B0B0B1), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
  boxShadow: '0px -3px 0px 0px #0000001A inset',
  pb: '3px',
};

// Before the campaign loads, the last known campaign flags pick the columns.
function useFallbackColumns(campaignId) {
  const { columnOrder } = useColumnOrder();
  const cached = readCampaignCache(campaignId);
  return columnOrder.filter(
    (id) =>
      (id !== 'tier' || cached.isCreditTier) &&
      (id !== 'receipt' || cached.submissionVersion === 'v4')
  );
}

export default function CampaignAgreementsSkeleton({ columns: knownColumns, campaignId }) {
  const fallbackColumns = useFallbackColumns(campaignId);
  const columns = knownColumns ?? fallbackColumns;
  const count = getSkeletonCount(campaignId, 'agreementCount', { fallback: 5, max: 8 });
  const firstColumnSx = (id) => (id === columns[0] ? { pl: 0 } : {});

  const renderHeader = (id) => (
    <TableCell
      key={id}
      sx={{
        ...HEADER_SX,
        ...(id === 'creator' && {
          width: { xs: '25%', sm: 'auto' },
          minWidth: { xs: 120, sm: 'auto' },
        }),
        ...(id === 'status' && { px: STATUS_CELL_PX }),
        ...(id === 'receipt' && { textAlign: 'center' }),
        ...firstColumnSx(id),
      }}
    >
      {COLUMN_LABELS[id]}
    </TableCell>
  );

  const renderCell = (id, row) => {
    switch (id) {
      case 'creator':
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Skeleton
              variant="circular"
              sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, flexShrink: 0 }}
            />
            <Stack spacing={1} justifyContent="center" sx={{ height: 44 }}>
              <Skeleton width={row.name} height={14} />
              <Skeleton width={row.email} height={12} />
            </Stack>
          </Stack>
        );
      case 'tier':
        return (
          <Stack spacing={1}>
            <Skeleton width={row.tier} height={13} />
            <Skeleton width={row.tier - 12} height={13} />
          </Stack>
        );
      case 'outreach':
        return <Skeleton width={row.outreach} height={CHIP_HEIGHT} sx={{ borderRadius: 0.8 }} />;
      case 'status':
        return <Skeleton width={row.status} height={CHIP_HEIGHT} sx={{ borderRadius: 0.8 }} />;
      case 'budget':
        return <Skeleton width={row.amount} height={14} />;
      case 'price':
        return <Skeleton width={row.amount - 8} height={14} />;
      case 'receipt':
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Skeleton width={108} height={26} sx={{ borderRadius: 13 / 8 }} />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box aria-busy="true" aria-label="Loading">
      <Stack direction="column" spacing={2}>
        <StaticToolbar
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 1.5 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <StaticSearchField />
            <StaticSortButton />
            <StaticFilterPill>Outreach Status</StaticFilterPill>
            <StaticFilterPill>Agreement Status</StaticFilterPill>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={BULK_SX}>
              <Box
                component="img"
                src="/assets/icons/overview/group2People.svg"
                alt=""
                sx={{ width: 16, height: 16 }}
              />
            </Box>
            <Box sx={ADDITIONAL_SX}>
              <Box
                component="img"
                src="/assets/additional-ag.svg"
                alt=""
                sx={{ width: 14, height: 18 }}
              />
            </Box>
          </Stack>
        </StaticToolbar>

        <TableContainer sx={{ width: '100%', position: 'relative', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  padding="checkbox"
                  sx={{ ...CHECKBOX_CELL_SX, borderRadius: '10px 0 0 10px', bgcolor: '#f5f5f5' }}
                />
                <TableCell sx={{ ...INDEX_CELL_SX, bgcolor: '#f5f5f5' }} />
                {columns.map(renderHeader)}
                <TableCell
                  sx={{
                    ...HEADER_SX,
                    pr: 1,
                    width: { xs: '15%', sm: 'auto' },
                    minWidth: { xs: 70, sm: 'auto' },
                    borderRadius: '0 10px 10px 0',
                  }}
                >
                  Agreement PDF
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {Array.from({ length: count }, (_, index) => ROWS[index % ROWS.length]).map(
                (row, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox" sx={CHECKBOX_CELL_SX}>
                      <Skeleton width={16} height={16} sx={{ borderRadius: 0.4 }} />
                    </TableCell>
                    <TableCell sx={INDEX_CELL_SX}>
                      <Skeleton width={10} height={12} sx={{ mx: 'auto' }} />
                    </TableCell>
                    {columns.map((id) => (
                      <TableCell
                        key={id}
                        sx={{
                          ...(id === 'status' && { px: STATUS_CELL_PX }),
                          ...firstColumnSx(id),
                        }}
                      >
                        {renderCell(id, row)}
                      </TableCell>
                    ))}
                    <TableCell sx={{ pr: 0 }}>
                      <Stack direction="row" gap={1}>
                        {row.view && <Skeleton width={46} height={30} />}
                        <Skeleton width={row.cta} height={30} />
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}

CampaignAgreementsSkeleton.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string),
  campaignId: PropTypes.string,
};
