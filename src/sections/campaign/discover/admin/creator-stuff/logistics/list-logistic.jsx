import React from 'react';
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Table,
  Stack,
  Avatar,
  TableRow,
  MenuItem,
  TableCell,
  TableHead,
  TableBody,
  TableContainer,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { changeStatus } from 'src/api/logistic';
import { couriers } from 'src/contants/courier';

import { RHFSelect } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const ListLogistics = ({ logistics }) => {
  const methods = useForm({
    defaultValues: {
      status: '',
    },
  });

  const onChange = async (val, logisticId, campaignId) => {
    try {
      await changeStatus(val, logisticId);
      mutate(endpoints.campaign.getCampaignById(campaignId));
      enqueueSnackbar('Success');
    } catch (error) {
      enqueueSnackbar('Error', {
        variant: 'error',
      });
    }
  };

  return (
    <TableContainer sx={{ borderRadius: 1 }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <TableCell align="center">Item Name</TableCell>
            <TableCell align="center">Tracking Number</TableCell>
            <TableCell align="center">Courier</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logistics.length > 0 &&
            logistics
              .sort((a, b) => dayjs(a.createdAt).diff(b.createdAt, 'days'))
              .map((logistic) => (
                <TableRow key={logistic.id}>
                  <TableCell align="center">{logistic.itemName}</TableCell>
                  <TableCell align="center">{logistic.trackingNumber}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <Avatar
                        alt={logistic.courier}
                        src={
                          couriers.find((courier) => courier.name === logistic.courier)?.logo_url
                        }
                        sx={{ width: 25, height: 25 }}
                      />
                      {logistic.courier}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <FormProvider methods={methods}>
                      <RHFSelect
                        name="status"
                        label="Status"
                        size="small"
                        value={logistic.status}
                        onChange={(e) => onChange(e.target.value, logistic.id, logistic.campaignId)}
                      >
                        <MenuItem value="Pending">Pending</MenuItem>
                        <MenuItem value="Shipping">Shipping</MenuItem>
                        <MenuItem value="Shipped">Shipped</MenuItem>
                        <MenuItem value="Pending_Delivery_Confirmation">
                          Pending Delivery Confirmation
                        </MenuItem>
                      </RHFSelect>
                    </FormProvider>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ListLogistics;

ListLogistics.propTypes = {
  logistics: PropTypes.array,
};
