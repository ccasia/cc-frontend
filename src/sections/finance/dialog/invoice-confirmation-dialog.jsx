import useSWR from 'swr';
import * as Yup from 'yup';
import { filter, sum } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, Controller, useFieldArray, useFormContext } from 'react-hook-form';

import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers';
import {
  Box,
  Stack,
  Table,
  Button,
  Dialog,
  TableRow,
  MenuItem,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  DialogContent,
  TableContainer,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  inputBaseClasses,
  IconButton,
} from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

import { fetcher } from 'src/utils/axios';

import { newBanks } from 'src/contants/banksv2';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';
import { useBoolean } from 'src/hooks/use-boolean';
import { AddressListDialog } from 'src/sections/address';

const OuterElementContext = React.createContext({});
const LISTBOX_PADDING = 10;

const generateRandomInvoiceNumber = () => {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `INV-${randomNumber}`;
};

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

const NewInvoiceSchema = Yup.array(
  Yup.object().shape({
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
  })
);

const InvoiceConfirmationDialog = ({ open, onClose, selectedInvoices }) => {
  const smUp = useResponsive('up', 'sm');

  const {
    data: invoicesData,
    isLoading: invoicesLoading,
    error: invoicesError,
    mutate: mutateInvoices,
  } = useSWR(`/api/invoice/getAll?invoiceIds=${selectedInvoices.join(',')}`, fetcher);

  const methods = useForm({
    resolver: yupResolver(NewInvoiceSchema),
    defaultValues: {
      invoices: null,
    },
  });

  const { control, setValue, watch } = methods;

  const values = watch();

  const { fields } = useFieldArray({ name: 'invoices', control });

  useEffect(() => {
    const defaultValues = invoicesData?.map((invoice) => ({
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
          service: '',
          quantity: 1,
          currency: '',
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
    }));

    setValue('invoices', defaultValues);
  }, [invoicesData, setValue]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 0.8,
          py: 2,
        },
      }}
      fullScreen
    >
      <DialogContent sx={{ overflow: 'hidden' }}>
        <FormProvider methods={methods}>
          <Box height="100vh">
            <Box
              sx={{
                display: 'flex',
                alignItems: !smUp ? 'stretch' : 'center',
                justifyContent: 'space-between',
                flexDirection: !smUp ? 'column' : 'row',
                gap: 2,
              }}
            >
              <Typography variant="subtitle1">
                Showing {selectedInvoices.length} invoices
              </Typography>
              <Box sx={{ display: 'inline-flex', gap: 1.2 }}>
                <Button variant="outlined" onClick={onClose} fullWidth={!smUp}>
                  Cancel
                </Button>
                <LoadingButton
                  startIcon={<Iconify icon="iconamoon:send-fill" />}
                  variant="contained"
                  fullWidth={!smUp}
                >
                  Confirm & Send
                </LoadingButton>
              </Box>
            </Box>

            {/* Invoices Information */}
            {invoicesLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                }}
              >
                <CircularProgress
                  thickness={7}
                  size={25}
                  sx={{
                    color: (theme) => theme.palette.common.black,
                    strokeLinecap: 'round',
                  }}
                />
              </Box>
            )}

            {!invoicesLoading && (
              <Stack
                sx={{
                  gap: 1,
                  mt: 2,
                  pb: 20,
                  overflow: 'auto',
                  height: '100%',
                }}
              >
                {fields.map((field, index) => (
                  <Stack key={field.id} justifyContent="space-between">
                    <Stack
                      spacing={2}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="subtitle2">{field.invoiceNumber}</Typography>
                      <Box sx={{ textAlign: 'end' }}>
                        <LoadingButton
                          variant="outlined"
                          startIcon={
                            <Iconify icon="material-symbols:download-rounded" width={18} />
                          }
                          //   onClick={handleDownload}
                        >
                          Download Invoice
                        </LoadingButton>
                      </Box>
                    </Stack>

                    <Stack sx={{ mt: 2 }}>
                      <InvoiceNewEditAddress />

                      <InvoiceNewEditStatusDate index={index} />

                      <Box>
                        <Typography variant="h6" sx={{ color: 'text.disabled', mt: 3, ml: 2 }}>
                          Bank Information:
                        </Typography>
                        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ p: 3 }}>
                          <RHFAutocomplete
                            name={`invoices.${index}.bankInfo.bankName`}
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
                            name={`invoices.${index}.bankInfo.payTo`}
                            required
                            fullWidth
                            value={values.invoices[index].bankInfo?.payTo}
                          />
                          <RHFTextField
                            label="Account Number"
                            name={`invoices.${index}.bankInfo.accountNumber`}
                            required
                            fullWidth
                          />
                          <RHFTextField
                            fullWidth
                            required
                            name={`invoices.${index}.bankInfo.accountEmail`}
                            label="Account Email"
                          />
                        </Stack>
                      </Box>

                      {invoicesData[index].deliverables.length && (
                        <DeliverablesInfo index={index} invoice={invoicesData[index]} />
                      )}

                      <InvoiceNewEditDetails index={index} />
                    </Stack>

                    <Box sx={{ minHeight: '1px', bgcolor: 'lightgrey' }} />
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceConfirmationDialog;

InvoiceConfirmationDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  selectedInvoices: PropTypes.array,
};

// eslint-disable-next-line react/prop-types
function InvoiceNewEditStatusDate({ index }) {
  const { control, watch } = useFormContext();

  const values = watch();

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ p: 3, bgcolor: 'background.neutral' }}
    >
      <RHFTextField
        disabled
        name={`invoices.${index}.invoiceNumber`}
        label="Invoice number"
        value={values.invoices[index].invoiceNumber}
      />

      <RHFSelect
        fullWidth
        name={`invoices.${index}.status`}
        label="Status"
        InputLabelProps={{ shrink: true }}
        PaperPropsSx={{ textTransform: 'capitalize' }}
        // disabled={values.status === 'approved'}
      >
        {['approved', 'paid', 'draft', 'rejected'].map((option) => (
          <MenuItem
            key={option}
            value={option}
            sx={{
              color: (theme) => option === 'rejected' && theme.palette.error.main,
            }}
          >
            {option}
          </MenuItem>
        ))}
      </RHFSelect>

      <Controller
        name={`invoices.${index}.createDate`}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            disabled
            label="Invoice Date"
            value={field.value}
            onChange={(newValue) => {
              field.onChange(newValue);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
              },
            }}
          />
        )}
      />

      <Controller
        name={`invoices.${index}.dueDate`}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <DatePicker
            label="Due date"
            value={field.value}
            onChange={(newValue) => {
              field.onChange(newValue);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!error,
                helperText: error?.message,
              },
            }}
          />
        )}
      />
    </Stack>
  );
}

