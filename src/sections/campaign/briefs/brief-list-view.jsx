import useSWR from 'swr';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { classifyBriefRole } from 'src/utils/brief-roles';
import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import EmptyContent from 'src/components/empty-content/empty-content';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import StatusBadge from './components/status-badge';
import HandoverDialog from './dialogs/handover-dialog';
import AssignCsmDialog from './dialogs/assign-csm-dialog';
import LostBriefDialog from './dialogs/lost-brief-dialog';
import InviteLinkDialog from './dialogs/invite-link-dialog';
import DeleteBriefDialog from './dialogs/delete-brief-dialog';
import SendToClientDialog from './dialogs/send-to-client-dialog';
import BriefApprovedDialog from './dialogs/brief-approved-dialog';

export default function CampaignBriefListView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const role = classifyBriefRole(user);
  const isSuperAdmin = role === 'superadmin';
  // Who may author briefs: BD, CSL, CSM, superadmin.
  const canCreate = ['BD', 'CSL', 'CSM', 'superadmin'].includes(role);
  // Who sees the full BD lifecycle toolset / tabs.
  const isBD = role === 'BD' || isSuperAdmin;
  // CSL (or superadmin) may assign CSMs.
  const canAssignCsm = role === 'CSL' || isSuperAdmin;
  // A brief authored by a CSL gets the direct assign-CSM shortcut at APPROVED.
  const isCslAuthored = (b) => b?.draftOrigin === 'CSL_CREATED';
  // A brief authored by a CSM finalizes into their own campaign at APPROVED —
  // no handover, no CSM selection.
  const isCsmAuthored = (b) => b?.draftOrigin === 'CSM_CREATED';
  // A brief the current user authored. For CSL/CSM, listBriefs only returns
  // pre-handover briefs they own (plus handed-over ones), so this identifies the
  // briefs they may drive through the lifecycle.
  const isMyBrief = (b) => Boolean(user?.id) && briefOwnerOf(b)?.id === user.id;

  const { data, isLoading, mutate } = useSWR(endpoints.campaignBrief.list, fetcher);

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('ALL');
  const [bdFilter, setBdFilter] = useState('ALL');
  const [sendTarget, setSendTarget] = useState(null);
  const [handoverTarget, setHandoverTarget] = useState(null);
  const [lostTarget, setLostTarget] = useState(null);
  const [assignCsmTarget, setAssignCsmTarget] = useState(null);
  const [approvedNotice, setApprovedNotice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [inviteLinkOpen, setInviteLinkOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Displayed status mirrors the badge: an activated campaign shows ACTIVE,
  // otherwise the draft lifecycle status.
  const effectiveStatus = (b) => (b.status === 'ACTIVE' ? 'ACTIVE' : b.draftStatus);

  // Resolve a brief's BD owner — prefer the enriched briefOwner, fall back to
  // the owner-role campaignAdmin (present pre-handover).
  const briefOwnerOf = (b) =>
    b.briefOwner ||
    (b.campaignAdmin?.[0]?.admin?.user
      ? { id: b.campaignAdmin[0].admin.user.id, name: b.campaignAdmin[0].admin.user.name }
      : null);

  // BD owner options (superadmin only) — distinct briefOwners across the list.
  const bdOptions = (() => {
    if (!isSuperAdmin) return [];
    const map = new Map();
    (data || []).forEach((b) => {
      const owner = briefOwnerOf(b);
      if (owner?.id && !map.has(owner.id)) map.set(owner.id, owner.name || 'Unknown');
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  })();

  const briefs = (data || []).filter((b) => {
    const status = effectiveStatus(b);

    // Status tab. "ALL" shows everything except activated campaigns — those
    // live only under the explicit ACTIVE tab.
    if (statusTab === 'ALL') {
      if (status === 'ACTIVE') return false;
      if (status === 'LOST') return false;
    } else if (status !== statusTab) {
      return false;
    }

    // BD owner filter (superadmin only).
    if (isSuperAdmin && bdFilter !== 'ALL' && briefOwnerOf(b)?.id !== bdFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      if (
        !(b.name || '').toLowerCase().includes(q) &&
        !(b.clientEmail || '').toLowerCase().includes(q) &&
        !(b.clientName || '').toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // Status tabs shown depend on role: BD/superadmin see the full lifecycle;
  // CSL/CSM only ever have handed-over/active briefs.
  const TAB_DEFS =
    isBD || role === 'CSL' || role === 'CSM'
      ? [
          { value: 'ALL', label: 'All' },
          { value: 'DRAFTED', label: 'Draft' },
          { value: 'SENT_TO_CLIENT', label: 'Sent' },
          { value: 'PENDING_REVIEW', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'HANDED_OVER', label: 'Handed Over' },
          { value: 'LOST', label: 'Lost' },
          { value: 'ACTIVE', label: 'Active' },
        ]
      : [
          { value: 'ALL', label: 'All' },
          { value: 'HANDED_OVER', label: 'Handed Over' },
          { value: 'LOST', label: 'Lost' },
          { value: 'ACTIVE', label: 'Active' },
        ];

  // Per-status counts (respect the BD filter, but not search or the active tab,
  // so each tab shows how many briefs it holds). "All" = everything but ACTIVE.
  const statusCounts = (() => {
    const counts = { ALL: 0 };
    (data || []).forEach((b) => {
      if (isSuperAdmin && bdFilter !== 'ALL' && briefOwnerOf(b)?.id !== bdFilter) return;
      const s = effectiveStatus(b);
      counts[s] = (counts[s] || 0) + 1;
      if (s !== 'ACTIVE') counts.ALL += 1;
    });
    return counts;
  })();

  const STATUS_TABS = TAB_DEFS.map((t) => ({ ...t, count: statusCounts[t.value] || 0 }));
  console.log(statusTab);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await axiosInstance.post(endpoints.campaignBrief.create);
      enqueueSnackbar('Brief created', { variant: 'success' });
      navigate(paths.dashboard.campaign.briefDetails(res.data.id));
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to create brief', {
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(endpoints.campaignBrief.delete(confirmDelete.id));
      enqueueSnackbar('Brief deleted', { variant: 'success' });
      setConfirmDelete(null);
      mutate();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete brief', {
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getOwnerName = (brief) =>
    brief.briefOwner?.name || brief.campaignAdmin?.[0]?.admin?.user?.name || 'Cult Creative';

  // Re-copy the client review link after the brief has been sent. The backend
  // builds it from the magic token (clientLink), so the BD isn't limited to the
  // one-shot copy in the "Brief Sent" dialog.
  const handleCopyClientLink = async (brief) => {
    if (!brief.clientLink) return;
    try {
      await navigator.clipboard.writeText(brief.clientLink);
      enqueueSnackbar('Client link copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Could not copy — select manually', { variant: 'warning' });
    }
  };

  // Shared wrapper for every action button (icon + labeled): white bg, light
  // grey border with an inset bottom "ledge" shadow. On hover the button
  // translates down by that 3px and the shadow collapses, giving a tactile 3D
  // press instead of a border-color change.
  const actionBtnSx = {
    borderRadius: 0.8,
    bgcolor: '#FFFFFF',
    border: '1px solid #E7E7E7',
    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
    transition: 'transform 0.08s ease, box-shadow 0.08s ease',
    '&:hover': {
      bgcolor: '#FFFFFF',
      border: '1px solid #E7E7E7',
      boxShadow: '0px 0px 0px 0px #E7E7E7 inset',
      transform: 'translateY(3px)',
    },
  };

  const labeledBtnSx = {
    ...actionBtnSx,
    fontWeight: 700,
    fontSize: 12,
    py: 0.5,
    px: 1.2,
    minWidth: 0,
    lineHeight: 1.4,
    color: '#1340FF',
    whiteSpace: 'nowrap',
  };

  // Per-row action button selection based on draftStatus + role.
  const renderActions = (brief) => {
    const status = brief.draftStatus;

    const editIcon = (
      <IconButton
        size="small"
        onClick={() => navigate(paths.dashboard.campaign.briefDetails(brief.id))}
        sx={actionBtnSx}
      >
        <Iconify icon="mdi:eye-outline" width={18} />
      </IconButton>
    );
    const sendIconBtn = (disabled = false) => (
      <IconButton
        size="small"
        disabled={disabled}
        onClick={() => setSendTarget(brief)}
        sx={{
          ...actionBtnSx,
          color: '#1340FF',
          '&.Mui-disabled': {
            color: '#9CA3AF',
            bgcolor: '#FFFFFF',
            border: '1px solid #E7E7E7',
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
          },
        }}
      >
        <Iconify icon="iconamoon:send-bold" width={18} />
      </IconButton>
    );
    const deleteIcon = (
      <IconButton
        size="small"
        onClick={() => setConfirmDelete(brief)}
        sx={{ ...actionBtnSx, color: '#DC2626' }}
      >
        <Iconify icon="material-symbols:delete-outline-rounded" width={18} />
      </IconButton>
    );
    // Re-copy the client review link (only present once a brief has been sent).
    const copyLinkIcon = brief.clientLink ? (
      <Tooltip title="Copy client link">
        <IconButton
          size="small"
          onClick={() => handleCopyClientLink(brief)}
          sx={{ ...actionBtnSx, color: '#1340FF' }}
        >
          <Iconify icon="solar:copy-bold" width={18} />
        </IconButton>
      </Tooltip>
    ) : null;
    const handoverBtn = (
      <Button
        size="small"
        variant="outlined"
        onClick={() => setHandoverTarget(brief)}
        sx={labeledBtnSx}
      >
        Handover
      </Button>
    );

    // CS (CSL/CSM) only sees handed-over briefs. View opens the campaign page;
    // CSL additionally gets an Assign CSM button.
    const viewCampaignBtn = (
      <Button
        size="small"
        variant="outlined"
        onClick={() => navigate(paths.dashboard.campaign.adminCampaignDetail(brief.id))}
        sx={labeledBtnSx}
      >
        View
      </Button>
    );
    const assignCsmBtn = (
      <Button
        size="small"
        variant="outlined"
        onClick={() => setAssignCsmTarget(brief)}
        sx={labeledBtnSx}
      >
        Assign CSM
      </Button>
    );
    // CSM finalizes their own brief into a campaign — reuses the assign dialog in
    // 'finalize' mode (derived from draftOrigin at the mount).
    const finalizeBtn = (
      <Button
        size="small"
        variant="outlined"
        onClick={() => setAssignCsmTarget(brief)}
        sx={labeledBtnSx}
      >
        Attach Client
      </Button>
    );
    const lostBtn = (
      <IconButton
        size="small"
        onClick={() => setLostTarget(brief)}
        sx={{ ...actionBtnSx, color: '#DC2626' }}
      >
        <Iconify icon="material-symbols:cancel-outline-rounded" width={18} />
      </IconButton>
    );

    // Non-BD authors (CSL/CSM) drive their own briefs through the lifecycle.
    // CSL additionally gets the direct Assign-CSM shortcut.
    if (!isBD) {
      const mineInProgress = isMyBrief(brief) && status !== 'HANDED_OVER';

      // CSL-authored brief at APPROVED → assign a CSM directly (self-handover).
      if (canAssignCsm && isCslAuthored(brief) && status === 'APPROVED') {
        return (
          <>
            {copyLinkIcon}
            {assignCsmBtn}
            {editIcon}
            {deleteIcon}
          </>
        );
      }
      // CSL/CSM author actions for their own in-progress brief.
      if (mineInProgress) {
        switch (status) {
          case 'DRAFTED':
            return (
              <>
                {sendIconBtn()}
                {editIcon}
                {lostBtn}
                {deleteIcon}
              </>
            );
          case 'SENT_TO_CLIENT':
            return (
              <>
                {copyLinkIcon}
                {sendIconBtn(true)}
                {editIcon}
                {lostBtn}
                {deleteIcon}
              </>
            );
          case 'PENDING_REVIEW':
            return (
              <>
                {copyLinkIcon}
                {sendIconBtn()}
                {editIcon}
                {lostBtn}
                {deleteIcon}
              </>
            );
          case 'APPROVED':
            // CSM-authored brief → the CSM finalizes it into their own campaign.
            // Otherwise (a CSM's BD_CREATED brief) → hand over to the CSL group.
            // (CSL-authored APPROVED is handled above.)
            return (
              <>
                {copyLinkIcon}
                {isCsmAuthored(brief) ? finalizeBtn : handoverBtn}
                {editIcon}
                {lostBtn}
                {deleteIcon}
              </>
            );
          default:
            return (
              <>
                {editIcon}
                {deleteIcon}
              </>
            );
        }
      }
      // Handed-over briefs: CSL can assign a CSM; everyone in CS opens the campaign.
      if (status === 'HANDED_OVER') {
        return (
          <>
            {canAssignCsm && assignCsmBtn}
            {viewCampaignBtn}
          </>
        );
      }
      return null;
    }
    switch (status) {
      case 'DRAFTED':
        return (
          <>
            {sendIconBtn()}
            {lostBtn}
            {deleteIcon}
          </>
        );
      case 'SENT_TO_CLIENT':
        return (
          <>
            {copyLinkIcon}
            {sendIconBtn(true)}
            {lostBtn}
            {deleteIcon}
          </>
        );
      case 'PENDING_REVIEW':
        // Public-form submission awaiting BD review → BD forwards to client
        // (Send), not a direct approve. Matches the brief detail-view CTA.
        return (
          <>
            {sendIconBtn()}
            {lostBtn}
            {deleteIcon}
          </>
        );
      case 'APPROVED':
        return (
          <>
            {copyLinkIcon}
            {handoverBtn}
            {lostBtn}
            {deleteIcon}
          </>
        );
      case 'HANDED_OVER':
        // Superadmin sees the full handed-over toolset (CS-side actions too).
        if (isSuperAdmin) {
          return (
            <>
              {assignCsmBtn}
              {viewCampaignBtn}
              {editIcon}
              {deleteIcon}
            </>
          );
        }
        return (
          <>
            {editIcon}
            {deleteIcon}
          </>
        );
        // case 'LOST':

      default:
          if (isSuperAdmin) {
          return (
            <>
              {editIcon}
              {deleteIcon}
            </>
          );
        }
        return (
          <>
            {editIcon}
          </>
        );
    }
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <CustomBreadcrumbs
          heading="Campaign Brief"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Campaign', href: paths.dashboard.campaign.root },
            { name: 'Briefs' },
          ]}
          sx={{ mb: 0 }}
        />
      </Stack>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
        gap={1}
        sx={{ mb: 2 }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {STATUS_TABS.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => setStatusTab(tab.value)}
              sx={{
                px: 1.25,
                py: 1.5,
                height: '38px',
                minWidth: 'auto',
                border: '1px solid #e7e7e7',
                borderBottom: '3px solid #e7e7e7',
                borderRadius: 1,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                ...(statusTab === tab.value
                  ? { color: '#203ff5', bgcolor: 'rgba(32, 63, 245, 0.04)' }
                  : { color: '#637381', bgcolor: 'transparent' }),
                '&:hover': {
                  bgcolor: statusTab === tab.value ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
                },
              }}
            >
              {`${tab.label} (${tab.count})`}
            </Button>
          ))}
        </Box>

        {canCreate && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flexShrink: 0 }}>
            <Button
              onClick={handleCreate}
              disabled={creating}
              sx={{
                px: 1.5,
                height: '38px',
                minWidth: 'auto',
                border: '1px solid #102387',
                borderBottom: '3px solid #102387',
                borderRadius: 1,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                color: '#FFFFFF',
                bgcolor: '#1340FF',
                '&:hover': { bgcolor: '#0F33CC' },
                '&.Mui-disabled': { bgcolor: '#1340FF', color: '#FFFFFF', opacity: 0.5 },
              }}
            >
              Create Brief
            </Button>
            {isBD && (
              <Button
                onClick={() => setInviteLinkOpen(true)}
                sx={{
                  px: 1.5,
                  height: '38px',
                  minWidth: 'auto',
                  border: '1px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  borderRadius: 1,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  color: '#1340FF',
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'rgba(19, 64, 255, 0.04)' },
                }}
              >
                Invite Link
              </Button>
            )}
          </Box>
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        sx={{ mb: 2 }}
      >
        {isSuperAdmin && bdOptions.length > 0 && (
          <Select
            value={bdFilter}
            onChange={(e) => setBdFilter(e.target.value)}
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          >
            <MenuItem value="ALL">All BDs</MenuItem>
            {bdOptions.map((bd) => (
              <MenuItem key={bd.id} value={bd.id}>
                {bd.name}
              </MenuItem>
            ))}
          </Select>
        )}
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={20} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Card sx={{ overflow: 'hidden' }}>
        {(() => {
          if (isLoading) {
            return (
              <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            );
          }
          if (briefs.length === 0) {
            return <EmptyContent title="No briefs yet" sx={{ py: 6 }} />;
          }
          return (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Brand Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Client Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>BD Owner</TableCell>
                    {statusTab === 'LOST' && (
                      <>
                        <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Reason</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Amount</TableCell>
                      </>
                    )}{' '}
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#6B7280' }} align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {briefs.map((b) => (
                    <TableRow
                      key={b.id}
                      hover
                      onClick={() => navigate(paths.dashboard.campaign.briefDetails(b.id))}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{b.name || '—'}</TableCell>
                      <TableCell>{b.clientEmail || '—'}</TableCell>
                      <TableCell>
                        {b.createdAt ? dayjs(b.createdAt).format('DD MMM YYYY') : '—'}
                      </TableCell>
                      <TableCell>{getOwnerName(b)}</TableCell>
                      {statusTab === 'LOST' && (
                        <>
                          <TableCell>{b.lostReason}</TableCell>
                          <TableCell>
                            {b.lostCurrency} {b.lostAmount}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <StatusBadge status={b.status === 'ACTIVE' ? 'ACTIVE' : b.draftStatus} />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                          alignItems="center"
                        >
                          {renderActions(b)}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          );
        })()}
      </Card>

      {/* Dialogs */}
      <SendToClientDialog
        open={Boolean(sendTarget)}
        brief={sendTarget}
        onClose={() => setSendTarget(null)}
        onSent={() => mutate()}
      />
      <HandoverDialog
        open={Boolean(handoverTarget)}
        brief={handoverTarget}
        onClose={() => setHandoverTarget(null)}
        onHandedOver={() => mutate()}
      />
      <AssignCsmDialog
        open={Boolean(assignCsmTarget)}
        brief={assignCsmTarget}
        mode={isCsmAuthored(assignCsmTarget) ? 'finalize' : 'assign'}
        onClose={() => setAssignCsmTarget(null)}
        onAssigned={() => mutate()}
      />
      <BriefApprovedDialog
        open={Boolean(approvedNotice)}
        brandName={approvedNotice?.name}
        mode="bd"
        onGoToBriefs={() => setApprovedNotice(null)}
        onClose={() => setApprovedNotice(null)}
      />
      <InviteLinkDialog open={inviteLinkOpen} onClose={() => setInviteLinkOpen(false)} />

      <DeleteBriefDialog
        open={Boolean(confirmDelete)}
        brandName={confirmDelete?.name}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
        loading={deleting}
      />

      <LostBriefDialog
        open={Boolean(lostTarget)}
        brief={lostTarget}
        onClose={() => setLostTarget(null)}
        onLost={() => mutate()}
      />
    </Container>
  );
}
