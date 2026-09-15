import { Box, Stack, Button, useTheme, Typography, useMediaQuery } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import PhoneClaimDialog from 'src/components/phone-claim-dialog';

// ----------------------------------------------------------------------

export default function PhoneVerificationBanner() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const dialog = useBoolean();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isCreator = user?.role === 'creator';
  const isVerified = Boolean(user?.isPhoneVerified);

  if (!isCreator || isVerified) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          bgcolor: '#F5A623',
          borderRadius: 2,
          px: { xs: 2, sm: 3 },
          py: { xs: 1, sm: 2 },
          mx: { xs: 2, sm: 4 },
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography
              sx={{
                color: 'black',
                fontSize: { xs: 12, sm: 17 },
                fontWeight: { xs: 400, sm: 500 },
              }}
            >
              Please verify your{' '}
              <Box component="span" sx={{ fontWeight: 700 }}>
                Phone Number
              </Box>{' '}
              to{' '}
              {isMobile && <br />}
              keep receiving campaign updates
            </Typography>

            {!isMobile && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="ic:baseline-whatsapp" width={16} sx={{ color: 'black' }} />
                <Typography sx={{ color: 'black', fontSize: 14 }}>
                  We&apos;ll send you a code on WhatsApp to confirm it&apos;s yours
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
              color: '#B26A00',
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
            {isMobile ? 'Verify' : 'Verify Number'}
          </Button>
        </Stack>
      </Box>

      <PhoneClaimDialog open={dialog.value} onClose={dialog.onFalse} />
    </>
  );
}