// eslint-disable-next-line react/prop-types
function InvoiceNewEditDetails({ index }) {
  const { control, setValue, watch } = useFormContext();

  const { fields } = useFieldArray({
    control,
    name: `invoices.${index}.items`,
  });

  const invoices = watch('invoices');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = watch(`invoices.${index}.items`) || [];

  const totalOnRow = items.map((item) => Number(item?.total || 0));
  const subTotal = sum(totalOnRow);

  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      MYR: 'RM',
      SGD: 'S$',
      USD: '$',
      AUD: 'A$',
      JPY: '¥',
      IDR: 'Rp',
    };
    return symbols[currencyCode] || currencyCode || '';
  };

  const currencyCode =
    invoices?.[index]?.items?.[0]?.currency || invoices?.[index]?.currency || 'MYR';

  const displayCurrency = getCurrencySymbol(currencyCode);

  useEffect(() => {
    setValue(`invoices.${index}.totalAmount`, subTotal);
  }, [index, setValue, subTotal]);

  const handleChangePrice = useCallback(
    (event, i) => {
      const price = Number(event.target.value || 0);
      const quantity = Number(items[i]?.quantity || 1);

      setValue(`items.${i}.price`, price);
      setValue(`items.${i}.total`, price * quantity);
    },
    [items, setValue]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Details:
      </Typography>

      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
        {fields.map((item, i) => {
          const serviceValue = watch(`invoices.${index}.items.${i}.service`) || '';
          const selectedServices = serviceValue ? serviceValue.split(',').map((s) => s.trim()) : [];

          return (
            <Stack key={item.id} alignItems="flex-end" spacing={1.5}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
                <RHFTextField
                  size="small"
                  name={`invoices.${index}.items.${i}.clientName`}
                  label="Client Name"
                  InputLabelProps={{ shrink: true }}
                />

                <RHFTextField
                  size="small"
                  name={`invoices.${index}.items.${i}.campaignName`}
                  label="Campaign Name"
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel id={`service-label-${i}`}>Service</InputLabel>

                  <Select
                    labelId={`service-label-${i}`}
                    multiple
                    size="small"
                    value={selectedServices}
                    onChange={(e) => {
                      const values = e.target.value;

                      setValue(`invoices.${index}.items.${i}.service`, values.join(', '));

                      if (!values.includes('Others')) {
                        setValue(`invoices.${index}.items.${i}.description`, '');
                      }
                    }}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {[
                      { id: 1, name: 'CGC Video', price: 200 },
                      { id: 2, name: 'Ads', price: 0 },
                      { id: 3, name: 'Cross Posting', price: 0 },
                      { id: 4, name: 'Reimbursement', price: 0 },
                      { id: 5, name: 'Others', price: 0 },
                    ].map((service) => (
                      <MenuItem key={service.id} value={service.name}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                          }}
                        >
                          {service.name}
                          {selectedServices.includes(service.name) && (
                            <Iconify
                              icon="eva:checkmark-fill"
                              width={16}
                              sx={{ color: 'success.main' }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedServices.includes('Others') && (
                  <RHFTextField
                    size="small"
                    name={`invoices.${index}.items.${i}.description`}
                    label="Specify Others"
                    InputLabelProps={{ shrink: true }}
                    sx={{ maxWidth: { md: 200 } }}
                  />
                )}

                <RHFTextField
                  size="small"
                  type="number"
                  name={`invoices.${index}.items.${i}.price`}
                  label="Price"
                  placeholder="0.00"
                  onChange={(event) => handleChangePrice(event, i)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>
                          {displayCurrency}
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: { md: 100 } }}
                />

                <RHFTextField
                  disabled
                  size="small"
                  type="number"
                  name={`invoices.${index}.items.${i}.total`}
                  label="Total"
                  value={Number(items[i]?.total) === 0 ? '' : Number(items[i]?.total).toFixed(2)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>
                          {displayCurrency}
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    maxWidth: { md: 120 },
                    [`& .${inputBaseClasses.input}`]: {
                      textAlign: { md: 'right' },
                    },
                  }}
                />
              </Stack>
            </Stack>
          );
        })}
      </Stack>

      <Stack
        spacing={2}
        alignItems="flex-end"
        sx={{ mt: 3, textAlign: 'right', typography: 'body2' }}
      >
        <Stack direction="row" sx={{ typography: 'subtitle1' }}>
          <Box>Total</Box>
          <Box sx={{ width: 160 }}>{`${displayCurrency} ${subTotal.toFixed(2)}`}</Box>
        </Stack>
      </Stack>
    </Box>
  );
}

