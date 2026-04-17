import useSWR from 'swr';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import { Delete as DeleteIcon, Launch as LaunchIcon } from '@mui/icons-material';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { collectMissingBDDraftFields } from 'src/contants/bd-draft-fields';

export default function DraftCampaignListView() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading, mutate } = useSWR(endpoints.campaign.getDrafts, fetcher);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperadmin =
    user?.role === 'superadmin' || ['god', 'advanced'].includes(user?.admin?.mode || '');

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(endpoints.campaign.deleteDraft(confirmDelete.id));
      enqueueSnackbar('Draft deleted', { variant: 'success' });
      setConfirmDelete(null);
      mutate();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to delete draft', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getOwnerName = (campaign) => {
    const owner =
      campaign.campaignAdmin?.find((ca) => ca.role === 'owner') || campaign.campaignAdmin?.[0];
    return owner?.admin?.user?.name || '—';
  };

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Draft Briefs</Typography>
          <Typography variant="body2" color="text.secondary">
            {isSuperadmin
              ? 'All drafts created via BD invite links.'
              : 'Drafts created from your invite link.'}
          </Typography>
        </Box>
      </Stack>

      {isLoading && (
        <Stack alignItems="center" py={8}>
          <CircularProgress />
        </Stack>
      )}

      {!isLoading && !data?.length && (
        <Stack alignItems="center" py={8}>
          <Typography color="text.secondary">No draft campaigns yet.</Typography>
        </Stack>
      )}

      {!isLoading && data?.length > 0 && (
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Brand name</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Created</TableCell>
                {isSuperadmin && <TableCell>BD owner</TableCell>}
                <TableCell>Missing fields</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((campaign) => {
                const missing = collectMissingBDDraftFields(campaign);
                return (
                  <TableRow key={campaign.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{campaign.name}</Typography>
                    </TableCell>
                    <TableCell>{campaign.campaignBrief?.industries || '—'}</TableCell>
                    <TableCell>{dayjs(campaign.createdAt).format('DD MMM YYYY')}</TableCell>
                    {isSuperadmin && <TableCell>{getOwnerName(campaign)}</TableCell>}
                    <TableCell>
                      <Chip
                        size="small"
                        label={missing.length === 0 ? 'Ready' : `${missing.length} missing`}
                        color={missing.length === 0 ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => navigate(paths.dashboard.campaign.draftDetails(campaign.id))}
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                      {isSuperadmin && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmDelete(campaign)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete draft?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete <strong>{confirmDelete?.name}</strong>. This cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" onClick={handleDelete} disabled={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
