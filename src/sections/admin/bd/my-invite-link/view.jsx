import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import { enqueueSnackbar } from 'notistack';
import { QRCodeCanvas } from 'qrcode.react';

import Iconify from 'src/components/iconify';
import axiosInstance, { endpoints } from 'src/utils/axios';

export default function MyInviteLinkView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [rotating, setRotating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(endpoints.bd.myInviteLink);
      setData(res.data);
    } catch (err) {
      enqueueSnackbar('Failed to load invite link', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async () => {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    enqueueSnackbar('Link copied');
  };

  const rotate = async () => {
    setRotating(true);
    try {
      const res = await axiosInstance.post(endpoints.bd.rotateInviteLink);
      setData(res.data);
      enqueueSnackbar('New link generated — the old one no longer works');
      setRotateOpen(false);
    } catch (err) {
      enqueueSnackbar('Failed to rotate link', { variant: 'error' });
    } finally {
      setRotating(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">My invite link</Typography>
        <Typography color="text.secondary">
          Share this link or QR code with prospects. When they submit the brief, a draft campaign is
          created in your account.
        </Typography>
      </Stack>

      <Card sx={{ p: 3 }}>
        {loading && <Typography>Loading...</Typography>}
        {!loading && data && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField value={data.url} fullWidth InputProps={{ readOnly: true }} />
              <Tooltip title="Copy link">
                <IconButton onClick={copy}>
                  <Iconify icon="solar:copy-bold" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                p: 2,
                bgcolor: 'background.neutral',
                borderRadius: 1,
              }}
            >
              <QRCodeCanvas value={data.url} size={200} />
            </Box>

            <Stack direction="row" justifyContent="flex-end">
              <Button color="error" variant="outlined" onClick={() => setRotateOpen(true)}>
                Rotate link
              </Button>
            </Stack>
          </Stack>
        )}
      </Card>

      <Dialog open={rotateOpen} onClose={() => setRotateOpen(false)}>
        <DialogTitle>Rotate invite link?</DialogTitle>
        <DialogContent>
          <Typography>
            The current link will stop working immediately. Anyone who has it (including QR codes
            already shared) won't be able to submit. Only do this if you think the link has been
            leaked.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotateOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={rotate} disabled={rotating}>
            {rotating ? 'Rotating...' : 'Rotate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
