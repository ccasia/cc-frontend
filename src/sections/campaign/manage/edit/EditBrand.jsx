import React from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';

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

import Image from 'src/components/image';
import { RHFAutocomplete } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

export const EditBrand = ({ open, campaign, onClose }) => {
  const methods = useForm({
    defaultValues: {
      campaignBrand: campaign?.brand ?? campaign?.company,
    },
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
      <DialogTitle id="alert-dialog-title">Brand</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" p={1.5}>
          <FormProvider methods={methods}>
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
          </FormProvider>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose('campaignBrand')}>Cancel</Button>
        <Button autoFocus color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

EditBrand.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
