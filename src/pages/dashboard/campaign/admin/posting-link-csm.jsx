import useSWR from 'swr';
import { useParams } from 'react-router-dom';
import { useMemo , useState, useEffect, useContext } from 'react';

import { Box, Stack, Button, TextField, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';
import { SocketContext } from 'src/socket/context/socket';

export default function PostingLinkCSMView() {
  const { id: campaignId } = useParams();
  const { user } = useAuthContext();
  const socketCtx = useContext(SocketContext);
  const [link, setLink] = useState('');

  useEffect(() => {
    socketCtx?.socket?.joinCampaign?.(campaignId);
    return () => socketCtx?.socket?.leaveCampaign?.(campaignId);
  }, [campaignId, socketCtx?.socket]);

  const { data: submissions } = useSWR(
    campaignId ? `${endpoints.submission.root}/v3?campaignId=${campaignId}` : null
  );

  const posting = useMemo(() => (submissions || []).find((s) => s?.submissionType?.type === 'POSTING' && (s?.status === 'PENDING_REVIEW' || s?.status === 'IN_PROGRESS')), [submissions]);

  const onSubmit = async () => {
    if (!posting?.id || !link) return;
    await axiosInstance.post(`${endpoints.submission.root}/v3/posting/submit-link`, { submissionId: posting.id, link });
    setLink('');
  };

  return (
    <Box p={2}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Submit Posting Link (CSM)</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." fullWidth />
        <Button variant="contained" onClick={onSubmit} disabled={!link}>Submit</Button>
      </Stack>
    </Box>
  );
}

