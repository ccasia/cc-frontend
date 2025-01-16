import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Box, Paper, Stack, Button, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import ListLogistics from '../list-logistic';
import CreateLogistic from '../create-logistics';
import { useAuthContext } from 'src/auth/hooks';

const LogisticView = ({ campaign, creator }) => {
  const form = useBoolean();
  const { user } = useAuthContext();

  const logistics = useMemo(
    () => campaign?.logistic.filter((logistic) => logistic.userId === creator.user.id),
    [campaign, creator]
  );

  const isDisabled = useMemo(() => {
    return (
      user?.admin?.mode === 'advanced' ||
      !campaign?.campaignAdmin?.some((adminObj) => adminObj?.admin?.user?.id === user?.id)
    );
  }, [user, campaign]);

  return (
    <Box component={Paper} p={2}>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography variant="h5">Logistics</Typography>
        <Button size="small" variant="contained" onClick={form.onTrue} disabled={isDisabled}>
          Create new Logistic
        </Button>
      </Stack>
      <Box my={2}>
        <ListLogistics logistics={logistics} />
      </Box>
      <CreateLogistic form={form} campaign={campaign} creator={creator} />
    </Box>
  );
};

export default LogisticView;

LogisticView.propTypes = {
  campaign: PropTypes.object,
  creator: PropTypes.object,
};
