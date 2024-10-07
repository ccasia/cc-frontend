import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { ListItemText } from '@mui/material';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function CampaignSearch({ campaigns }) {
  const router = useRouter();
  return (
    <>
      {campaigns && (
        <Autocomplete
          freeSolo
          sx={{ width: { xs: 1, sm: 260 } }}
          options={campaigns}
          getOptionLabel={(option) => option.name}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search..."
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box
              {...props}
              component="div"
              onClick={() =>
                router.push(paths.dashboard.campaign.adminCampaignManageDetail(option?.id))
              }
            >
              <Avatar
                alt="Campaign Image"
                src={option?.campaignBrief?.images[0]}
                variant="rounded"
                sx={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  mr: 1.5,
                  borderRadius: 1,
                }}
              />
              <ListItemText
                primary={option?.name}
                secondary={option?.company?.name || option?.brand?.name}
              />
            </Box>
          )}
        />
      )}
    </>
  );
}

CampaignSearch.propTypes = {
  campaigns: PropTypes.array,
};
