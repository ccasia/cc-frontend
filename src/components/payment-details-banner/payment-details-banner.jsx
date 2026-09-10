import { Box, Stack, useTheme, Button, Typography, useMediaQuery } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

import PaymentDetailsDialog from './payment-details-dialog';

// ----------------------------------------------------------------------

export default function PaymentDetailsBanner() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const dialog = useBoolean();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isCreator = user?.role === 'creator';
  const hasPaymentDetails = Boolean(user?.paymentForm?.bankAccountName);

  if (!isCreator || hasPaymentDetails) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          bgcolor: '#1340FF',
          borderRadius: 2,
          px: { xs: 2, sm: 3 },
          py: { xs: 1, sm: 2 },
          mx: { xs: 2, sm: 4 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography
              sx={{
                color: 'white',
                fontSize: { xs: 12, sm: 17 },
                fontWeight: { xs: 400, sm: 500 },
              }}
            >
              Complete your{' '}
              <Box component="span" sx={{ fontWeight: 700 }}>
                Payment Details
              </Box>{' '}
              to
              {isMobile && <br />}
              get full access to your campaigns
            </Typography>

            {!isMobile && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                  Find it in
                </Typography>
                <Iconify icon="solar:settings-outline" width={16} sx={{ color: 'white' }} />
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                  Settings
                </Typography>
                <Iconify
                  icon="eva:chevron-right-fill"
                  width={16}
                  sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                />
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14 }}>
                  Payment
                </Typography>
              </Stack>
            )}
          </Stack>

          <Button
            variant="contained"
            onClick={dialog.onTrue}
            endIcon={<Iconify icon="eva:chevron-right-fill" width={isMobile ? 14 : 18} />}
            sx={{
              bgcolor: 'white',
              color: '#1340FF',
              fontSize: { xs: '13px', sm: '16px' },
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              ...(isMobile
                ? {
                    width: '82px',
                    height: '24px',
                    minWidth: '82px',
                    minHeight: '24px',
                    borderRadius: '6px',
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                    pt: '2px',
                    pr: '12px',
                    pb: '5px',
                    pl: '10px',
                    '& .MuiButton-endIcon': {
                      ml: '2px',
                      mr: 0,
                    },
                  }
                : {
                    width: '193px',
                    height: '44px',
                    minWidth: '193px',
                    gap: '6px',
                    borderRadius: '8px',
                    border: '1px solid #E7E7E7',
                    boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                    pt: '10px',
                    pr: '16px',
                    pb: '13px',
                    pl: '16px',
                    '& .MuiButton-endIcon': {
                      ml: 0,
                      mr: 0,
                    },
                    transition: 'box-shadow 0.1s ease, padding 0.1s ease',
                  }),
              '&:hover': {
                bgcolor: 'white',
                border: '1px solid #E7E7E7',
                boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
              },
              ...(!isMobile && {
                '&:active': {
                  boxShadow: '0px 0px 0px 0px #E7E7E7 inset',
                  pt: '13px',
                  pb: '10px',
                },
              }),
            }}
          >
            {isMobile ? 'Go Now' : 'Payment Details'}
          </Button>
        </Stack>
      </Box>

      <PaymentDetailsDialog open={dialog.value} onClose={dialog.onFalse} />
    </>
  );
}
