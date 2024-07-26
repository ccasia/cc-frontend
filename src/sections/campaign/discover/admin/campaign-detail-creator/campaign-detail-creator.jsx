import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

import { Box, Stack, TextField, InputAdornment } from '@mui/material';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import UserCard from './user-card';

const CampaignDetailCreator = ({ campaign }) => {
  // eslint-disable-next-line no-unused-vars
  const [query, setQuery] = useState(null);

  const filteredData = useMemo(
    () =>
      query
        ? campaign?.ShortListedCreator.filter((elem) =>
            elem.creator.name.toLowerCase().includes(query.toLowerCase())
          )
        : campaign?.ShortListedCreator,
    [campaign, query]
  );

  return (
    <Stack gap={3}>
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
      {campaign?.ShortListedCreator.length > 0 ? (
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
              <UserCard key={elem.id} creator={elem?.creator} campaignId={campaign?.id} />
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
  );
};

export default CampaignDetailCreator;

CampaignDetailCreator.propTypes = {
  campaign: PropTypes.object,
};
