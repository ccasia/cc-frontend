/* eslint-disable */
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { mutate } from 'swr';
import { useNavigate } from 'react-router-dom';


import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';
import SearchNotFound from 'src/components/search-not-found';
import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------


export default function ChatHeaderCompose({ currentUserId }) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState();
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await axiosInstance.get(endpoints.users.allusers);
        const filteredContacts = response.data.filter((user) => user.id !== currentUserId);
        setContacts(filteredContacts);
        console.log('FIlted contacts', filteredContacts);

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

  console.log('CUrrent user', currentUserId);

  useEffect(() => {
    console.log('selectedContact in useEffect:', selectedContact);
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

    // try {
    //   // Check if a thread already exists
    //   const existingThreadResponse = await axiosInstance.get(endpoints.threads.getAll, {

    //   });

    //   const existingThread = existingThreadResponse.data;
    //   console.log ("existing thread", existingThreadResponse)

    //   if (existingThread) {
    //     console.log('Thread already exists.');
    //   } else {
    //     // Create a new thread
    //     const response = await axiosInstance.post(endpoints.threads.create, {
    //       title: `${recipient.name}`,
    //       description: '',
    //       userIds: [currentUserId, recipient.id],
    //     });
    //     console.log('Thread created:', response.data);
    //     // Logic to open the newly created thread
    //     // e.g., navigate to the chat thread or display the new thread
    //   }
    // } catch (error) {
    //   console.error('Error handling thread creation or retrieval:', error);
    // }

    try {
      const recipientId = recipient.id;

    const existingThreadResponse = await axiosInstance.get(endpoints.threads.getAll);
    const existingThread = existingThreadResponse.data.find(thread => {
      const userIdsInThread = thread.UserThread.map(userThread => userThread.userId);
      return userIdsInThread.includes(currentUserId) && userIdsInThread.includes(recipientId) && !thread.isGroup
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
      console.log('Thread created:', response.data);

      console.log('Recipient ID:', recipientId);

      mutate(endpoints.threads.getAll);
      
      navigate(`/dashboard/chat/thread/${response.data.id}`);
     
     
      }
      router.push(threadPath);

    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  if (loading) {
    return <Typography variant="body2">Loading users...</Typography>;
  }

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
      {/* <Typography variant="subtitle2" sx={{ color: 'text.primary', mr: 2 }}>
      <Iconify
          width={24}
          icon="material-symbols:search-rounded" />
      </Typography> */}

      {(isAdmin || isSuperAdmin) && contacts.length > 0 && (
       <Autocomplete
       sx={{ minWidth: 320, }}
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
      )}
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