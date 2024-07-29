/* eslint-disable */ 
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import { useBoolean } from 'src/hooks/use-boolean';

import axios from 'axios';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ChatRoomSingle({ id }) {
  const collapse = useBoolean(true);
  const [user, setUser] = useState(null); // State to hold user data

  useEffect(() => {
    // Function to fetch user details based on userId
    async function fetchUser() {
      try {
        const response = await axios.get(`https://localhost:3002/users/${id}`); 
        setUser(response.data); // Update state with fetched user data
      } catch (error) {
        console.error('Error fetching user:', error);
        // Handle error fetching user data
      }
    }

    fetchUser(); // Call the function to fetch user data
  }, [id]); // Fetch data when userId changes

  if (!user) {
    return <Typography variant="body2">Loading user...</Typography>; // Show loading indicator while fetching data
  }

  const { name, avatarUrl, role, address, phoneNumber, email } = user;

  const renderInfo = (
    <Stack alignItems="center" sx={{ py: 5 }}>
      <Avatar alt={name} src={avatarUrl} sx={{ width: 96, height: 96, mb: 2 }} />
      <Typography variant="subtitle1">{name}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {role}
      </Typography>
    </Stack>
  );

  const renderBtn = (
    <ListItemButton
      onClick={collapse.onToggle}
      sx={{
        pl: 2.5,
        pr: 1.5,
        height: 40,
        flexShrink: 0,
        flexGrow: 'unset',
        typography: 'overline',
        color: 'text.secondary',
        bgcolor: 'background.neutral',
      }}
    >
      <Box component="span" sx={{ flexGrow: 1 }}>
        Information
      </Box>
      <Iconify
        width={16}
        icon={collapse.value ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
      />
    </ListItemButton>
  );

  const renderContent = (
    <Stack
      spacing={2}
      sx={{
        px: 2,
        py: 2.5,
        '& svg': {
          mr: 1,
          flexShrink: 0,
          color: 'text.disabled',
        },
      }}
    >
      <Stack direction="row">
        <Iconify icon="mingcute:location-fill" />
        <Typography variant="body2">{address}</Typography>
      </Stack>

      <Stack direction="row">
        <Iconify icon="solar:phone-bold" />
        <Typography variant="body2">{phoneNumber}</Typography>
      </Stack>

      <Stack direction="row">
        <Iconify icon="fluent:mail-24-filled" />
        <Typography variant="body2" noWrap>
          {email}
        </Typography>
      </Stack>
    </Stack>
  );

  return (
    <>
      {renderInfo}

      {renderBtn}

      <div>
        <Collapse in={collapse.value}>{renderContent}</Collapse>
      </div>
    </>
  );
}

ChatRoomSingle.propTypes = {
  id: PropTypes.string,
};
