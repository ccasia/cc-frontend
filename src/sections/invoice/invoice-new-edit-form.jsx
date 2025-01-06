import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { pdf } from '@react-pdf/renderer';
import { useMemo, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetInvoiceById from 'src/hooks/use-get-invoice';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { banks } from 'src/contants/bank';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

import InvoicePDF from '../creator/invoice/invoice-pdf';
import InvoiceNewEditDetails from './invoice-new-edit-details';
import InvoiceNewEditAddress from './invoice-new-edit-address';
import InvoiceNewEditStatusDate from './invoice-new-edit-status-date';

// ----------------------------------------------------------------------

export default function InvoiceNewEditForm({ id, creators }) {
  const { isLoading, invoice, mutate } = useGetInvoiceById(id);

  const { enqueueSnackbar } = useSnackbar();

  // const [contact, setContact] = useState({});

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
          title: Yup.string().required('Title is required'),
          service: Yup.string().required('Service is required'),
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
    status: Yup.string(),
    invoiceFrom: Yup.mixed(),
    totalAmount: Yup.number(),
    invoiceNumber: Yup.string(),
  });

  const generateRandomInvoiceNumber = () => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    return `INV-${randomNumber}`;
  };

  const defaultValues = useMemo(
    () => ({
      invoiceNumber: invoice?.invoiceNumber || generateRandomInvoiceNumber(),
      createDate: invoice?.createDate || new Date(),
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
      items: [invoice?.task] || [
        {
          title: '',
          description: '',
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
    }),
    [invoice]
  );

  const methods = useForm({
    resolver: yupResolver(NewInvoiceSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
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
    // if (
    //   data.status === 'approved' &&
    //   !invoice.creator.xeroContactId &&
    //   Object.keys(contact).length === 0 &&
    //   !newContact
    // ) {
    //   setOpen(true);
    //   return;
    // }

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

  const bankAccount = (
    <Box>
      <Typography variant="h6" sx={{ color: 'text.disabled', mt: 3, ml: 2 }}>
        Bank Information:
      </Typography>
      <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ p: 3 }}>
        <RHFSelect
          // sx={{ width: 1 / 2 }}
          required
          name="bankInfo.bankName"
          label="Bank Name"
          InputLabelProps={{ shrink: true }}
          PaperPropsSx={{ textTransform: 'capitalize' }}
          value={values.bankInfo?.bankName}
        >
          {banks.map((option) => (
            <MenuItem key={option} value={option.bank}>
              {option.bank}
            </MenuItem>
          ))}
        </RHFSelect>
        <RHFTextField
          label="Recipent Name"
          name="bankInfo.payTo"
          required
          fullWidth
          // sx={{ width: 1 / 2 }}
          value={values.bankInfo?.payTo}
        />
        <RHFTextField
          label="Account Number"
          name="bankInfo.accountNumber"
          required
          fullWidth
          // sx={{ width: 1 / 2 }}
        />
        <RHFTextField
          fullWidth
          required
          name="bankInfo.accountEmail"
          label="Account Email"
          // sx={{ width: 1 / 2 }}
        />
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

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );

  return (
    <Stack alignItems="end" spacing={1}>
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

          <InvoiceNewEditDetails />

          {invoice?.status !== 'approved' && (
            <Stack justifyContent="flex-end" direction="row" spacing={2} sx={{ mt: 3 }}>
              <LoadingButton
                size="large"
                variant="outlined"
                loading={loadingSend.value && isSubmitting}
                onClick={handleCreateAndSend}
                sx={{
                  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                }}
              >
                {invoice ? 'Update' : 'Create'} & Send
              </LoadingButton>
            </Stack>
          )}
        </Card>

        {/* <XeroDialoge
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        setContact={setContact}
        setNewContact={setNewContact}
      /> */}
      </FormProvider>
    </Stack>
  );
}

InvoiceNewEditForm.propTypes = {
  id: PropTypes.string,
  creators: PropTypes.object,
};
