import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { pdf } from '@react-pdf/renderer';
import { FixedSizeList } from 'react-window';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';
import {
  Table,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  TableContainer,
  createFilterOptions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetInvoiceById from 'src/hooks/use-get-invoice';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { newBanks } from 'src/contants/banksv2';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import InvoicePDF from '../creator/invoice/invoice-pdf';
import InvoiceNewEditDetails from './invoice-new-edit-details';
import InvoiceNewEditAddress from './invoice-new-edit-address';
import InvoiceNewEditStatusDate from './invoice-new-edit-status-date';

// ----------------------------------------------------------------------

const reasons = [
  'Incorrect Account Holder Name',
  'Incorrect Account Number',
  'Incorrect Bank Name',
  'Others',
];

const LISTBOX_PADDING = 10;
const OuterElementContext = React.createContext({});

const ListboxComponent = React.forwardRef((props, ref) => {
  // eslint-disable-next-line react/prop-types
  const { children, ...other } = props;
  const items = React.Children.toArray(children);

  const itemCount = items.length;

  const itemSize = 60; // Adjust row height

  return (
    <div ref={ref} {...other}>
      <OuterElementContext.Provider value={other}>
        <FixedSizeList
          height={
            itemCount > 5 ? 5 * itemSize + LISTBOX_PADDING : itemCount * itemSize + LISTBOX_PADDING
          }
          width="100%"
          itemSize={itemSize}
          itemCount={itemCount}
          overscanCount={5}
        >
          {({ index, style }) => (
            <div style={{ ...style, top: style.top + LISTBOX_PADDING }}>{items[index]}</div>
          )}
        </FixedSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

export default function InvoiceNewEditForm({ id, creators }) {
  const { isLoading, invoice, mutate } = useGetInvoiceById(id);

  const { enqueueSnackbar } = useSnackbar();

  const loadingSend = useBoolean();

  const [loading, setLoading] = useState(true);

  const creatorList = creators?.campaign?.shortlisted?.map((creator) => ({
    id: creator.user.id,
    name: creator.user.name,
    email: creator.user.email,
    fullAddress: creator.user.creator.location,
    phoneNumber: creator.user.phoneNumber,
    company: creator.user.creator.employment,
    addressType: 'Home',
    primary: false,
    contactId: creator.user.creator.xeroContactId || null,
  }));

  const NewInvoiceSchema = Yup.object().shape({
    invoiceTo: Yup.mixed().nullable().required('Invoice to is required'),
    createDate: Yup.mixed().nullable().required('Create date is required'),
    dueDate: Yup.mixed()
      .required('Due date is required')
      .test(
        'date-min',
        'Due date must be later than create date',
        (value, { parent }) => value.getTime() > parent.createDate.getTime()
      ),
    items: Yup.lazy(() =>
      Yup.array().of(
        Yup.object({
          campaignName: Yup.string().required('Campaign name is required'),
          clientName: Yup.string().required('Client name is required'),
          // title: Yup.string().required('Title is required'),
          // service: Yup.string().required('Service is required'),
          quantity: Yup.number()
            .required('Quantity is required')
            .min(1, 'Quantity must be more than 0'),
        })
      )
    ),
    bankInfo: Yup.object().shape({
      accountNumber: Yup.string().required('Account number is required'),
      bankName: Yup.string().required('Bank name is required'),
      accountEmail: Yup.string().email('Must be a valid email').required('Email is required'),
      payTo: Yup.string().required('Pay to is required'),
    }),
    status: Yup.string().required('Status is required'),
    invoiceFrom: Yup.mixed(),
    totalAmount: Yup.number(),
    invoiceNumber: Yup.string(),
    reason: Yup.string().when('status', {
      is: (val) => val === 'rejected',
      then: (s) => s.required('Reason of rejection is required'),
      otherwise: (s) => s,
    }),
    otherReason: Yup.string().when('reason', {
      is: (val) => val === 'Others',
      then: (s) => s.required('Reason of rejection is required'),
      otherwise: (s) => s,
    }),
  });

  const generateRandomInvoiceNumber = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${randomNumber}`;
  };

  const defaultValues = useMemo(
    () => ({
      invoiceNumber: invoice?.invoiceNumber || generateRandomInvoiceNumber(),
      createDate: new Date(invoice?.createdAt) || new Date(),
      dueDate: new Date(invoice?.dueDate) || null,
      status: invoice?.status || 'draft',
      invoiceFrom: invoice?.invoiceFrom || null,
      invoiceTo: invoice?.invoiceTo || [
        {
          id: '1',
          primary: true,
          name: 'Cult Creative',
          email: 'support@cultcreative.asia',
          fullAddress:
            '4-402, Level 4, The Starling Mall, Lot 4-401 &, 6, Jalan SS 21/37, Damansara Utama, 47400 Petaling Jaya, Selangor',
          phoneNumber: '+60 11-5415 5751',
          company: 'Cult Creative',
          addressType: 'Hq',
        },
      ],
      items: [
        {
          ...invoice?.task,
          campaignName: invoice?.campaign?.name,
          clientName: invoice?.campaign?.company?.name || invoice?.campaign?.brand?.name,
        },
      ] || [
        {
          campaignName: '',
          clientName: '',
          // title: '',
          // description: '',
          service: '',
          quantity: 1,
          price: 0,
          total: 0,
        },
      ],
      bankInfo: invoice?.bankAcc || {
        bankName: '',
        payTo: '',
        accountNumber: '',
        accountEmail: '',
      },
      totalAmount: invoice?.amount || 0,
      reason: invoice?.creator?.user?.paymentForm?.reason || '',
      otherReason: invoice?.creator?.user?.paymentForm?.reason || '',
    }),
    [invoice]
  );

  const methods = useForm({
    resolver: yupResolver(NewInvoiceSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting, isValid },
    setValue,
  } = methods;

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
    reset(defaultValues);
  }, [defaultValues, isLoading, reset]);

  const handleCreateAndSend = handleSubmit(async (data) => {
    loadingSend.onTrue();
    let newContact;

    if (!invoice.creator.xeroContactId) {
      newContact = true;
    } else {
      newContact = false;
    }

    try {
      await axiosInstance.patch(endpoints.invoice.updateInvoice, {
        ...data,
        invoiceId: id,
        newContact,
        xeroContactId: invoice.creator.xeroContactId,
        reason: data.otherReason || data.reason,
        campaignId: invoice?.campaignId,
      });

      reset();
      mutate();
      loadingSend.onFalse();
      enqueueSnackbar('Invoice Updated Successfully !', { variant: 'success' });
    } catch (error) {
      loadingSend.onFalse();
      enqueueSnackbar('Failed to send invoice', { variant: 'error' });
    }
  });

  const values = watch();

  const filter = createFilterOptions();

  const bankAccount = (
    <Box>
      <Typography variant="h6" sx={{ color: 'text.disabled', mt: 3, ml: 2 }}>
        Bank Information:
      </Typography>
      <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ p: 3 }}>
        {/* <RHFSelect
          required
          name="bankInfo.bankName"
          label="Bank Name"
          InputLabelProps={{ shrink: true }}
          PaperPropsSx={{ textTransform: 'capitalize' }}
          value={values.bankInfo?.bankName}
        >
          {newBanks
            ?.flatMap((a) => a.banks)
            .map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
        </RHFSelect> */}

        <RHFAutocomplete
          name="bankInfo.bankName"
          ListboxComponent={ListboxComponent}
          selectOnFocus
          clearOnBlur
          options={newBanks?.flatMap((a) => a.banks) || []}
          getOptionLabel={(option) => option}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            return filtered;
          }}
          sx={{
            width: 1,
            '& .MuiInputBase-root': {
              bgcolor: 'white',
              borderRadius: 1,
              height: { xs: 40, sm: 48 },
            },
            '& .MuiInputLabel-root': {
              display: 'none',
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#B0B0B0',
              fontSize: { xs: '14px', sm: '16px' },
              opacity: 1,
            },
          }}
        />

        <RHFTextField
          label="Recipent Name"
          name="bankInfo.payTo"
          required
          fullWidth
          value={values.bankInfo?.payTo}
        />
        <RHFTextField label="Account Number" name="bankInfo.accountNumber" required fullWidth />
        <RHFTextField fullWidth required name="bankInfo.accountEmail" label="Account Email" />
      </Stack>
    </Box>
  );

  const handleDownload = async () => {
    try {
      const blob = await pdf(<InvoicePDF data={invoice} />).toBlob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${invoice?.invoiceNumber}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.log(err);
    }
  };

  const deliverablesInfo = (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Deliverables Information:
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableCell
              sx={{ borderTopLeftRadius: 10, borderBottomLeftRadius: 10, border: 'none' }}
              align="center"
            >
              Type of deliverables
            </TableCell>
            <TableCell
              sx={{ borderTopRightRadius: 10, borderBottomRightRadius: 10, border: 'none' }}
              align="center"
            >
              Quantity
            </TableCell>
          </TableHead>
          <TableBody>
            {invoice?.deliverables?.map((item) => (
              <TableRow>
                <TableCell align="center">
                  <Label>{item?.type}</Label>
                </TableCell>
                <TableCell align="center">{item?.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );

  console.log(invoice);
  return (
    <Stack spacing={1}>
      <Box sx={{ mb: 2, textAlign: 'end' }}>
        <LoadingButton
          variant="outlined"
          startIcon={<Iconify icon="material-symbols:download-rounded" width={18} />}
          onClick={handleDownload}
        >
          Download Invoice
        </LoadingButton>
      </Box>

      <FormProvider methods={methods}>
        <Card sx={{ p: 1 }}>
          <InvoiceNewEditAddress creators={creatorList} />

          <InvoiceNewEditStatusDate />

          {bankAccount}

          {invoice?.deliverables?.length && deliverablesInfo}

          <InvoiceNewEditDetails />

          <Stack
            justifyContent="flex-end"
            direction={{ sm: 'column', md: 'row' }}
            gap={2}
            sx={{ mt: 3 }}
            alignItems="end"
          >
            {values?.status === 'rejected' && (
              <>
                {invoice?.creator?.user?.paymentForm?.status === 'rejected' ? (
                  <Box width={1} alignSelf="center" ml={2}>
                    <Typography variant="subtitle1">
                      Reason: {invoice?.creator?.user?.paymentForm?.reason}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {values?.reason !== 'Others' ? (
                      <RHFSelect
                        fullWidth
                        name="reason"
                        label="Reason for Rejection"
                        InputLabelProps={{ shrink: true }}
                        PaperPropsSx={{ textTransform: 'capitalize' }}
                      >
                        {reasons.map((option, index) => (
                          <MenuItem key={index} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </RHFSelect>
                    ) : (
                      <Stack direction="row" width={1} spacing={1} alignItems="center">
                        <Tooltip title="Back">
                          <IconButton onClick={() => setValue('reason', '')}>
                            <Iconify icon="majesticons:arrow-left" width={18} />
                          </IconButton>
                        </Tooltip>
                        <RHFTextField
                          name="otherReason"
                          placeholder="Others - Reason for Rejection"
                        />
                      </Stack>
                    )}
                  </>
                )}
              </>
            )}

            {invoice?.status !== 'paid' && (
              <LoadingButton
                size="large"
                variant="outlined"
                loading={loadingSend.value && isSubmitting}
                onClick={handleCreateAndSend}
                sx={{
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  width: 180,
                }}
                disabled={!isValid}
              >
                {invoice ? 'Update' : 'Create'} & Send
              </LoadingButton>
            )}
          </Stack>

          {/* {invoice?.status !== 'paid' && (
            <Stack
              justifyContent="flex-end"
              direction={{ sm: 'column', md: 'row' }}
              gap={2}
              sx={{ mt: 3 }}
              alignItems="end"
            >
              {values?.status !== 'rejected' ? (
                <>
                  {values?.reason !== 'Others' ? (
                    <RHFSelect
                      fullWidth
                      name="reason"
                      label="Reason for Rejection"
                      InputLabelProps={{ shrink: true }}
                      PaperPropsSx={{ textTransform: 'capitalize' }}
                    >
                      {reasons.map((option, index) => (
                        <MenuItem key={index} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  ) : (
                    <Stack direction="row" width={1} spacing={1} alignItems="center">
                      <Tooltip title="Back">
                        <IconButton onClick={() => setValue('reason', '')}>
                          <Iconify icon="majesticons:arrow-left" width={18} />
                        </IconButton>
                      </Tooltip>
                      <RHFTextField
                        name="otherReason"
                        placeholder="Others - Reason for Rejection"
                      />
                    </Stack>
                  )}
                </>
              ) : (
                <Box width={1} alignSelf="center" ml={2}>
                  <Typography variant="subtitle1">
                    Reason: {invoice?.creator?.user?.paymentForm?.reason}
                  </Typography>
                </Box>
              )}

              <LoadingButton
                size="large"
                variant="outlined"
                loading={loadingSend.value && isSubmitting}
                onClick={handleCreateAndSend}
                sx={{
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                  width: 180,
                }}
                disabled={!isValid}
              >
                {invoice ? 'Update' : 'Create'} & Send
              </LoadingButton>
            </Stack>
          )} */}
        </Card>
      </FormProvider>
    </Stack>
  );
}

InvoiceNewEditForm.propTypes = {
  id: PropTypes.string,
  creators: PropTypes.object,
};
