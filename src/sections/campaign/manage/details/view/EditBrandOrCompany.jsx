import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Avatar,
  DialogTitle,
  ListItemText,
  DialogActions,
  DialogContent,
  DialogContentText,
  createFilterOptions,
} from '@mui/material';

import { useGetCampaignBrandOption } from 'src/hooks/use-get-company-brand';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { RHFAutocomplete } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

const filter = createFilterOptions();

export const EditBrandOrCompany = ({ open, campaign, onClose }) => {
  const methods = useForm({
    defaultValues: {
      campaignBrand: campaign?.brand ?? campaign?.company,
    },
  });

  // const type = useMemo(() => {
  //   if (campaign?.brand) return 'brand';
  //   if (campaign?.company) return 'company';
  //   return '';
  // }, [campaign]);

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await axiosInstance.patch(endpoints.campaign.editCampaignBrandOrCompany, {
        ...data,
        id: campaign?.id,
      });
      mutate(endpoints.campaign.getCampaignById(campaign.id));
      enqueueSnackbar(res?.data.message);
    } catch (error) {
      enqueueSnackbar('Failed to update brand or company', {
        variant: 'error',
      });
    }
  });

  const { data: options, isLoading } = useGetCampaignBrandOption();

  const closeDialog = () => onClose('campaignBrand');

  return (
    <Dialog
      open={open.campaignBrand}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      fullWidth
      maxWidth="sm"
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle id="alert-dialog-title">Edit Brand or Company</DialogTitle>
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
                options={(!isLoading && options) || []}
                getOptionLabel={(option) => option.name}
                renderOption={(props, option) => (
                  <Stack direction="row" spacing={1} p={1} {...props} key={option.id}>
                    <Avatar src={option?.logo}>{option.name.slice(0, 1)}</Avatar>
                    <ListItemText primary={option.name} />
                  </Stack>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                filterOptions={(option, params) => {
                  const filtered = filter(option, params);

                  return filtered;
                }}
              />
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button type="submit" onClick={closeDialog} autoFocus color="primary">
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
