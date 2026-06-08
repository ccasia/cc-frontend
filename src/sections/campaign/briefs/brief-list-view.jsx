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

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content/empty-content';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

import StatusBadge from './components/status-badge';
import AssignCsmDialog from './dialogs/assign-csm-dialog';
import HandoverDialog from './dialogs/handover-dialog';
import InviteLinkDialog from './dialogs/invite-link-dialog';
import DeleteBriefDialog from './dialogs/delete-brief-dialog';
import SendToClientDialog from './dialogs/send-to-client-dialog';
import BriefApprovedDialog from './dialogs/brief-approved-dialog';

const CS_ROLE_NAMES = ['CSM', 'CSL', 'Customer Success Manager', 'CS Lead'];

const classifyRole = (user) => {
  if (!user) return 'other';
  if (user.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode || '')) return 'superadmin';
  const name = (user?.admin?.role?.name || '').toLowerCase();
  if (name === 'bd' || name.includes('business development') || name.includes('sales and marketing')) return 'BD';
  if (CS_ROLE_NAMES.some((n) => name === n.toLowerCase() || name.includes(n.toLowerCase()))) return 'CS';
  return 'other';
};

// CSL specifically (not CSM) — only CSL assigns CSMs to handed-over campaigns.
const isCslUser = (user) => {
  const name = (user?.admin?.role?.name || '').toLowerCase();
  return name === 'csl' || name.includes('cs lead');
};

export default function CampaignBriefListView() {
  const settings = useSettingsContext();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();

  const role = classifyRole(user);
  const isBD = role === 'BD' || role === 'superadmin';
  // CSL (or superadmin) may assign CSMs to handed-over campaigns.
  const canAssignCsm = isCslUser(user) || role === 'superadmin';

  const { data, isLoading, mutate } = useSWR(endpoints.campaignBrief.list, fetcher);

  const [search, setSearch] = useState('');
  const [sendTarget, setSendTarget] = useState(null);
  const [handoverTarget, setHandoverTarget] = useState(null);
  const [assignCsmTarget, setAssignCsmTarget] = useState(null);
  const [approvedNotice, setApprovedNotice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [inviteLinkOpen, setInviteLinkOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const briefs = (data || []).filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.name || '').toLowerCase().includes(q) ||
      (b.clientEmail || '').toLowerCase().includes(q) ||
      (b.clientName || '').toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await axiosInstance.post(endpoints.campaignBrief.create);
      enqueueSnackbar('Brief created', { variant: 'success' });
      navigate(paths.dashboard.campaign.briefDetails(res.data.id));
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to create brief', { variant: 'error' });
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
      enqueueSnackbar(error?.response?.data?.message || 'Failed to delete brief', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getOwnerName = (brief) =>
    brief.campaignAdmin?.[0]?.admin?.user?.name || 'Cult Creative';

  const handleApprove = async (brief) => {
    try {
      await axiosInstance.post(endpoints.campaignBrief.approve(brief.id));
      enqueueSnackbar('Brief approved', { variant: 'success' });
      mutate();
    } catch (error) {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to approve brief', { variant: 'error' });
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
      <IconButton size="small" onClick={() => setConfirmDelete(brief)} sx={{ ...actionBtnSx, color: '#DC2626' }}>
        <Iconify icon="material-symbols:delete-outline-rounded" width={18} />
      </IconButton>
    );
    const approveIcon = (
      <IconButton size="small" onClick={() => handleApprove(brief)} sx={{ ...actionBtnSx, color: '#15803D' }}>
        <Iconify icon="eva:checkmark-fill" width={18} />
      </IconButton>
    );
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

    if (!isBD) {
      // Once handed over, the brief is a real campaign. CSL can assign a CSM;
      // everyone in CS can open the campaign page.
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
        return <>{sendIconBtn()}{deleteIcon}</>;
      case 'SENT_TO_CLIENT':
        return <>{sendIconBtn(true)}{deleteIcon}</>;
      case 'PENDING_REVIEW':
        return <>{approveIcon}{deleteIcon}</>;
      case 'APPROVED':
        return <>{handoverBtn}{deleteIcon}</>;
      case 'HANDED_OVER':
        return <>{editIcon}{deleteIcon}</>;
      default:
        return <>{editIcon}{deleteIcon}</>;
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
        {isBD && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={creating}
              sx={{ bgcolor: '#1340FF', '&:hover': { bgcolor: '#0F33CC' }, textTransform: 'none' }}
            >
              Create Brief
            </Button>
            <Button
              variant="outlined"
              onClick={() => setInviteLinkOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Invite Link
            </Button>
          </Stack>
        )}
      </Stack>

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
        sx={{ mb: 2 }}
      />

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
                    <TableCell>{b.createdAt ? dayjs(b.createdAt).format('DD MMM YYYY') : '—'}</TableCell>
                    <TableCell>{getOwnerName(b)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={b.status === 'ACTIVE' ? 'ACTIVE' : b.draftStatus}
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
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
    </Container>
  );
}
