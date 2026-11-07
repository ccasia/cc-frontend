import PropTypes from 'prop-types';

import {
  Box,
  Stack,
  Table,
  Button,
  TableRow,
  Skeleton,
  TableBody,
  TableCell,
  IconButton,
  TableContainer,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { CHIP_HEIGHT } from 'src/components/status-chip';

import { getSkeletonCount } from './campaign-cache';
import { COLUMN_WIDTHS } from '../../client/v3-pitches/v3-pitch-row';
import {
  InlineBone,
  StaticToolbar,
  StaticSortButton,
  StaticFilterPill,
  StaticSearchField,
} from './static-list-toolbar';
import {
  CELL_SX,
  FieldBlock,
  AVATAR_SIZE,
  NAME_HEIGHT,
  HANDLE_LINE,
  VALUE_HEIGHT,
  VIEW_BUTTON_SX,
  ACTION_BUTTON_SX,
} from '../../master-list-row-kit';

const ROWS = [
  { name: 96, handle: 72, outreach: 104, rate: 40, tier: 76, followers: 36, type: 120, status: 84 },
  { name: 120, handle: 88, outreach: 92, rate: 36, tier: 64, followers: 44, type: 96, status: 104 },
  { name: 84, handle: 64, outreach: 112, rate: 44, tier: 84, followers: 32, type: 132, status: 92 },
  { name: 108, handle: 96, outreach: 96, rate: 40, tier: 70, followers: 40, type: 104, status: 76 },
  { name: 92, handle: 76, outreach: 104, rate: 36, tier: 78, followers: 38, type: 116, status: 96 },
];

// A loading value that keeps its line's real height, so nothing moves when the text lands.
function Line({ width, height = VALUE_HEIGHT }) {
  return (
    <Box sx={{ height, display: 'flex', alignItems: 'center' }}>
      <Skeleton width={width} height={Math.round(height * 0.7)} sx={{ borderRadius: 0.5 }} />
    </Box>
  );
}

Line.propTypes = { width: PropTypes.number, height: PropTypes.number };

const Chip = ({ width }) => (
  <Skeleton width={width} height={CHIP_HEIGHT} sx={{ borderRadius: 0.8 }} />
);

Chip.propTypes = { width: PropTypes.number };

function SkeletonRow({ row, showNotes }) {
  return (
    <TableRow sx={{ '&:first-of-type td': { borderTop: '1px solid #EBEBEB' } }}>
      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.index, px: 1 }}>
        <Skeleton width={6} height={11} sx={{ mx: 'auto', borderRadius: 0.5 }} />
      </TableCell>

      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.creator }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Skeleton
            variant="circular"
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            sx={{ flexShrink: 0 }}
          />
          <Stack spacing={0.5}>
            <Line width={row.name} height={NAME_HEIGHT} />
            <Line width={row.handle} height={HANDLE_LINE} />
            {showNotes && <Line width={64} height={18} />}
          </Stack>
        </Stack>
      </TableCell>

      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.outreach }}>
        <FieldBlock label="Outreach status" minHeight={CHIP_HEIGHT}>
          <Chip width={row.outreach} />
        </FieldBlock>
      </TableCell>

      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.engagement }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Engagement rate" minHeight={CHIP_HEIGHT}>
            <Line width={row.rate + 22} />
          </FieldBlock>
          <FieldBlock label="Tier">
            <Line width={row.tier} />
          </FieldBlock>
        </Stack>
      </TableCell>

      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.followers }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Followers" minHeight={CHIP_HEIGHT}>
            <Line width={row.followers + 22} />
          </FieldBlock>
          <FieldBlock label="Type">
            <Line width={row.type} />
          </FieldBlock>
        </Stack>
      </TableCell>

      <TableCell sx={{ ...CELL_SX, width: COLUMN_WIDTHS.status }}>
        <Stack spacing={0.5}>
          <FieldBlock label="Creator status" minHeight={CHIP_HEIGHT}>
            <Chip width={row.status} />
          </FieldBlock>
          <FieldBlock>
            <Line width={124} />
          </FieldBlock>
        </Stack>
      </TableCell>

      <TableCell align="right" sx={{ ...CELL_SX, width: COLUMN_WIDTHS.actions }}>
        <Stack spacing={0.75} alignItems="flex-end">
          <Button tabIndex={-1} sx={VIEW_BUTTON_SX}>
            View
          </Button>
          <Skeleton sx={{ ...ACTION_BUTTON_SX, p: 0 }} />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

SkeletonRow.propTypes = { row: PropTypes.object, showNotes: PropTypes.bool };

export default function CreatorMasterListSkeleton({ campaignId }) {
  const count = getSkeletonCount(campaignId, 'pitchCount', { fallback: 5, max: 8 });
  const { user } = useAuthContext();
  const smUp = useResponsive('up', 'sm');
  const mdUp = useResponsive('up', 'md');

  // Same rule as the real list; campaign admins also get notes, but that needs the campaign.
  const showNotes = user?.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode);

  return (
    <Box aria-busy="true" aria-label="Loading creators" sx={{ width: '100%', overflowX: 'auto' }}>
      <Stack spacing={2}>
        <StaticToolbar
          direction="row"
          spacing={1.5}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ width: '100%' }}
        >
          <StaticSearchField />
          <StaticSortButton />
          <StaticFilterPill>Outreach Status</StaticFilterPill>
          <StaticFilterPill>Creator Status</StaticFilterPill>
          {showNotes && (
            <StaticFilterPill chevron={false}>
              Unread notes ·<InlineBone />
            </StaticFilterPill>
          )}
          <Box sx={{ display: 'flex', ml: { xs: 0, sm: 'auto' }, flexShrink: 0 }}>
            {smUp ? (
              <Button
                tabIndex={-1}
                fullWidth={!mdUp}
                startIcon={<Iconify icon="fluent:people-add-28-filled" width={16} />}
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
                }}
              >
                Add New Creators
              </Button>
            ) : (
              <IconButton tabIndex={-1} sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                <Iconify icon="fluent:people-add-28-filled" width={18} />
              </IconButton>
            )}
          </Box>
        </StaticToolbar>

        <TableContainer sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Table
            size={smUp ? 'medium' : 'small'}
            sx={{ minWidth: { xs: 900, sm: 'auto' }, width: '100%' }}
          >
            <TableBody>
              {Array.from({ length: count }, (_, index) => (
                <SkeletonRow key={index} row={ROWS[index % ROWS.length]} showNotes={showNotes} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Box>
  );
}

CreatorMasterListSkeleton.propTypes = { campaignId: PropTypes.string };
