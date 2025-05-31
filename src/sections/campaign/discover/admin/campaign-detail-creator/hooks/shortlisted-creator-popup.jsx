import { Snackbar, Alert, Typography, Box } from '@mui/material';
import { useShortlistedCreators } from './shortlisted-creator';
import { useAuthContext } from 'src/auth/hooks';

const ShortlistedCreatorPopUp = () => {
 
  const showPopup = useShortlistedCreators((state) => state.showPopup);
  const popupMessage = useShortlistedCreators((state) => state.popupMessage);
  const hidePopup = useShortlistedCreators((state) => state.hidePopup);

  //Handle manual close of popup
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    hidePopup();
  };

  // return <div style={{ background: 'red', padding: 20 }}>Test Popup</div>;

  return (
    <Snackbar
      open={showPopup}
      onClose={handleClose}
      sx={{
        top: '50% !important',
        left: '50% !important',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
        width: '100%',
        maxWidth: 400, // To be adjusted
      }}
    >
      <Alert 
        onClose={handleClose} 
        severity="success" 
        sx={{ 
          width: '100%', 
          height: '100%', // To be adjusted 
          bgcolor: '#203ff5',
          color: '#ffffff',
          borderRadius: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          '& .MuiAlert-icon': {
            color: '#ffffff'
          }
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {popupMessage}
            
          </Typography>
          
        </Box>
      </Alert>
    </Snackbar>
    
  );
};

export default ShortlistedCreatorPopUp;
