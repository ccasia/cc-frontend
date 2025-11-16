import useSWR, { mutate } from 'swr';
import { useParams } from 'react-router-dom';
import { useMemo , useEffect, useContext } from 'react';

import { Box, Stack, Button, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { SocketContext } from 'src/socket/context/socket';

export default function PostingLinkSuperadminView() {
  const { id: campaignId } = useParams();
  const socketCtx = useContext(SocketContext);

  useEffect(() => {
    socketCtx?.socket?.joinCampaign?.(campaignId);
    return () => socketCtx?.socket?.leaveCampaign?.(campaignId);
  }, [campaignId, socketCtx?.socket]);

  const { data: submissions } = useSWR(
    campaignId ? `${endpoints.submission.root}/v3?campaignId=${campaignId}` : null
  );

  const posting = useMemo(() => (submissions || []).find((s) => s?.submissionType?.type === 'POSTING' && (s?.status === 'SENT_TO_SUPERADMIN' || s?.status === 'SENT_TO_ADMIN' || s?.status === 'PENDING_REVIEW' || s?.status === 'CLIENT_FEEDBACK')), [submissions]);

  const onApprove = async () => {
    if (!posting?.id) return;
    await axiosInstance.post(`${endpoints.submission.root}/v3/posting/superadmin/approve`, { submissionId: posting.id });
    mutate((key) => typeof key === 'string' && key.includes(endpoints.submission.root) && key.includes(`campaignId=${campaignId}`));
  };
  const onReject = async () => {
    if (!posting?.id) return;
    await axiosInstance.post(`${endpoints.submission.root}/v3/posting/superadmin/reject`, { submissionId: posting.id });
    mutate((key) => typeof key === 'string' && key.includes(endpoints.submission.root) && key.includes(`campaignId=${campaignId}`));
  };

  useEffect(() => {
    if (!socketCtx?.socket) return;
    const handler = () => {
      mutate((key) => typeof key === 'string' && key.includes(endpoints.submission.root) && key.includes(`campaignId=${campaignId}`));
    };
    socketCtx.socket.on('v3:campaign:updated', handler);
    socketCtx.socket.on('v2:campaign:updated', handler);
    return () => {
      socketCtx.socket.off('v3:campaign:updated', handler);
      socketCtx.socket.off('v2:campaign:updated', handler);
    };
  }, [socketCtx?.socket, campaignId]);

  return (
    <Box p={2}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Review Posting Link (Superadmin)</Typography>
      <Stack direction="row" spacing={1.5}>
        <Button variant="contained" color="success" onClick={onApprove} disabled={!posting}>Approve</Button>
        <Button variant="outlined" color="error" onClick={onReject} disabled={!posting}>Reject</Button>
      </Stack>
    </Box>
  );
}

