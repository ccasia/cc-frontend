/* eslint-disable perfectionist/sort-imports */
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import React, { useMemo, useState } from 'react';
//  import { ClimbingBoxLoader } from 'react-spinners';

//  import { LoadingButton } from '@mui/lab';
//  import { alpha } from '@mui/material/styles';
import { Box, Stack, TextField, InputAdornment } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetAgreements } from 'src/hooks/use-get-agreeements';

import { endpoints } from 'src/utils/axios';

//  import { useAuthContext } from 'src/auth/hooks';
import { shortlistCreator } from 'src/api/creator';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import UserCard from './public-user-card';
//  import UserCard from '../campaign/discover/admin/campaign-detail-creator/user-card';
//  import CampaignAgreementEdit from '../campaign/discover/admin/campaign-agreement-edit';

const PublicCreatorDetail = ({ campaign, campaignMutate }) => {
  const [query, setQuery] = useState('');

  const { data: agreements, isLoading: loadingAgreements } = useGetAgreements(campaign?.id);

  const smUp = useResponsive('up', 'sm');

  const modal = useBoolean();

  const editDialog = useBoolean();

  const loading = useBoolean();

  const methods = useForm({
    defaultValues: {
      creator: [],
    },
  });

  const {
    handleSubmit,

    reset,
    formState: { isSubmitting },
  } = methods;

  const creatorsWithAgreements = useMemo(() => {
    if (!agreements || !campaign?.shortlisted) return campaign?.shortlisted;

    const agreementsMap = agreements.reduce((acc, agreement) => {
      acc[agreement.userId] = {
        isSent: agreement.isSent,
        status: agreement.status,
      };
      return acc;
    }, {});

    return campaign.shortlisted.map((creator) => ({
      ...creator,
      isSent: agreementsMap[creator.userId]?.isSent || false,
      agreementStatus: agreementsMap[creator.userId]?.status || 'NOT_SENT',
    }));
  }, [agreements, campaign]);

  const filteredCreators = useMemo(
    () =>
      query
        ? creatorsWithAgreements?.filter((elem) =>
            elem?.user?.name?.toLowerCase().includes(query.toLowerCase())
          )
        : creatorsWithAgreements,
    [creatorsWithAgreements, query]
  );

  const onSubmit = handleSubmit(async (value) => {
    try {
      loading.onTrue();

      const newVal = value?.creator?.map((val) => ({
        ...val,
        creator: { ...val.creator, socialMediaData: '' },
      }));

      const res = await shortlistCreator({ newVal, campaignId: campaign.id });
      modal.onFalse();
      reset();
      enqueueSnackbar(res?.data?.message);
      campaignMutate();
      mutate(endpoints.campaign.creatorAgreement(campaign.id));
    } catch (error) {
      console.log(error);
      loading.onFalse();
      enqueueSnackbar('Error Shortlist Creator', {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  });

  const handleEditAgreement = (creator) => {
    const agreement = agreements.find((a) => a.userId === creator.userId);

    if (!loadingAgreements && (!agreement || agreement.isSent)) {
      enqueueSnackbar('No editable agreement found for this creator', { variant: 'info' });
      return;
    }

    editDialog.onTrue();
  };

  return (
    <Stack gap={3}>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <TextField
          placeholder="Search by Creator Name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth={!smUp}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="material-symbols:search" />
              </InputAdornment>
            ),
            sx: {
              height: '42px',
              '& input': {
                py: 3,
                height: '42px',
              },
            },
          }}
          sx={{
            width: { xs: '100%', md: 260 },
            '& .MuiOutlinedInput-root': {
              height: '42px',
              border: '1px solid #e7e7e7',
              borderBottom: '3px solid #e7e7e7',
              borderRadius: 1,
            },
          }}
        />
      </Stack>
      {campaign?.shortlisted?.length > 0 ? (
        <>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            }}
            gap={2}
            sx={{
              width: '100%',
              '& > *': {
                minWidth: 0,
                height: '100%',
              },
            }}
          >
            {filteredCreators?.map((elem) => (
              <UserCard
                key={elem?.id}
                creator={elem?.user}
                campaignId={campaign?.id}
                campaign={campaign}
                isSent={elem.isSent}
                onEditAgreement={() => handleEditAgreement(elem)}
                agreementStatus={elem.agreementStatus}
                campaignMutate={campaignMutate}
              />
            ))}
          </Box>
          {filteredCreators?.length < 1 && (
            <EmptyContent title={`No Creator with name "${query}" Found`} />
          )}
        </>
      ) : (
        <EmptyContent title="No Shortlisted Creator." />
      )}
    </Stack>
  );
};

export default PublicCreatorDetail;

PublicCreatorDetail.propTypes = {
  campaign: PropTypes.any,
  campaignMutate: PropTypes.func,
};
