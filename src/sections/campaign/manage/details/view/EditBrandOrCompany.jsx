import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  ListItemText,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

import { useGetCampaignBrandOption } from 'src/hooks/use-get-company-brand';

import axiosInstance, { endpoints } from 'src/utils/axios';

import Image from 'src/components/image';
import { RHFAutocomplete } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

export const EditBrandOrCompany = ({ open, campaign, onClose }) => {
  const methods = useForm({
    defaultValues: {
      campaignBrand: campaign?.brand ?? campaign?.company,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.editCampaignBrandOrCompany, {
        ...data,
        id: campaign?.id,
      });
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Error has occured', {
        variant: 'error',
      });
    }
  });

  const { options } = useGetCampaignBrandOption();

  return (
    <Dialog
      open={open.campaignBrand}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle id="alert-dialog-title">
          Edit Brand or Company
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" p={1.5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(1, 1fr)',
                },
                gap: 2,
              }}
            >
              <RHFAutocomplete
                fullWidth
                name="campaignBrand"
                placeholder="Brand"
                options={options}
                getOptionLabel={(option) => option.name}
                renderOption={(props, option) => (
                  <Stack direction="row" spacing={1} p={1} {...props}>
                    <Image
                      loading="lazy"
                      width={30}
                      src="/images.png"
                      alt=""
                      sx={{
                        borderRadius: 5,
                      }}
                    />
                    <ListItemText primary={option.name} />
                  </Stack>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose('campaignBrand')}>Cancel</Button>
          <Button autoFocus color="primary" type="submit">
            Save
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

EditBrandOrCompany.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
