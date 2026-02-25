import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { pdf, PDFViewer } from '@react-pdf/renderer';
import { FixedSizeList } from 'react-window';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useMemo, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  alpha,
  Paper,
  Stack,
  Table,
  Button,
  Dialog,
  Divider,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetInvoiceById from 'src/hooks/use-get-invoice';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { newBanks } from 'src/contants/banksv2';
import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import InvoicePDF from './invoice-pdf';
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

const ListboxComponent = React.forwardRef((props, ref) => {
  // eslint-disable-next-line react/prop-types
  const { children, ...other } = props;
  const items = React.Children.toArray(children);

  const itemCount = items.length;
  const itemSize = 48;

  return (
    <div ref={ref} {...other}>
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
    </div>
  );
});

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
  reason: Yup.string().when('status', {
    is: 'rejected',
    then: (s) => s.required('Reason of rejection is required'),
  }),
});

export default function InvoiceNewEditForm({ id, creators, onClose, mutateInvoices, mutateStats }) {
  const { isLoading, invoice, mutate } = useGetInvoiceById(id);
  const { user } = useAuthContext();
  const dialog = useBoolean();
  const preview = useBoolean();
  const xeroLoading = useBoolean();
  const loadingSend = useBoolean();
  const { enqueueSnackbar } = useSnackbar();
  const smUp = useResponsive('up', 'sm');

  const creatorAgreement = useMemo(
    () => invoice?.user?.creatorAgreement?.find((i) => i.campaignId === invoice.campaignId),
    [invoice]
  );

  const xeroInformation = useMemo(() => user?.xeroinformation, [user]);

  const getTenant = useMemo(() => {
    const currency = creatorAgreement?.currency;
    const tenant = xeroInformation?.find(
      (item) => item?.orgData.baseCurrency.toLowerCase() === currency?.toLowerCase()
    );
    return tenant;
  }, [creatorAgreement, xeroInformation]);

  const creatorList = useMemo(
    () =>
      creators?.campaign?.shortlisted?.map((creator) => ({
        id: creator.user.id,
        name:
          invoice?.creator?.user?.paymentForm?.bankAccountName ||
          invoice?.bankAcc?.payTo ||
          creator.user.name,
        email: creator.user.email,
        fullAddress: creator.user.creator.location,
        phoneNumber: creator.user.phoneNumber,
        company: creator.user.creator.employment,
        addressType: 'Home',
        primary: false,
        contactId: creator.user.creator.xeroContactId || null,
      })),
    [creators, invoice]
  );

  const defaultValues = useMemo(
    () => ({
      invoiceNumber: invoice?.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      createDate: invoice?.createdAt ? new Date(invoice.createdAt) : new Date(),
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : null,
      status: invoice?.status || 'draft',
      invoiceFrom: invoice?.invoiceFrom || null,
      invoiceTo: invoice?.invoiceTo || [
        {
          id: '1',
          primary: true,
          name: 'Cult Creative',
          email: 'support@cultcreative.asia',
          fullAddress:
            '5-3A, Block A, Jaya One, No.72A, Jalan Universiti, 46200 Petaling Jaya, Selangor',
          phoneNumber: '(+60)12-849 6499',
          company: 'Cult Creative',
          addressType: 'Hq',
        },
      ],
      items: [
        {
          ...invoice?.task,
          campaignName: invoice?.campaign?.name,
          clientName: invoice?.campaign?.company?.name || invoice?.campaign?.brand?.name,
          currency: invoice?.campaign?.creatorAgreement?.[0]?.currency || '',
        },
      ] || [
        {
          campaignName: '',
          clientName: '',
          // currency: '',
          // title: '',
          // description: '',
          service: '',
          quantity: 1,
          currency: '',
          price: 0,
          total: 0,
        },
      ],
      bankInfo: invoice?.bankAcc || {
        bankName: '',
        payTo:
          invoice?.creator?.user?.paymentForm?.bankAccountName ||
          invoice?.bankAcc?.payTo ||
          invoice?.creator?.user?.name ||
          '',
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
  } = methods;
  const values = watch();

  useEffect(() => {
    reset(defaultValues);
  }, [invoice, reset, defaultValues]);

  const handleCreateAndSend = handleSubmit(async (data) => {
    if (
      invoice?.status === 'approved' &&
      Math.abs((invoice?.amount || 0) - (data.totalAmount || 0)) > 0.01
    ) {
      data.status = 'draft';
      enqueueSnackbar('Amount changed on approved invoice. Status automatically set to draft.', {
        variant: 'warning',
        autoHideDuration: 4000,
      });
    }

    if (data?.status === 'approved' && !user?.admin?.xeroTokenSet) {
      enqueueSnackbar(`You're not connected to Xero`, {
        variant: 'error',
      });
      dialog.onTrue();
      return;
    }

    loadingSend.onTrue();
    let newContact;

    if (!invoice.creator.xeroContactId) {
      newContact = true;
    } else {
      newContact = false;
    }

    const formData = new FormData();

    const pdfBlob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
    
    formData.append('file', pdfBlob, `Invoice-${id}.pdf`);
    formData.append(
      'data',
      JSON.stringify({
        ...data,
        invoiceId: id,
        newContact: !invoice.creator.xeroContactId,
        xeroContactId: invoice.creator.xeroContactId,
        reason: data.reason === 'Others' ? data.otherReason : data.reason,
        campaignId: invoice?.campaignId,
      })
    );

    try {
      // await axiosInstance.patch(endpoints.invoice.updateInvoice, {
      // ...data,
      // invoiceId: id,
      // newContact,
      // xeroContactId: invoice.creator.xeroContactId,
      // reason: data.otherReason || data.reason,
      // campaignId: invoice?.campaignId,
      // });

      await axiosInstance.patch(endpoints.invoice.updateInvoice, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      reset();
      onClose?.();
      enqueueSnackbar('Invoice updated', { variant: 'success' });

      if (mutateInvoices) mutateInvoices();
      if (mutateStats) mutateStats();

      if (data.status === 'approved' || data.status === 'processing') {
        const pollInterval = setInterval(async () => {
          try {
            const res = await axiosInstance.get(`${endpoints.invoice.getAll}?limit=10000`);
            const updatedInvoices = res.data?.data || [];
            const updatedInvoice = updatedInvoices.find((inv) => inv.id === id);

            if (updatedInvoice && updatedInvoice.status !== 'processing') {
              clearInterval(pollInterval);

              if (mutateInvoices) mutateInvoices();
              if (mutateStats) mutateStats();
            }
          } catch (err) {
            console.error('Error polling invoice status:', err);
          }
        }, 5000);

        setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
      }
    } catch (error) {
      enqueueSnackbar('Failed to update invoice', { variant: 'error' });
      loadingSend.onFalse();
    }
  });

  const handleDownload = async () => {
    const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${values.invoiceNumber}.pdf`;
    link.click();
  };

  const handleActivateXero = useCallback(async () => {
    try {
      xeroLoading.onTrue();
      const response = await axiosInstance.get(endpoints.invoice.xero, { withCredentials: true });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
    } finally {
      xeroLoading.onFalse();
    }
  }, [xeroLoading]);

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <FormProvider methods={methods}>
      <Stack spacing={3} sx={{ pb: 5 }}>
        {/* Top Header / Actions */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4">Invoice Details</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Status:
              </Typography>
              <Label
                color={
                  (values.status === 'approved' && 'success') ||
                  (values.status === 'paid' && 'info') ||
                  (values.status === 'rejected' && 'error') ||
                  'default'
                }
                variant="soft"
              >
                {values.status.toUpperCase()}
              </Label>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <LoadingButton
              variant="outlined"
              startIcon={<Iconify icon="solar:eye-bold" width={18} />}
              onClick={preview.onTrue}
              sx={{
                border: '1px solid #E7E7E7',
                borderRadius: '8px',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
              }}
            >
              Preview Invoice
            </LoadingButton>
            <LoadingButton
              variant="outlined"
              startIcon={<Iconify icon="material-symbols:download-rounded" width={18} />}
              onClick={handleDownload}
              sx={{
                border: '1px solid #E7E7E7',
                borderRadius: '8px',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
              }}
            >
              Download Invoice
            </LoadingButton>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {/* Main Form Area */}
          <Grid item xs={12} md={9}>
            <Card sx={{ px: 4, py: 3, borderRadius: 2, overflowY: 'auto' }}>
              <InvoiceNewEditAddress creators={creatorList} />

              <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

              <InvoiceNewEditStatusDate />

              <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

              {/* Bank Information Section */}
              <Box>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', mb: 2, display: 'block' }}
                >
                  Payment Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <RHFAutocomplete
                      name="bankInfo.bankName"
                      label="Bank Name"
                      ListboxComponent={ListboxComponent}
                      options={newBanks?.flatMap((a) => a.banks) || []}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RHFTextField name="bankInfo.payTo" label="Recipient Name" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RHFTextField name="bankInfo.accountNumber" label="Account Number" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <RHFTextField name="bankInfo.accountEmail" label="Payment Notification Email" />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

              {/* Items Section */}
              <InvoiceNewEditDetails />
            </Card>
          </Grid>

          {/* Sidebar / Additional Info */}
          <Grid item xs={12} md={3}>
            <Stack spacing={3}>
              {/* Integration Status */}
              {getTenant && (
                <Paper
                  variant="outlined"
                  sx={{ p: 2, bgcolor: alpha('#13B5EA', 0.04), borderColor: alpha('#13B5EA', 0.2) }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Iconify icon="logos:xero" width={24} sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="subtitle2">Xero Connected</Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: 'text.secondary', mb: 1 }}
                      >
                        Invoice will be synced to:
                      </Typography>
                      <Label color="info" variant="soft" sx={{ mb: 1 }}>
                        {getTenant?.tenantName}
                      </Label>
                      <Typography variant="caption" display="block">
                        Currency: <b>{getTenant?.orgData?.baseCurrency}</b>
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* Deliverables Summary */}
              {invoice?.deliverables?.length > 0 && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Deliverables
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            '& th': {
                              bgcolor: (theme) => theme.palette.background.neutral,
                              color: 'text.secondary',
                              borderBottom: 'none',
                            },
                            '& th:first-of-type': {
                              borderTopLeftRadius: 8,
                              borderBottomLeftRadius: 8,
                            },
                            '& th:last-of-type': {
                              borderTopRightRadius: 8,
                              borderBottomRightRadius: 8,
                            },
                          }}
                        >
                          <TableCell sx={{ pl: 1 }}>Type</TableCell>
                          <TableCell align="right" sx={{ pr: 1 }}>
                            Qty
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoice.deliverables.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ pl: 1 }}>
                              <Typography variant="body2">{item.type}</Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 1 }}>
                              {item.count}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              )}

              {/* Rejection Handling */}
              {values.status === 'rejected' && (
                <Card
                  sx={{
                    p: 2,
                    border: (theme) => `1px solid ${theme.palette.error.light}`,
                    bgcolor: alpha('#FF5630', 0.04),
                  }}
                >
                  <Typography variant="subtitle2" color="error" sx={{ mb: 2 }}>
                    Rejection Reason
                  </Typography>
                  <Stack spacing={2}>
                    <RHFSelect name="reason" label="Select Reason">
                      {reasons.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                    {values.reason === 'Others' && (
                      <RHFTextField name="otherReason" label="Explain Reason" multiline rows={3} />
                    )}
                  </Stack>
                </Card>
              )}

              {/* Main Actions Area */}
              <Box sx={{ pt: 2 }}>
                {/* {invoice?.status !== 'paid' && ( */}
                <LoadingButton
                  fullWidth
                  size="large"
                  variant="contained"
                  color="primary"
                  loading={loadingSend.value && isSubmitting}
                  onClick={handleCreateAndSend}
                  disabled={!isValid}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    padding: { xs: '4px 8px', sm: '6px 10px' },
                    borderRadius: '8px',
                    boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                    backgroundColor: '#1340FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#133effd3',
                      boxShadow: '0px -4px 0px 0px #0c2aa6 inset',
                    },
                    '&:active': {
                      boxShadow: '0px 0px 0px 0px #0c2aa6 inset',
                      transform: 'translateY(1px)',
                    },
                  }}
                >
                  {invoice ? 'Update & Send' : 'Create & Send'}
                </LoadingButton>
                {/* )} */}
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', mt: 2, textAlign: 'center' }}
                >
                  Ensure all information is correct before updating.
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      {/* Xero Connection Dialog */}
      <Dialog open={dialog.value} onClose={dialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Iconify icon="logos:xero" width={48} sx={{ mb: 2 }} />
          <br />
          Connect to Xero
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary' }}>
            To approve and sync invoices, you must authorize access to your Xero account.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={dialog.onFalse} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            loading={xeroLoading.value}
            onClick={handleActivateXero}
            sx={{ bgcolor: '#13B5EA', '&:hover': { bgcolor: '#0e9bc7' } }}
          >
            Connect Now
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={preview.value}
        onClose={preview.onFalse}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '80vh' } }}
      >
        <DialogActions sx={{ p: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="material-symbols:download-rounded" width={18} />}
            onClick={() => {
              handleDownload();
              preview.onFalse();
            }}
            sx={{
              border: '1px solid #E7E7E7',
              borderRadius: '8px',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            onClick={preview.onFalse}
            sx={{
              border: '1px solid #E7E7E7',
              borderRadius: '8px',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Close
          </Button>
        </DialogActions>
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
            <InvoicePDF invoice={invoice} />
          </PDFViewer>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}

InvoiceNewEditForm.propTypes = {
  id: PropTypes.string,
  creators: PropTypes.object,
  onClose: PropTypes.func,
  mutateInvoices: PropTypes.func,
  mutateStats: PropTypes.func,
};
