import PropTypes from 'prop-types';
import { formatDistanceToNowStrict } from 'date-fns';

import { Box, Stack, Typography } from '@mui/material';

import { BLUE } from './stages';
import { OverviewCard } from './parts';

const MAX_ITEMS = 4;

export default function LatestUpdates({ updates }) {
  const items = [...updates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, MAX_ITEMS);

  return (
    <OverviewCard
      title="Latest updates"
      aside={
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          From the campaign team
        </Typography>
      }
    >
      {!items.length && (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Updates from the campaign team will show here.
        </Typography>
      )}

      <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Stack key={item.id} component="li" direction="row" spacing={1.5}>
              <Stack alignItems="center" sx={{ pt: 0.625 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    flex: 'none',
                    borderRadius: '50%',
                    bgcolor: index === 0 ? BLUE : 'grey.400',
                  }}
                />
                {!last && <Box sx={{ width: '1px', flex: 1, mt: 0.5, bgcolor: 'divider' }} />}
              </Stack>
              <Box sx={{ pb: last ? 0 : 2, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13 }}>{item.message}</Typography>
                <Typography sx={{ mt: 0.25, fontSize: 11, color: 'text.secondary' }}>
                  {[
                    'Admin',
                    item.section,
                    formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </Box>
            </Stack>
          );
        })}
      </Box>
    </OverviewCard>
  );
}

LatestUpdates.propTypes = {
  updates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      section: PropTypes.string,
      createdAt: PropTypes.string.isRequired,
    })
  ).isRequired,
};
