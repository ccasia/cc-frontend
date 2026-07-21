import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Stack,
  Table,
  Avatar,
  TableRow,
  Collapse,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  CircularProgress,
} from '@mui/material';

import useGetBriefs from 'src/hooks/use-get-briefs';
import useGetBdOverview from 'src/hooks/use-get-bd-overview';

import Iconify from 'src/components/iconify';

import BriefPreviewDialog from 'src/sections/admin/dashboard-bd/brief-preview-dialog';

const STAGE_COLOR = {
  DRAFTED: '#9ca3af',
  SENT_TO_CLIENT: '#8A5AFE',
  PENDING_REVIEW: '#f59e0b',
  APPROVED: '#1ABF66',
  HANDED_OVER: '#1340FF',
  ACTIVE: '#38bdf8',
  LOST: '#FF3500',
};

const stageMatches = (brief, stageKey) => {
  if (stageKey === 'ACTIVE') return brief.draftStatus === 'HANDED_OVER' && brief.status === 'ACTIVE';
  if (stageKey === 'HANDED_OVER') return brief.draftStatus === 'HANDED_OVER' && brief.status !== 'ACTIVE';
  return brief.draftStatus === stageKey;
};

// Plain grouped number (0 renders as "0", unlike fCurrency/fNumber which return '').
const nf = (n) => Math.round(n || 0).toLocaleString('en-US');
const fmtMoney = (currency, amount) => `${currency} ${nf(amount)}`;

