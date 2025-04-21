import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import UserCard from './user-card';

// ----------------------------------------------------------------------

export default function UserCardList({ creators }) {
  return (
    <Box
      gap={2}
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)',
      }}
      sx={{
        mt: 2.5,
        pb: 2,
      }}
    >
      {creators?.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </Box>
  );
}

UserCardList.propTypes = {
  creators: PropTypes.array.isRequired,
};
