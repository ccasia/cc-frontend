import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Table,
  Stack,
  Button,
  Dialog,
  Avatar,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import CampaignAgreementEdit from './campaign-agreement-edit';

// eslint-disable-next-line react/prop-types
const AgreementDialog = ({ open, onClose, url }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>Agreement</DialogTitle>
    <DialogContent>
      <iframe
        src={url}
        title="Agreement"
        style={{ width: '100%', height: '500px', border: 'none' }}
      />
    </DialogContent>
  </Dialog>
);

const CampaignAgreements = ({ campaign }) => {
  const { data, isLoading } = useGetAgreements(campaign?.id);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const dialog = useBoolean();
  const editDialog = useBoolean();
  const [selectedUrl, setSelectedUrl] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  const { user } = useAuthContext();

  const smUp = useResponsive('up', 'sm');
  const mdUp = useResponsive('up', 'md');

  const pendingCount = data?.filter((item) => !item.isSent).length || 0;
  const sentCount = data?.filter((item) => item.isSent).length || 0;

  const filteredData = useMemo(() => {
    if (selectedFilter === 'pending') {
      return data?.filter((item) => !item.isSent);
    }
    if (selectedFilter === 'sent') {
      return data?.filter((item) => item.isSent);
    }
    return data;
  }, [data, selectedFilter]);

  const handleViewAgreement = (url) => {
    setSelectedUrl(url);
    dialog.onTrue();
  };

  const handleEditAgreement = (agreement) => {
    setSelectedAgreement(agreement);
    editDialog.onTrue();
  };

  const handleSendAgreement = async (item) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.sendAgreement, item);
      mutate(endpoints.campaign.creatorAgreement(item?.campaignId));
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, { variant: 'error' });
    }
  };

  const isDisabled = useMemo(
    () =>
      user?.admin?.mode === 'advanced' ||
      !campaign?.campaignAdmin?.some((adminObj) => adminObj?.admin?.user?.id === user?.id),
    [user, campaign]
  );

  console.log('Button:', isDisabled);

  if (isLoading) {
    return <div>Loading...</div>; // A loading message while the data is being fetched
  }

  if (data.length < 1) {
    return <EmptyContent title="No agreements found" />;
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <Button
            fullWidth={!mdUp}
            onClick={() => setSelectedFilter('all')}
            sx={{
              px: 1.5,
              py: 2.5,
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              ...(selectedFilter === 'all'
                ? {
                    color: '#203ff5',
                    bgcolor: 'rgba(32, 63, 245, 0.04)',
                  }
                : {
                    color: '#637381',
                    bgcolor: 'transparent',
                  }),
              '&:hover': {
                bgcolor: selectedFilter === 'all' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            All
          </Button>

          <Button
            fullWidth={!mdUp}
            onClick={() => setSelectedFilter('pending')}
            sx={{
              px: 1.5,
              py: 2.5,
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              ...(selectedFilter === 'pending'
                ? {
                    color: '#203ff5',
                    bgcolor: 'rgba(32, 63, 245, 0.04)',
                  }
                : {
                    color: '#637381',
                    bgcolor: 'transparent',
                  }),
              '&:hover': {
                bgcolor: selectedFilter === 'pending' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            {`Pending (${pendingCount})`}
          </Button>

          <Button
            fullWidth={!mdUp}
            onClick={() => setSelectedFilter('sent')}
            sx={{
              px: 1.5,
              py: 2.5,
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'none',
              ...(selectedFilter === 'sent'
                ? {
                    color: '#203ff5',
                    bgcolor: 'rgba(32, 63, 245, 0.04)',
                  }
                : {
                    color: '#637381',
                    bgcolor: 'transparent',
                  }),
              '&:hover': {
                bgcolor: selectedFilter === 'sent' ? 'rgba(32, 63, 245, 0.04)' : 'transparent',
              },
            }}
          >
            {`Sent (${sentCount})`}
          </Button>
        </Stack>
      </Stack>

      <TableContainer
        sx={{
          width: '100%',
          minWidth: { xs: '100%', sm: 800 },
          position: 'relative',
          bgcolor: 'transparent',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Table size={smUp ? 'medium' : 'small'}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  py: { xs: 0.5, sm: 1 },
                  px: { xs: 1, sm: 2 },
                  color: '#221f20',
                  fontWeight: 600,
                  width: 270,
                  borderRadius: '10px 0 0 10px',
                  bgcolor: '#f5f5f5',
                  whiteSpace: 'nowrap',
                }}
              >
                Creator
              </TableCell>
              {smUp && (
                <TableCell
                  sx={{
                    py: 1,
                    color: '#221f20',
                    fontWeight: 600,
                    width: 270,
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Creator&apos;s Email
                </TableCell>
              )}
              <TableCell
                sx={{
                  py: 1,
                  color: '#221f20',
                  fontWeight: 600,
                  width: 170,
                  bgcolor: '#f5f5f5',
                  whiteSpace: 'nowrap',
                }}
              >
                Issue Date
              </TableCell>
              <TableCell
                sx={{
                  py: 1,
                  color: '#221f20',
                  fontWeight: 600,
                  width: 100,
                  bgcolor: '#f5f5f5',
                  whiteSpace: 'nowrap',
                }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{
                  py: 1,
                  color: '#221f20',
                  fontWeight: 600,
                  width: 100,
                  bgcolor: '#f5f5f5',
                  whiteSpace: 'nowrap',
                }}
              >
                Price
              </TableCell>
              <TableCell
                sx={{
                  py: 1,
                  color: '#221f20',
                  fontWeight: 600,
                  width: 80,
                  borderRadius: '0 10px 10px 0',
                  bgcolor: '#f5f5f5',
                  whiteSpace: 'nowrap',
                }}
              >
                Agreement PDF
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              filteredData?.map((item) => {
                // eslint-disable-next-line no-restricted-globals
                const isAmountValid = !isNaN(parseFloat(item?.amount?.toString()));
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 2 }}>
                        <Avatar
                          src={item?.user?.photoURL}
                          alt={item?.user?.name}
                          sx={{
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            border: '2px solid',
                            borderColor: 'background.paper',
                            boxShadow: (theme) => theme.customShadows.z8,
                          }}
                        >
                          {item?.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{item?.user?.name}</Typography>
                          {!smUp && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item?.user?.email}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </TableCell>
                    {smUp && <TableCell>{item?.user?.email}</TableCell>}
                    <TableCell>
                      <Stack spacing={0.5} alignItems="start">
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.875rem',
                          }}
                        >
                          {dayjs(item?.updatedAt).format('LL')}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#8e8e93',
                            display: 'block',
                            fontSize: '0.875rem',
                            mt: '-2px',
                          }}
                        >
                          {dayjs(item?.updatedAt).format('LT')}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '0.75rem',
                          border: '1px solid',
                          borderBottom: '3px solid',
                          borderRadius: 0.8,
                          bgcolor: 'white',
                          ...(item?.isSent
                            ? {
                                color: '#2e6b55',
                                borderColor: '#2e6b55',
                              }
                            : {
                                color: '#f19f39',
                                borderColor: '#f19f39',
                              }),
                        }}
                      >
                        {item?.isSent ? 'Sent' : 'Pending'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {isAmountValid ? `RM ${parseFloat(item?.amount?.toString())}` : 'Not set'}
                    </TableCell>
                    <TableCell>
                      {smUp ? (
                        <Stack direction="row" gap={1}>
                          <Button
                            onClick={() => handleViewAgreement(item?.agreementUrl)}
                            size="small"
                            variant="outlined"
                            sx={{
                              px: 1.5,
                              py: 2,
                              border: '1px solid #e7e7e7',
                              borderBottom: '3px solid #e7e7e7',
                              borderRadius: 1,
                              color: '#221f20',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: 'rgba(32, 63, 245, 0.04)',
                                border: '1px solid #e7e7e7',
                                borderBottom: '3px solid #e7e7e7',
                              },
                            }}
                          >
                            View
                          </Button>
                          <Button
                            onClick={() => handleEditAgreement(item)}
                            disabled={isDisabled}
                            size="small"
                            variant="outlined"
                            sx={{
                              px: 1.5,
                              py: 2,
                              border: '1px solid #e7e7e7',
                              borderBottom: '3px solid #e7e7e7',
                              borderRadius: 1,
                              color: '#221f20',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              textTransform: 'none',
                              whiteSpace: 'nowrap',
                              '&:hover': {
                                bgcolor: 'rgba(32, 63, 245, 0.04)',
                                border: '1px solid #e7e7e7',
                                borderBottom: '3px solid #e7e7e7',
                              },
                            }}
                          >
                            Edit Amount
                          </Button>
                          <Button
                            onClick={() => handleSendAgreement(item)}
                            size="small"
                            variant="outlined"
                            startIcon={<Iconify icon="bx:send" sx={{ color: '#835cf5' }} />}
                            disabled={isDisabled || !isAmountValid}
                            sx={{
                              px: 1.5,
                              py: 2,
                              border: '1px solid #e7e7e7',
                              borderBottom: '3px solid #e7e7e7',
                              borderRadius: 1,
                              color: '#835cf5',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: 'rgba(32, 63, 245, 0.04)',
                                border: '1px solid #e7e7e7',
                                borderBottom: '3px solid #e7e7e7',
                              },
                              '&.Mui-disabled': {
                                border: '1px solid #e7e7e7',
                                borderBottom: '3px solid #e7e7e7',
                                color: 'rgba(131, 92, 245, 0.5)',
                              },
                            }}
                          >
                            {item.isSent ? 'Resend' : 'Send'}
                          </Button>
                        </Stack>
                      ) : (
                        <Stack direction="row" gap={1}>
                          <IconButton onClick={() => handleViewAgreement(item?.agreementUrl)}>
                            <Iconify icon="hugeicons:view" />
                          </IconButton>
                          <IconButton
                            color="warning"
                            onClick={() => handleEditAgreement(item)}
                            disabled={isDisabled}
                          >
                            <Iconify icon="iconamoon:edit-light" />
                          </IconButton>
                          <IconButton
                            color={item.isSent ? 'warning' : 'primary'}
                            onClick={() => handleSendAgreement(item)}
                            disabled={isDisabled || !isAmountValid}
                          >
                            <Iconify icon="bx:send" />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <AgreementDialog open={dialog.value} onClose={dialog.onFalse} url={selectedUrl} />

      <CampaignAgreementEdit
        dialog={editDialog}
        agreement={selectedAgreement}
        campaign={campaign}
      />
    </Box>
  );
};

CampaignAgreements.propTypes = {
  campaign: PropTypes.any,
};

export default CampaignAgreements;