function PipelineByStage({ pipeline, briefs, onSelectBrief }) {
  const [openStage, setOpenStage] = useState(null);
  const max = Math.max(1, ...pipeline.map((s) => s.count));

  return (
    <Card sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%' }}>
      <Typography sx={{ fontWeight: 700, color: '#111827', mb: 0.25 }}>Pipeline by stage</Typography>
      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
        Click a stage to see its briefs.
      </Typography>

      <Stack spacing={0.5} sx={{ mt: 2 }}>
        {pipeline.map((stage) => {
          const isOpen = openStage === stage.key;
          // Computed unconditionally so the rows stay mounted through the exit
          // transition — gating on isOpen would empty the panel mid-animation.
          const rows = briefs.filter((b) => stageMatches(b, stage.key));
          return (
            <Box key={stage.key}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => setOpenStage(isOpen ? null : stage.key)}
                sx={{
                  py: 0.75,
                  px: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f9fafb' },
                }}
              >
                <Typography sx={{ width: 96, flexShrink: 0, fontSize: '0.82rem', color: '#374151' }}>
                  {stage.label}
                </Typography>
                <Box sx={{ flex: 1, height: 18, borderRadius: '999px', bgcolor: '#f3f4f6', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      height: '100%',
                      width: `${(stage.count / max) * 100}%`,
                      minWidth: stage.count > 0 ? 16 : 0,
                      borderRadius: '999px',
                      bgcolor: STAGE_COLOR[stage.key] || '#9ca3af',
                      background: `linear-gradient(90deg, #111827d8 0%, ${STAGE_COLOR[stage.key]} 100%)`
                    }}
                  />
                </Box>
                <Typography sx={{ width: 28, textAlign: 'right', fontWeight: 700, color: '#111827', fontSize: '0.85rem' }}>
                  {stage.count}
                </Typography>
                <Iconify
                  icon="eva:arrow-ios-forward-fill"
                  width={16}
                  sx={{ color: '#9ca3af', transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.15s' }}
                />
              </Stack>

              <Collapse in={isOpen} timeout={250} easing="cubic-bezier(0.4, 0, 0.2, 1)">
                <Stack spacing={0.25} sx={{ pl: 1, pb: 1 }}>
                  {rows.length === 0 ? (
                    <Typography variant="caption" sx={{ color: '#9ca3af', pl: 0.5, py: 0.5 }}>
                      No briefs in this stage.
                    </Typography>
                  ) : (
                    rows.map((b) => (
                      <Stack
                        key={b.id}
                        component="button"
                        type="button"
                        onClick={() => onSelectBrief(b)}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          py: 0.6,
                          px: 1,
                          width: '100%',
                          border: 0,
                          cursor: 'pointer',
                          borderRadius: 1,
                          textAlign: 'left',
                          bgcolor: 'transparent',
                          fontFamily: 'inherit',
                          '&:hover': { bgcolor: '#f3f4f6' },
                        }}
                      >
                        <Typography noWrap sx={{ fontSize: '0.8rem', color: '#111827', maxWidth: 220 }}>
                          {b.name || b.clientName || 'Untitled brief'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af', flexShrink: 0, ml: 1 }}>
                          {b.briefOwner?.name || '—'}
                        </Typography>
                      </Stack>
                    ))
                  )}
                </Stack>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

PipelineByStage.propTypes = {
  pipeline: PropTypes.array,
  briefs: PropTypes.array,
  onSelectBrief: PropTypes.func,
};

function PeopleTable({ people }) {
  const head = ['BD person', 'Sent', 'Pending', 'Converted', 'Lost', 'Conv. %'];
  return (
    <Card sx={{ p: 0, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none', height: '100%', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#f9fafb' }}>
            {head.map((h, i) => (
              <TableCell
                key={h}
                align={i === 0 ? 'left' : 'right'}
                sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', py: 1.25 }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {people.length === 0 ? (
            <TableRow>
              <TableCell colSpan={head.length} align="center" sx={{ py: 6, color: '#9ca3af', border: 0 }}>
                No BD activity in this range.
              </TableCell>
            </TableRow>
          ) : (
            people.map((p) => {
              const pct = p.convRate == null ? null : Math.round(p.convRate * 100);
              return (
                <TableRow key={p.userId} sx={{ '&:last-of-type td': { border: 0 } }}>
                  <TableCell sx={{ borderBottom: '1px solid #f3f4f6', py: 1.25 }}>
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <Avatar src={p.photoURL || undefined} sx={{ width: 28, height: 28, fontSize: '0.8rem', bgcolor: '#e5e7eb', color: '#374151' }}>
                        {p.name?.charAt(0)?.toUpperCase() || 'B'}
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>{p.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #f3f4f6', fontWeight: 700, color: '#111827' }}>
                    {p.sent}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                    {p.pending}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                    {p.converted}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #f3f4f6', color: p.lost > 0 ? '#FF3500' : '#6b7280' }}>
                    {p.lost}
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid #f3f4f6' }}>
                    <Box
                      component="span"
                      sx={{
                        px: 1,
                        py: 0.3,
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        bgcolor: pct == null ? '#f3f4f6' : '#e7f6ee',
                        color: pct == null ? '#9ca3af' : '#1e7e45',
                      }}
                    >
                      {pct == null ? '—' : `${pct}%`}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

PeopleTable.propTypes = {
  people: PropTypes.array,
};

function DealValue({ people, valueTotals, currency }) {
  // Real won/lost value from the selected currency bucket.
  const rows = useMemo(
    () =>
      people
        .map((p) => ({
          userId: p.userId,
          name: p.name,
          won: p.value?.[currency]?.wonAmount || 0,
          lost: p.value?.[currency]?.lostAmount || 0,
        }))
        .filter((r) => r.won > 0 || r.lost > 0)
        .sort((a, b) => b.won - a.won),
    [people, currency]
  );
  const totalWon = valueTotals?.[currency]?.wonAmount || 0;
  const max = Math.max(1, ...rows.map((r) => r.won));

  return (
    <Card sx={{ p: 3, borderRadius: 2, border: '1px solid #e5e7eb', boxShadow: 'none' }}>
      <Typography sx={{ fontWeight: 700, color: '#111827', mb: 0.25 }}>Deal value</Typography>
      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
        Won vs lost by BD person · {fmtMoney(currency, totalWon)} won team-wide. Values captured at handover.
      </Typography>

      {rows.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#9ca3af', mt: 3 }}>
          No deal value recorded for {currency} in this range yet. Won amounts are captured when a brief is handed over.
        </Typography>
      ) : (
        <Stack spacing={1.25} sx={{ mt: 2.5 }}>
          {rows.map((r) => (
            <Stack key={r.userId} direction="row" alignItems="center" spacing={2}>
              <Typography noWrap sx={{ width: 130, flexShrink: 0, fontSize: '0.82rem', color: '#374151' }}>
                {r.name}
              </Typography>
              <Box sx={{ flex: 1, height: 16, borderRadius: '999px', bgcolor: '#f3f4f6', overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${(r.won / max) * 100}%`,
                    minWidth: r.won > 0 ? 8 : 0,
                    borderRadius: '999px',
                    background: 'linear-gradient(90deg, #111827d8 0%, #1ABF66 100%)',
                  }}
                />
              </Box>
              <Typography sx={{ width: 120, textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>
                {fmtMoney(currency, r.won)}
              </Typography>
              <Typography sx={{ width: 90, textAlign: 'right', fontSize: '0.8rem', color: r.lost > 0 ? '#FF3500' : '#9ca3af' }}>
                −{nf(r.lost)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}

DealValue.propTypes = {
  people: PropTypes.array,
  valueTotals: PropTypes.object,
  currency: PropTypes.string,
};

const CURRENCIES = ['MYR', 'SGD'];

const BusinessDevelopmentTab = ({ dateRange }) => {
  const [currency, setCurrency] = useState('MYR');
  const [previewTarget, setPreviewTarget] = useState(null);

  const { pipeline, people, valueTotals, isLoading, mutate: mutateOverview } = useGetBdOverview(dateRange);
  // The pipeline drill-down needs the raw briefs list (current snapshot).
  const { briefs, mutate: mutateBriefs } = useGetBriefs();

  // A brief edited in the preview can change stage, which moves both the
  // pipeline counts and the drill-down list — refresh both.
  const refresh = () => {
    mutateOverview();
    mutateBriefs();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={20} sx={{ color: '#1340FF' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box>
            <Typography variant="body2" sx={{ color: '#9ca3af' }}>
              Brief pipeline, conversion and BD performance.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" sx={{ p: 0.4, borderRadius: '999px', bgcolor: '#f3f4f6', flexShrink: 0 }}>
          {CURRENCIES.map((c) => {
            const active = currency === c;
            return (
              <Box
                key={c}
                component="button"
                type="button"
                onClick={() => setCurrency(c)}
                sx={{
                  px: 2,
                  py: 0.5,
                  border: 0,
                  cursor: 'pointer',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  color: active ? '#111827' : '#9ca3af',
                  bgcolor: active ? '#fff' : 'transparent',
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  transition: 'color 0.15s, background-color 0.15s',
                }}
              >
                {c}
              </Box>
            );
          })}
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <PipelineByStage pipeline={pipeline} briefs={briefs} onSelectBrief={setPreviewTarget} />
        </Grid>
        <Grid item xs={12} md={7}>
          <PeopleTable people={people} />
        </Grid>
      </Grid>

      <DealValue people={people} valueTotals={valueTotals} currency={currency} />

      <BriefPreviewDialog
        open={Boolean(previewTarget)}
        brief={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onChanged={refresh}
      />
    </Box>
  );
};

export default BusinessDevelopmentTab;
