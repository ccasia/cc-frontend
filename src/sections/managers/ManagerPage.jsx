import React, { useState } from 'react';

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
// import { useTheme } from '@mui/material/styles';

import { useSettingsContext } from 'src/components/settings';
import { Button, Modal } from '@mui/material';
import FormModal from './FormModal';

// import UserListView from './Adminlist';
// ----------------------------------------------------------------------
// import UserListView from './UserListView';

function managerPage() {
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5 }}>
        <Box sx={{ pb: 5, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h4" gutterBottom>
            Manager Page
          </Typography>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            invite
          </Button>
        </Box>
      </Box>
      <FormModal isEditing={isEditing} handleSaveClick={handleSaveClick} />
      
    </Container>
  );
}

export default managerPage;
