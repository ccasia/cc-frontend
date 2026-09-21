import PropTypes from 'prop-types';
import { PDFViewer } from '@react-pdf/renderer';
import { useFormContext } from 'react-hook-form';

import { Box, Stack, Button, Dialog, Typography, DialogTitle, DialogActions } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import AgreementPreview from 'src/template/agreement-preview';

import Iconify from 'src/components/iconify';
import { RHFSwitch } from 'src/components/hook-form';

// NDA toggle with a preview of a creator agreement that includes the NDA section,
// so admins can read what the NDA adds. Reads `campaignType` from the surrounding form.
export default function NdaAgreementField({ isForSurfShark }) {
  const { watch } = useFormContext();
  const preview = useBoolean();
  const smDown = useResponsive('down', 'sm');

  const isSeedingCampaign = watch('campaignType') === 'seedingCampaign';

  return (
    <>
      <Stack alignItems="flex-start">
        <Stack direction="row" alignItems="center" mb={-0.5}>
          <Typography
            sx={{
              fontWeight: 700,
              color: (theme) => (theme.palette.mode === 'light' ? 'black' : 'white'),
              fontSize: '0.875rem',
              mr: 2,
            }}
          >
            Include an NDA in creator agreements?
          </Typography>
          <RHFSwitch name="isNdaRequired" color="primary" />
        </Stack>
        <Typography variant="subtitle2" fontWeight={400} color="text.secondary">
          Adds a confidentiality clause to every creator agreement, so creators keep campaign
          details private, even after the campaign ends.
        </Typography>

        {/* Compact version of the wizard's secondary (Back) button */}
        <Button
          onClick={preview.onTrue}
          startIcon={<Iconify icon="solar:eye-outline" width={16} sx={{ color: '#1340FF' }} />}
          sx={{
            mt: 1.5,
            height: 32,
            px: 1.5,
            borderRadius: 1,
            bgcolor: 'white',
            border: '1px solid #E7E7E7',
            boxShadow: '0px -1.5px 0px 0px rgba(0, 0, 0, 0.05) inset',
            color: '#3A3A3C',
            fontSize: '0.8125rem',
            fontWeight: 600,
            '& .MuiButton-startIcon': { mr: 0.75 },
            transition: 'transform 160ms ease-out, background-color 150ms ease',
            '&:active': { transform: 'scale(0.97)' },
            '&:hover': { bgcolor: 'white' },
            '@media (hover: hover) and (pointer: fine)': {
              '&:hover': { bgcolor: '#F8F8F8' },
            },
          }}
        >
          Preview NDA
        </Button>
      </Stack>

      <Dialog
        open={preview.value}
        onClose={preview.onFalse}
        maxWidth="md"
        fullWidth
        fullScreen={smDown}
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ fontFamily: 'Instrument Serif' }}>
            NDA Agreement Preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Example creator agreement with the NDA. The NDA is section 6. Confidentiality, near the
            end. Creator details are placeholders.
          </Typography>
        </DialogTitle>

        <Box sx={{ height: smDown ? 1 : '75vh', px: 3 }}>
          <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
            <AgreementPreview
              isNdaRequired
              isSeedingCampaign={isSeedingCampaign}
              isForSurfShark={isForSurfShark}
            />
          </PDFViewer>
        </Box>

        <DialogActions>
          <Button variant="contained" onClick={preview.onFalse}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

NdaAgreementField.propTypes = {
  isForSurfShark: PropTypes.bool,
};
