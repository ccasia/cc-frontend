/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { mutate } from 'swr';
import { useNavigate } from 'react-router-dom';
import { IconButton, Button } from '@mui/material';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useGetThreadById } from 'src/api/chat';
import Autocomplete from '@mui/material/Autocomplete';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';
import SearchNotFound from 'src/components/search-not-found';
import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function ChatHeaderCompose({ currentUserId, threadId }) {
  const { user } = useAuthContext();
  const { thread,  error } = useGetThreadById(threadId);

  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState();
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  if (error) {
    return <Typography variant="h6">Error loading thread</Typography>;
  }

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await axiosInstance.get(endpoints.users.allusers);
        const filteredContacts = response.data.filter((user) => user.id !== currentUserId);
        setContacts(filteredContacts);
        //  console.log('FIlted contacts', filteredContacts);

        //  console.log('Api Response', response.data) // Assuming response.data contains an array of users
      } catch (error) {
        console.error('Error fetching users:', error);
        // Handle error fetching users
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [currentUserId]);

  const otherUser = thread?.UserThread.find(u => u.userId !== currentUserId);
  const otherUserName = otherUser ? otherUser.user.name : 'Unknown User';

  console.log("User", otherUser)

  useEffect(() => {
  }, [selectedContact]);

  const handleChange = (_event, newValue) => {
    console.log('newValue:', newValue);
    setSelectedContact(newValue);
    console.log('selectedContact:', newValue);
    createThread(newValue);
  };

  const createThread = async (recipient) => {
    if (!recipient || !recipient.id) {
      console.error('Invalid recipient:', recipient);
      return;
    }

    try {
      const recipientId = recipient.id;

      const existingThreadResponse = await axiosInstance.get(endpoints.threads.getAll);
      const existingThread = existingThreadResponse.data.find((thread) => {
        const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);
        return (
          userIdsInThread.includes(currentUserId) &&
          userIdsInThread.includes(recipientId) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        //  console.log('Thread already exists:', existingThread);
        navigate(`/dashboard/chat/thread/${existingThread.id}`);
      } else {
        const response = await axiosInstance.post(endpoints.threads.create, {
          title: ` Chat between ${user.name} & ${recipient.name}`,
          description: '',
          userIds: [currentUserId, recipientId],
          isGroup: false,
        });

        mutate(endpoints.threads.getAll);

        navigate(`/dashboard/chat/thread/${response.data.id}`);
      }
      router.push(threadPath);
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  return (
    <>
      <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Flex Start: Thread information */}
    <Box width="200px" sx={{ display: 'flex', alignItems: 'center' }}>
    {thread ? (
    <>
      
      {/* Display group chat title or single chat other user name */}
      {thread.isGroup ? (
        <>
          <Avatar alt={thread.title} src={thread.photoURL} sx={{ width: 32, height: 32, mr: 1 }} />
          <Typography variant="h6">{thread.title}</Typography> 
        </>  
      ) : (
        <>
        <Avatar alt={otherUserName} src={otherUser.user.photoURL} sx={{ width: 32, height: 32, mr: 1 }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Typography variant="body" paddingRight={2} sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}>
        {otherUserName}
        <Iconify icon="material-symbols:verified" style={{ color: '#1340FF', paddingLeft: 1 }} />
      </Typography>
      <Typography variant="body2" sx={{fontSize: '10px'}}>Available</Typography>
    </Box>     
        </>  
      )}
    </>
  ) : (
    <Typography variant="h6">Thread not found</Typography>
  )}
    </Box>

      {/* Flex Center: Autocomplete component */}
      {/* <Box sx={{ flexGrow: 1, mx: 2 }}>
        <Autocomplete
          width="20px"
          popupIcon={null}
          disablePortal
          noOptionsText={<SearchNotFound query={contacts} />}
          onChange={handleChange}
          options={contacts}
          getOptionLabel={(recipient) => recipient.name}
          renderInput={(params) => <TextField {...params} placeholder="Search recipients" />}
          renderOption={(props, recipient) => (
            <li {...props} key={recipient.id}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar alt={recipient.name} src={recipient.photoURL} sx={{ width: 32, height: 32, mr: 1 }} />
                <div>
                  <Typography variant="body1">{recipient.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {recipient.email}
                  </Typography>
                </div>
              </Box>
            </li>
          )}
        />
      </Box> */}

      {/* Flex End: Icon buttons */}
      <Box paddingLeft={1} sx={{ display: 'flex', alignItems: 'center' }}>
        <Button width="100px"
          sx={{
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            display: 'flex',
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '8px 16px', 
            textTransform: 'none',
          }}>
          <Iconify icon="tabler:archive" style={{color: 'black'}}  />
          Archive
        </Button>
        <IconButton  sx={{
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '12px', 
          }}>
          <Iconify icon="tabler:info-circle"   sx={{ color: 'black' }} />
        </IconButton>
      </Box>
    </Box>

      {/* {(isAdmin || isSuperAdmin) && contacts.length > 0 && (
        <Autocomplete
          sx={{ minWidth: 320 }}
          popupIcon={null}
          disablePortal
          noOptionsText={<SearchNotFound query={contacts} />}
          onChange={handleChange}
          options={contacts}
          getOptionLabel={(recipient) => recipient.name}
          renderInput={(params) => <TextField {...params} placeholder="Search recipients" />}
          renderOption={(props, recipient, { selected }) => (
            <li {...props} key={recipient.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Avatar
                  alt={recipient.name}
                  src={recipient.photoURL}
                  sx={{ width: 32, height: 32, mr: 1 }}
                />
                <div>
                  <Typography variant="body1">{recipient.name}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {recipient.email}
                  </Typography>
                </div>
              </Box>
            </li>
          )} 

          //  renderTags={(selected, getTagProps) =>
          //    selected.map((recipient, index) => (
          //      <Chip
          //        {...getTagProps({ index })}
          //        key={recipient.id}
          //        label={recipient.name}
          //        avatar={<Avatar alt={recipient.name} src={recipient.avatarUrl} />}
          //        size="small"
          //        variant="soft"
          //      />
          //    ))
          //  } 
        />
      )} */} 
    </>
  );
}

ChatHeaderCompose.propTypes = {
  // onAddRecipients: PropTypes.func.isRequired,
  currentUserId: PropTypes.string,
};

// const existingThread = existingThreadResponse.data.find(thread =>
//   thread.UserThread.some(userThread =>
//     (userThread.userId === currentUserId || userThread.userId === recipientId) &&
//     thread.UserThread.some(ut =>
//       (ut.userId === recipientId || ut.userId === currentUserId)
//     )
//   )
// );
