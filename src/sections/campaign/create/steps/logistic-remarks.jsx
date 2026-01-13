import React from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Box,
  TextField,
  Typography
} from '@mui/material';

const LogisticRemarks = () => {
  const { register } = useFormContext();

  return (
    <Box sx={{ py: 5 }}>
      {/* Content */}
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography 
          sx={{ 
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '24px',
            color: '#231F20',
            mb: 1
          }}
        >
          Remark for Creators
        </Typography>
        
        <Typography 
          sx={{ 
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            lineHeight: '20px',
            color: '#636366',
            mb: 2
          }}
        >
          Add details you want to send to all participants. This could include:
        </Typography>

        <Box sx={{ pl: 2, mb: 3 }}>
          {[
            'Payment arrangement (Sponsored/Paid by creator)',
            'Venue policies (No pets allowed, Dress code...)',
            'Cancellation penalties',
            'Instructions (Product Pick up, Registration...)',
            'Rules/Disclaimers',
            'You may also include links to menus or any documents here'
          ].map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
              <Box 
                component="span" 
                sx={{ 
                  width: '4px', 
                  height: '4px', 
                  borderRadius: '50%', 
                  bgcolor: '#636366', 
                  display: 'inline-block',
                  mt: 1.5,
                  mr: 1.5
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Inter Display, sans-serif',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '18px',
                  color: '#636366'
                }}
              >
                {item}
              </Typography>
            </Box>
          ))}
        </Box>

        <TextField
          {...register('logisticRemarks')}
          placeholder="Type your remarks here..."
          multiline
          rows={6}
          fullWidth
          sx={{
            maxWidth: '780px',
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              fontFamily: 'Inter Display, sans-serif',
              fontSize: '14px',
              lineHeight: '20px'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default LogisticRemarks;
