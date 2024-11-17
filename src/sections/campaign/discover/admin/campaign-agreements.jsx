import dayjs from 'dayjs';
import { mutate } from 'swr';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Table,
  Stack,
  Button,
  Dialog,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Label from 'src/components/label';
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

  const dialog = useBoolean();
  const editDialog = useBoolean();
  const [selectedUrl, setSelectedUrl] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState(null);

  const smUp = useResponsive('up', 'sm');

  const handleViewAgreement = (url) => {
    setSelectedUrl(url);
    dialog.onTrue();
  };

  const handleEditAgreement = (agreement) => {
    setSelectedAgreement(agreement);
    editDialog.onTrue();
  };

  if (!isLoading && data.length < 1) {
    return <EmptyContent title="No agreements found" />;
  }

  const handleSendAgreement = async (item) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.sendAgreement, item);
      mutate(endpoints.campaign.creatorAgreement(item?.campaignId));
      enqueueSnackbar(res?.data?.message);
    } catch (error) {
      enqueueSnackbar(error?.message, { variant: 'error' });
    }
  };

  return (
    <Box>
      <TableContainer sx={{ borderRadius: 2 }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Creator&apos;s name</TableCell>
              <TableCell>Creator&apos;s email</TableCell>
              <TableCell>Last update</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount (RM)</TableCell>
              <TableCell>Agreement PDF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              data.map((item) => {
                // eslint-disable-next-line no-restricted-globals
                const isAmountValid = !isNaN(parseFloat(item?.amount?.toString()));
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item?.user?.name}</TableCell>
                    <TableCell>{item?.user?.email}</TableCell>
                    <TableCell>
                      <ListItemText
                        primary={dayjs(item?.updatedAt).format('LL')}
                        secondary={dayjs(item?.updatedAt).format('LT')}
                        primaryTypographyProps={{ typography: 'body2', noWrap: true }}
                        secondaryTypographyProps={{
                          mt: 0.5,
                          component: 'span',
                          typography: 'caption',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {item?.isSent ? (
                        <Label color="success">Sent</Label>
                      ) : (
                        <Label color="warning">Pending</Label>
                      )}
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
                            startIcon={<Iconify icon="hugeicons:view" />}
                          >
                            View
                          </Button>
                          <Button
                            onClick={() => handleEditAgreement(item)}
                            size="small"
                            variant="outlined"
                            startIcon={<Iconify icon="iconamoon:edit-light" />}
                            sx={{ whiteSpace: 'nowrap', padding: '6px 16px', borderRadius: '4px' }}
                          >
                            Payment Amount
                          </Button>
                          <Button
                            onClick={() => handleSendAgreement(item)}
                            size="small"
                            variant="outlined"
                            startIcon={<Iconify icon="bx:send" />}
                            color={item.isSent ? 'warning' : 'primary'}
                            disabled={!isAmountValid}
                          >
                            {item.isSent ? 'Resend' : 'Send'}
                          </Button>
                        </Stack>
                      ) : (
                        <Stack direction="row" gap={1}>
                          <IconButton onClick={() => handleViewAgreement(item?.agreementUrl)}>
                            <Iconify icon="hugeicons:view" />
                          </IconButton>
                          <IconButton color="warning" onClick={() => handleEditAgreement(item)}>
                            <Iconify icon="iconamoon:edit-light" />
                          </IconButton>
                          <IconButton
                            color={item.isSent ? 'warning' : 'primary'}
                            onClick={() => handleSendAgreement(item)}
                            disabled={!isAmountValid}
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
