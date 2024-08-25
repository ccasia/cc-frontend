import PropTypes from 'prop-types';
import React, { useMemo } from 'react';

import { Box, Paper, Stack, Button, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import ListLogistics from '../list-logistic';
import CreateLogistic from '../create-logistics';

const LogisticView = ({ campaign, creator }) => {
  const form = useBoolean();
  const logistics = useMemo(
    () => campaign?.logistic.filter((logistic) => logistic.userId === creator.user.id),
    [campaign, creator]
  );

  return (
    <Box component={Paper} p={2}>
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography variant="h5">Logistics</Typography>
        <Button size="small" variant="contained" onClick={form.onTrue}>
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
