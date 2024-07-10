/* eslint-disable */ 
import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';
// import { socket } from 'src/socket';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

//  import { useGetContacts } from 'src/api/chat';
import Iconify from 'src/components/iconify';
import SearchNotFound from 'src/components/search-not-found';
import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

// const socket = io('http://localhost:3002');

export default function ChatHeaderCompose({ currentUserId }) {
  const [searchRecipients, setSearchRecipients] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await axiosInstance.get(endpoints.users.allusers)
        const filteredContacts = response.data.filter(user => user.id !== currentUserId);
        setContacts(filteredContacts);
        
        //  console.log('Api Response', response.data) // Assuming response.data contains an array of users
      } catch (error) {
        console.error('Error fetching users:', error);
        // Handle error fetching users
      }
      finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }

    }

    fetchUsers();
  }, [currentUserId]);

  // useEffect(() => {
  //   // Listen for new messages
  //   socket.on('message', (data) => {
  //     console.log('New message:', data);
  //     // Handle new messages, e.g., update state or call a callback prop
  //   });

  //   return () => {
  //     // Cleanup listener on unmount
  //     socket.off('message');
  //   };
  // }, []);


  // const handleAddRecipients = useCallback(
  //   (selected) => {
  //     setSearchRecipients('');
  //     onAddRecipients(selected);
  //   },
  //   [onAddRecipients]
  // );

  if (loading) {
    return <Typography variant="body2">Loading users...</Typography>; 
  }

  return (
    <>
      <Typography variant="subtitle2" sx={{ color: 'text.primary', mr: 2 }}>
        Search:
      </Typography>

      {contacts.length > 0 && (
        <Autocomplete
          sx={{ minWidth: 320 }}
          popupIcon={null}
          defaultValue={[]}
          disablePortal 
          noOptionsText={<SearchNotFound query={searchRecipients} />}
          onChange={(event, newValue) => {
            if (newValue) {
              console.log(newValue.id); // Log the ID of the selected recipient
            }
          }}
        
          onInputChange={(event, newValue) => setSearchRecipients(newValue)}
          options={contacts}
          getOptionLabel={(recipient) => recipient.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} placeholder="Campaigns" />}
          renderOption={(props, recipient, { selected }) => (
            <li {...props} key={recipient.id}>
              <Box
                key={recipient.id}
                sx={{
                  mr: 1,
                  width: 32,
                  height: 32,
                  overflow: 'hidden',
                  borderRadius: '50%',
                  position: 'relative',
                }}
              >
                <Avatar alt={recipient.name} src={recipient.avatarUrl} sx={{ width: 1, height: 1 }} />
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{
                    top: 0,
                    left: 0,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    position: 'absolute',
                    bgcolor: (theme) => alpha(theme.palette.grey[900], 0.8),
                    transition: (theme) =>
                      theme.transitions.create(['opacity'], {
                        easing: theme.transitions.easing.easeInOut,
                        duration: theme.transitions.duration.shorter,
                      }),
                    ...(selected && {
                      opacity: 1,
                      color: 'primary.main',
                    }),
                  }}
                >
                  <Iconify icon="eva:checkmark-fill" />
                </Stack>
              </Box>

              {recipient.name}
            </li>
          )}
          renderTags={(selected, getTagProps) =>
            selected.map((recipient, index) => (
              <Chip
                {...getTagProps({ index })}
                key={recipient.id}
                label={recipient.name}
                avatar={<Avatar alt={recipient.name} src={recipient.avatarUrl} />}
                size="small"
                variant="soft"
              />
            ))
          }
        />
      )}
    </>

  
  );
}

ChatHeaderCompose.propTypes = {
 onAddRecipients: PropTypes.func.isRequired,
 currentUserId: PropTypes.string,
};
