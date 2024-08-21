import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { Typography } from '@mui/material';

import Iconify from 'src/components/iconify';


// ----------------------------------------------------------------------

export default function ChatRoomGroup({thread}) {

  const renderContent = (
    <Box  
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: 2,
        padding: 1, 
      }} >

      <Avatar alt={thread.name} src={thread.photoURL}
      sx={{ alignContent:'center', cursor: 'pointer', width: 108, height: 108, margin: 2 }} />
      
      <Typography variant="h6" align="center" sx={{ marginBottom: 2 }}>
        {thread.title}
      </Typography>
      
      <Typography variant="body1" align="center" sx={{ marginBottom: 2 }}>
        {thread.description}
      </Typography>
      
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        justifyContent="center"
      >
        <Iconify
          width={24}
          icon="material-symbols:groups" />
        <Typography variant="body2">
          Total Participants: {thread.userCount}
        </Typography>
      </Stack>
      </Box>
 
  );

  return (
    <>
   
    {renderContent}

      {/* <div>
        <Collapse in={collapse.value}>{renderContent}</Collapse>
      </div>

      {selected && (
        <ChatRoomParticipantDialog participant={selected} open={!!selected} onClose={handleClose} />
      )} */}
    </>
  );
}

ChatRoomGroup.propTypes = {
  thread: PropTypes.object.isRequired,
  //  participants: PropTypes.array,
};
