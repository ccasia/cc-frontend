import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

import {
  Box,
  Chip,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelectV2 } from 'src/components/hook-form';

const InviteCreatorsDialog = ({
  open,
  onClose,
  onCancel,
  selectedCreatorsCount,
  creators,
  onRemoveCreator,
  campaigns,
  campaignId,
  onCampaignChange,
  isLoadingCampaigns,
  isSubmitting,
  onSubmit,
}) => {
  const methods = useForm({
    defaultValues: {
      campaignId: campaignId || '',
    },
  });

  const { watch, setValue } = methods;
  const selectedCampaignId = watch('campaignId');

  useEffect(() => {
    setValue('campaignId', campaignId || '');
  }, [campaignId, setValue]);

  useEffect(() => {
    if ((selectedCampaignId || '') !== (campaignId || '')) {
      onCampaignChange(selectedCampaignId || '');
    }
  }, [campaignId, onCampaignChange, selectedCampaignId]);

  const getCreatorHandle = (creator) => {
    if (creator?.platform === 'instagram' && creator?.handles?.instagram) {
      return { platform: 'instagram', handle: creator.handles.instagram };
    }

    if (creator?.platform === 'tiktok' && creator?.handles?.tiktok) {
      return { platform: 'tiktok', handle: creator.handles.tiktok };
    }

    return { platform: null, handle: '-' };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { bgcolor: '#F4F4F4' } }}
    >
      <DialogTitle variant="h3" sx={{ fontFamily: 'Instrument Serif', fontWeight: 400 }}>
        Invite Creators To A Campaign
      </DialogTitle>

      <Divider sx={{ mx: 3, mb: 2, mt: -1 }} />

      <DialogContent>
        <FormProvider methods={methods}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {creators.map((creator, index) => {
                const { platform, handle } = getCreatorHandle(creator);

                return (
                  <Chip
                    key={`${creator?.rowId || creator?.userId || creator?.id || index}`}
                    onDelete={() =>
                      onRemoveCreator(creator?.rowId || creator?.userId || creator?.id || null)
                    }
										deleteIcon={<Iconify icon='streamline:delete-1-solid' width={8} />}
                    variant="outlined"
                    label={
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {creator?.name || 'Creator'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          |
                        </Typography>
                        {platform && (
                          <Iconify
                            icon={platform === 'instagram' ? 'mdi:instagram' : 'ic:baseline-tiktok'}
                            sx={{ width: 14, height: 14 }}
														color='text.secondary'
                          />
                        )}
                        <Typography variant="caption" color="text.secondary" mr={1}>
                          {handle}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      height: 28,
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
											boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
											pb: 0.2,
											pr: 0.5,
											borderRadius: 0.8
                    }}
                  />
                );
              })}
            </Box>

            <RHFSelectV2
              name="campaignId"
              placeholder="Select Campaign"
              disabled={isLoadingCampaigns || isSubmitting}
              sx={{ bgcolor: '#fff' }}
            >
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </RHFSelectV2>
          </Stack>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <Button
					variant='contained'
          sx={{
            color: '#231F20',
            bgcolor: '#FFFFFF',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            pb: 1,
            borderRadius: 1,
            border: '1px solid #E7E7E7',
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            '&:hover': {
              bgcolor: '#FFFFFF',
              border: '1px solid #E7E7E7',
              boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
            },
          }}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
					variant='contained'
          onClick={onSubmit}
          disabled={isSubmitting || !selectedCampaignId}
          sx={{
            color: '#ffffff',
            bgcolor: 'rgba(58, 58, 60, 1)',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            pb: 1,
            borderRadius: 1,
            border: !selectedCampaignId ? 'none' : '1px solid #3A3A3C',
            boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
						'&:hover': {
              bgcolor: 'rgba(58, 58, 60, 0.9)',
              border: '1px solid #3A3A3C',
              boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
            },
          }}
        >
          {isSubmitting ? 'Inviting...' : 'Invite Creators'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

InviteCreatorsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onCancel: PropTypes.func,
  selectedCreatorsCount: PropTypes.number,
  creators: PropTypes.array,
  onRemoveCreator: PropTypes.func,
  campaigns: PropTypes.array,
  campaignId: PropTypes.string,
  onCampaignChange: PropTypes.func,
  isLoadingCampaigns: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  onSubmit: PropTypes.func,
};

export default InviteCreatorsDialog;
