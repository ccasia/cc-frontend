import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Stack,
  Button,
  Dialog,
  Avatar,
  Checkbox,
  TextField,
  IconButton,
  DialogTitle,
  ListItemText,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import { endpoints } from 'src/utils/axios';

import { shortlistCreator, useGetAllCreators } from 'src/api/creator';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { RHFAutocomplete } from 'src/components/hook-form';
import FormProvider from 'src/components/hook-form/form-provider';

import UserCard from './user-card';

const CampaignDetailCreator = ({ campaign }) => {
  // eslint-disable-next-line no-unused-vars
  const [query, setQuery] = useState(null);
  const { data, isLoading } = useGetAllCreators();
  const smUp = useResponsive('up', 'sm');
  const shortlistedCreators = campaign?.shortlisted;
  const shortlistedCreatorsId = shortlistedCreators?.map((item) => item.userId);
  const modal = useBoolean();

  const methods = useForm({
    defaultValues: {
      creator: [],
    },
  });

  const { handleSubmit, watch, reset } = methods;

  const filteredData = useMemo(
    () =>
      query
        ? campaign?.shortlisted.filter((elem) =>
            elem.user.name.toLowerCase().includes(query.toLowerCase())
          )
        : campaign?.shortlisted.sort((a, b) => {
            if (a?.user?.name < b?.user?.name) {
              return -1;
            }
            if (a?.user?.name > b?.user?.name) {
              return 1;
            }
            return 0;
          }),
    [campaign, query]
  );

  const selectedCreator = watch('creator');

  const onSubmit = handleSubmit(async (value) => {
    try {
      const res = await shortlistCreator({ value, campaignId: campaign.id });
      modal.onFalse();
      reset();
      enqueueSnackbar(res?.data?.message);
      mutate(endpoints.campaign.getCampaignsByAdminId);
    } catch (error) {
      enqueueSnackbar('Error Shortlist Creato', {
        variant: 'error',
      });
    }
  });

  const renderShortlistFormModal = (
    <Dialog open={modal.value} onClose={modal.onFalse} maxWidth="xs" fullWidth>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>List Creator</DialogTitle>
        <DialogContent>
          <Box py={1}>
            <RHFAutocomplete
              label="Select Creator to shortlist"
              multiple
              disableCloseOnSelect
              name="creator"
              options={!isLoading && data?.filter((item) => item.status === 'active')}
              filterOptions={(option, state) =>
                option.filter((item) => !shortlistedCreatorsId.includes(item.id))
              }
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option, { selected }) => {
                // eslint-disable-next-line react/prop-types
                const { key, ...optionProps } = props;
                return (
                  <Box key={key} component="div" {...optionProps}>
                    <Checkbox style={{ marginRight: 8 }} checked={selected} />
                    <Avatar
                      alt="dawd"
                      src={option?.photoURL}
                      variant="rounded"
                      sx={{
                        width: 30,
                        height: 30,
                        flexShrink: 0,
                        mr: 1.5,
                        borderRadius: 2,
                      }}
                    />
                    <ListItemText primary={option?.name} secondary={option?.email} />
                  </Box>
                );
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={modal.onFalse}>Cancel</Button>

          <Button type="submit" disabled={!selectedCreator.length}>
            Shortlist {selectedCreator.length > 0 && selectedCreator.length}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );

  return (
    <>
      <Stack gap={3}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <TextField
            placeholder="Search by Name"
            sx={{
              width: 260,
            }}
            value={query}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="material-symbols:search" />
                </InputAdornment>
              ),
            }}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!smUp ? (
            <IconButton
              sx={{ bgcolor: (theme) => theme.palette.background.paper, borderRadius: 1 }}
              onClick={modal.onTrue}
            >
              <Iconify icon="fluent:people-add-28-filled" width={18} />
            </IconButton>
          ) : (
            <Button size="small" variant="contained" onClick={modal.onTrue}>
              Shortlist new creator
            </Button>
          )}
        </Stack>
        {campaign?.shortlisted?.length > 0 ? (
          <>
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: 'repear(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              }}
              gap={2}
            >
              {filteredData.map((elem, index) => (
                <UserCard key={elem?.id} creator={elem?.user} campaignId={campaign?.id} />
              ))}
            </Box>
            {filteredData?.length < 1 && (
              <EmptyContent title={`No Creator with name ${query} Found`} />
            )}
          </>
        ) : (
          <EmptyContent title="No Shortlisted Creator." />
        )}
      </Stack>
      {renderShortlistFormModal}
    </>
  );
};

export default CampaignDetailCreator;

CampaignDetailCreator.propTypes = {
  campaign: PropTypes.object,
};
