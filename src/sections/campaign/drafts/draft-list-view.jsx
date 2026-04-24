import useSWR from 'swr';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

import EmptyContent from 'src/components/empty-content/empty-content';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs/custom-breadcrumbs';

export default function DraftCampaignListView() {
  const settings = useSettingsContext();
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

  const subtitle = isSuperadmin
    ? 'All drafts created via BD invite links.'
    : 'Drafts created from your invite link.';

  return (
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <CustomBreadcrumbs
        heading="Draft Briefs"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Campaign', href: paths.dashboard.campaign.root },
          { name: 'Drafts' },
        ]}
        sx={{ mb: 1 }}
      />

      <Typography
        variant="body1"
        sx={{
          color: '#636366',
          mb: 3,
          maxWidth: 720,
        }}
      >
        {subtitle}
      </Typography>

      {isLoading && (
        <Box
          sx={{
            position: 'relative',
            py: 12,
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

      {!isLoading && !data?.length && (
        <EmptyContent
          filled
          title="No draft campaigns yet"
          description={subtitle}
          sx={{ py: 10, mt: 1 }}
        />
      )}

      {!isLoading && data?.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2, borderColor: 'divider' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ typography: 'subtitle2', color: 'text.secondary' }}>
                    Brand name
                  </TableCell>
                  <TableCell sx={{ typography: 'subtitle2', color: 'text.secondary' }}>
                    Industry
                  </TableCell>
                  <TableCell sx={{ typography: 'subtitle2', color: 'text.secondary' }}>
                    Created
                  </TableCell>
                  {isSuperadmin && (
                    <TableCell sx={{ typography: 'subtitle2', color: 'text.secondary' }}>
                      BD owner
                    </TableCell>
                  )}
                  <TableCell sx={{ typography: 'subtitle2', color: 'text.secondary' }}>
                    Missing fields
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ typography: 'subtitle2', color: 'text.secondary', width: 120 }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((campaign) => {
                  const missing = collectMissingBDDraftFields(campaign);
                  return (
                    <TableRow
                      key={campaign.id}
                      hover
                      onClick={() => navigate(paths.dashboard.campaign.draftDetails(campaign.id))}
                    >
                      <TableCell>
                        <Typography variant="subtitle2">{campaign.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {campaign.campaignBrief?.industries || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(campaign.createdAt).format('DD MMM YYYY')}
                        </Typography>
                      </TableCell>
                      {isSuperadmin && (
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {getOwnerName(campaign)}
                          </Typography>
                        </TableCell>
                      )}
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
                          onClick={() =>
                            navigate(paths.dashboard.campaign.draftDetails(campaign.id))
                          }
                          aria-label="Open draft"
                        >
                          <LaunchIcon fontSize="small" />
                        </IconButton>
                        {isSuperadmin && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(campaign);
                            }}
                            aria-label="Delete draft"
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
        </Card>
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
