import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import CampaignItem from './campaign-item';

// ----------------------------------------------------------------------

export default function CampaignLists({ campaigns }) {
  // const [page, setPage] = useState(1);
  // const MAX_ITEM = 9;

  // const handleChange = (event, value) => {
  //   setPage(value);
  // };

  // const indexOfLastItem = page * MAX_ITEM;
  // const indexOfFirstItem = indexOfLastItem - MAX_ITEM;

  return (
    <>
      <Box
        gap={2}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {/* {campaigns?.slice(indexOfFirstItem, indexOfLastItem)?.map((campaign) => (
          <CampaignItem key={campaign.id} campaign={campaign} status={campaign?.status} />
        ))} */}
        {campaigns?.map((campaign) => (
          <CampaignItem key={campaign?.id} campaign={campaign} status={campaign?.status} />
        ))}
      </Box>

      {/* {campaigns?.length > 9 && (
        <Pagination
          count={Math.ceil(campaigns.length / MAX_ITEM)}
          page={page}
          onChange={handleChange}
          sx={{
            mt: 8,
            [`& .${paginationClasses.ul}`]: {
              justifyContent: 'center',
            },
          }}
        />
      )} */}
    </>
  );
}

CampaignLists.propTypes = {
  campaigns: PropTypes.array,
};