// eslint-disable-next-line react/prop-types
function DeliverablesInfo({ invoice }) {
  return (
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
            {/* eslint-disable-next-line react/prop-types */}
            {invoice.deliverables?.map((item) => (
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
}

// eslint-disable-next-line react/prop-types
function InvoiceNewEditAddress({ creators }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const mdUp = useResponsive('up', 'md');

  const values = watch();

  const { invoiceFrom, invoiceTo } = values;

  const from = useBoolean();

  const to = useBoolean();

  return (
    <>
      <Stack
        spacing={{ xs: 3, md: 5 }}
        direction={{ xs: 'column', md: 'row' }}
        divider={
          <Divider
            flexItem
            orientation={mdUp ? 'vertical' : 'horizontal'}
            sx={{ borderStyle: 'dashed' }}
          />
        }
        sx={{ p: 3 }}
      >
        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              From:
            </Typography>

            {/* <IconButton onClick={from.onTrue}>
              <Iconify icon="solar:pen-bold" />
            </IconButton> */}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">{invoiceFrom?.name}</Typography>
            <Typography variant="body2">{invoiceFrom?.fullAddress}</Typography>
            <Typography variant="body2"> {invoiceFrom?.phoneNumber}</Typography>
          </Stack>
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ color: 'text.disabled', flexGrow: 1 }}>
              To:
            </Typography>

            <IconButton onClick={to.onTrue}>
              <Iconify icon={invoiceTo ? 'solar:pen-bold' : 'mingcute:add-line'} />
            </IconButton>
          </Stack>

          {invoiceTo ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">{invoiceTo.name}</Typography>
              <Typography variant="body2">{invoiceTo.fullAddress}</Typography>
              <Typography variant="body2"> {invoiceTo.phoneNumber}</Typography>
            </Stack>
          ) : (
            <Typography typography="caption" sx={{ color: 'error.main' }}>
              {errors.invoiceTo?.message}
            </Typography>
          )}
        </Stack>
      </Stack>

      <AddressListDialog
        title="Customers"
        open={from.value}
        onClose={from.onFalse}
        selected={(selectedId) => invoiceFrom?.id === selectedId}
        onSelect={(address) => setValue('invoiceFrom', address)}
        list={creators}
      />

      <AddressListDialog
        title="Customers"
        open={to.value}
        onClose={to.onFalse}
        selected={(selectedId) => invoiceTo?.id === selectedId}
        onSelect={(address) => setValue('invoiceTo', address)}
        list={[
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
        ]}
      />
    </>
  );
}
