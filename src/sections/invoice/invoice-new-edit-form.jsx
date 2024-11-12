import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import useGetInvoiceById from 'src/hooks/use-get-invoice';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { banks } from 'src/contants/bank';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider from 'src/components/hook-form/form-provider';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

import XeroDialoge from './xero-dialoge';
import InvoiceNewEditDetails from './invoice-new-edit-details';
import InvoiceNewEditAddress from './invoice-new-edit-address';
import InvoiceNewEditStatusDate from './invoice-new-edit-status-date';

// ----------------------------------------------------------------------

export default function InvoiceNewEditForm({ id, creators }) {
  const { isLoading, invoice } = useGetInvoiceById(id);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState({});
  const [newContact, setNewContact] = useState(false);
  const loadingSave = useBoolean();

  const loadingSend = useBoolean();

  const [loading, setLoading] = useState(true);
  const currentInvoice = invoice;

  console.log('currentInvoice', currentInvoice);

  // add the contact id to the invoice
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
      invoiceNumber: currentInvoice?.invoiceNumber || generateRandomInvoiceNumber(),
      createDate: currentInvoice?.createDate || new Date(),
      dueDate: new Date(currentInvoice?.dueDate) || null,
      status: currentInvoice?.status || 'draft',
      invoiceFrom: currentInvoice?.invoiceFrom || null,
      invoiceTo: currentInvoice?.invoiceTo || [
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
      items: [currentInvoice?.task] || [
        {
          title: '',
          description: '',
          service: '',
          quantity: 1,
          price: 0,
          total: 0,
        },
      ],
      bankInfo: currentInvoice?.bankAcc || {
        bankName: '',
        payTo: '',
        accountNumber: '',
        accountEmail: '',
      },
      totalAmount: currentInvoice?.amount || 0,
    }),
    [currentInvoice]
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

  // const handleSaveAsDraft = handleSubmit(async (data) => {
  //   loadingSave.onTrue();

  //   try {
  //     await new Promise((resolve) => setTimeout(resolve, 500));
  //     reset();
  //     loadingSave.onFalse();
  //     router.push(paths.dashboard.invoice.root);
  //   } catch (error) {
  //     console.error(error);
  //     loadingSave.onFalse();
  //   }
  // });

  const handleCreateAndSend = handleSubmit(async (data) => {
    loadingSend.onTrue();
    if (
      data.status === 'approved' &&
      !currentInvoice.creator.xeroContactId &&
      Object.keys(contact).length === 0 &&
      !newContact
    ) {
      setOpen(true);
      return;
    }

    try {
      const response = axiosInstance.patch(endpoints.invoice.updateInvoice, {
        ...data,
        invoiceId: id,
        contactId: contact,
        newContact,
      });
      reset();
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

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );

  return (
    <FormProvider methods={methods}>
      <Card>
        <InvoiceNewEditAddress creators={creatorList} />

        <InvoiceNewEditStatusDate />

        {bankAccount}

        <InvoiceNewEditDetails />
      </Card>

      <Stack justifyContent="flex-end" direction="row" spacing={2} sx={{ mt: 3 }}>
        {/* <LoadingButton
          color="inherit"
          size="large"
          variant="outlined"
          loading={loadingSave.value && isSubmitting}
          onClick={handleSaveAsDraft}
        >
          Save as Draft
        </LoadingButton> */}

        <LoadingButton
          size="large"
          variant="contained"
          loading={loadingSend.value && isSubmitting}
          onClick={handleCreateAndSend}
        >
          {currentInvoice ? 'Update' : 'Create'} & Send
        </LoadingButton>
      </Stack>
      <XeroDialoge
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        setContact={setContact}
        setNewContact={setNewContact}
      />
    </FormProvider>
  );
}

InvoiceNewEditForm.propTypes = {
  id: PropTypes.string,
  creators: PropTypes.object,
};
