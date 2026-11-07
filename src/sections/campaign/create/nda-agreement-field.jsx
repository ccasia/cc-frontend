import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

import { Stack, Button, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import { RHFSwitch } from 'src/components/hook-form';

import NdaPreviewDialog from './components/nda-preview-dialog';
import { ToggleRow, InlineAction } from './components/option-card';

// NDA toggle with a preview of a creator agreement that includes the NDA section,
// so admins can read what the NDA adds. Reads `campaignType` from the surrounding form.
// `row` shows it as a plain toggle row, like the other create-campaign settings
export default function NdaAgreementField({ isForSurfShark, row = false }) {
  const { watch, setValue } = useFormContext();
  const preview = useBoolean();

  const isSeedingCampaign = watch('campaignType') === 'seedingCampaign';
  const isNdaRequired = !!watch('isNdaRequired');

  return (
    <>
      {row ? (
        <ToggleRow
          title="Include an NDA in creator agreements"
          description={
            <>
              Adds a confidentiality clause to every creator agreement, so creators keep
              campaign details private, even after the campaign ends.{' '}
              <InlineAction onClick={preview.onTrue}>Preview NDA</InlineAction>
            </>
          }
          checked={isNdaRequired}
          onChange={(checked) => setValue('isNdaRequired', checked, { shouldDirty: true })}
        />
      ) : (
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
      )}

      <NdaPreviewDialog
        open={preview.value}
        onClose={preview.onFalse}
        isSeedingCampaign={isSeedingCampaign}
        isForSurfShark={isForSurfShark}
      />
    </>
  );
}

NdaAgreementField.propTypes = {
  isForSurfShark: PropTypes.bool,
  row: PropTypes.bool,
};
