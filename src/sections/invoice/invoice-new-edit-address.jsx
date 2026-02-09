import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';

import { AddressListDialog } from '../address';

// ----------------------------------------------------------------------

// fetch client information from campaign id for invoice from

// fetch creator only shortlisted creator with completed jobs to be able to send invoice to
// eslint-disable-next-line no-unused-vars
export default function InvoiceNewEditAddress({ creators, invoice }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const mdUp = useResponsive('up', 'md');

  const values = watch();

  const { invoiceFrom, invoiceTo, bankInfo } = values;

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
      >
        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="center">
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', display: 'block', flexGrow: 1, mb: 1 }}
            >
              From:
            </Typography>
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="subtitle2">{bankInfo?.payTo || invoiceFrom?.name}</Typography>
            <Typography variant="body2">{invoiceFrom?.fullAddress}</Typography>
            <Typography variant="body2"> {invoiceFrom?.phoneNumber}</Typography>
            <Typography variant="body2">{invoice?.creator?.user?.paymentForm?.icNumber}</Typography>
          </Stack>
        </Stack>

        <Stack sx={{ width: 1 }}>
          <Stack direction="row" alignItems="flex-start">
            <Typography
              variant="overline"
              sx={{ color: 'text.secondary', display: 'block', flexGrow: 1 }}
            >
              To:
            </Typography>

            <IconButton onClick={to.onTrue}>
              <Iconify
                icon={invoiceTo ? 'solar:pen-bold' : 'mingcute:add-line'}
                sx={{ color: '#1340FF' }}
              />
            </IconButton>
          </Stack>

          {invoiceTo ? (
            <Stack spacing={0.5}>
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
            name: 'Cult Creative Sdn. Bhd.',
            email: 'support@cultcreative.asia',
            fullAddress:
              '5-3A, Block A, Jaya One, No.72A, Jalan Universiti, 46200 Petaling Jaya, Selangor',
            phoneNumber: '(+60) 12-849 6499',
            company: 'Cult Creative',
            addressType: 'Hq',
          },
        ]}
      />
    </>
  );
}
InvoiceNewEditAddress.propTypes = {
  creators: PropTypes.array.isRequired,
  invoice: PropTypes.any,
};
