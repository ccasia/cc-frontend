import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import React, { useState, useEffect } from 'react';

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
  const methods = useForm();

  const { setValue } = methods;

  useEffect(() => {
    setValue('campaignBrand', campaign?.brand);
  }, [setValue, campaign]);

  const [brandState, setBrandState] = useState('');
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
                  md: 'repeat(2, 1fr)',
                },
                gap: 2,
              }}
            >
              <RHFAutocomplete
                fullWidth
                name="campaignBrand"
                placeholder="Brand"
                options={brandState ? [brandState] : options}
                freeSolo
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
