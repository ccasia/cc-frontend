import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Box,
  Table,
  Paper,
  Stack,
  Button,
  Dialog,
  Avatar,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export const CampaignLog = ({ open, campaign, onClose }) => {
  const rows =
    campaign &&
    campaign.campaignLogs.map((log) => ({
      id: log.id,
      datePerformed: dayjs(log.createdAt).format('MMM D, YYYY • h:mm A'),
      action: log.message,
      performedBy: log.admin.name,
    }));

  const campaignImage = campaign?.campaignBrief?.images?.[0] || '';
  
  // fallback
  const getFirstLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'C');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: (theme) => theme.customShadows.dialog,
          overflow: 'hidden',
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Iconify icon="eva:close-fill" width={24} />
        </IconButton>
      
        <DialogTitle sx={{ pt: 3, pb: 2.5, pr: 6 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {campaignImage ? (
              <Box
                component="img"
                src={campaignImage}
                alt={campaign?.name || 'Campaign'}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  boxShadow: (theme) => theme.customShadows.z8,
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  fontSize: 24,
                }}
              >
                {getFirstLetter(campaign?.name)}
              </Avatar>
            )}
            
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: 'InterDisplay',
                  fontWeight: 600,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Campaign Log
              </Typography>
              
              {campaign?.name && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    mt: 0.5,
                  }}
                >
                  {campaign.name}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogTitle>
      </Paper>

      <DialogContent sx={{ p: 0 }}>
        <Scrollbar sx={{ maxHeight: '60vh' }}>
          {rows?.length > 0 ? (
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    width="25%"
                    sx={{
                      pl: 3,
                      py: 2,
                      fontWeight: 600,
                      color: 'text.secondary',
                      backgroundColor: 'background.neutral',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    Date & Time
                  </TableCell>
                  <TableCell
                    width="50%"
                    sx={{
                      py: 2,
                      fontWeight: 600,
                      color: 'text.secondary',
                      backgroundColor: 'background.neutral',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    Action
                  </TableCell>
                  <TableCell
                    width="25%"
                    sx={{
                      pr: 3,
                      py: 2,
                      fontWeight: 600,
                      color: 'text.secondary',
                      backgroundColor: 'background.neutral',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    Performed By
                  </TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {rows.map((row) => {
                  // Select icon based on action type
                  let actionIcon = 'material-symbols:info-outline';
                  
                  if (row.action.toLowerCase().includes('created')) {
                    actionIcon = 'solar:add-circle-linear';
                  } else if (row.action.toLowerCase().includes('updated')) {
                    actionIcon = 'solar:pen-2-linear';
                  } else if (row.action.toLowerCase().includes('deleted') || 
                            row.action.toLowerCase().includes('removed')) {
                    actionIcon = 'solar:trash-bin-trash-linear';
                  } else if (row.action.toLowerCase().includes('approved')) {
                    actionIcon = 'material-symbols:check-circle-outline';
                  } else if (row.action.toLowerCase().includes('rejected')) {
                    actionIcon = 'solar:close-circle-linear';
                  } else if (row.action.toLowerCase().includes('shortlisted')) {
                    actionIcon = 'material-symbols:star-outline';
                  }
                  
                  return (
                    <TableRow 
                      key={row.id} 
                      hover
                      sx={{
                        transition: 'background-color 0.2s',
                        '&:last-of-type td': { 
                          borderBottom: 0 
                        },
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          pl: 3,
                          py: 2,
                          color: 'text.secondary',
                          borderBottom: '1px dashed',
                          borderColor: 'divider',
                        }}
                      >
                        {row.datePerformed}
                      </TableCell>
                      
                      <TableCell 
                        sx={{ 
                          py: 2,
                          borderBottom: '1px dashed',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              p: 0.5,
                              borderRadius: '50%',
                              color: 'primary.main',
                              bgcolor: 'primary.lighter',
                            }}
                          >
                            <Iconify icon={actionIcon} width={18} />
                          </Box>
                          {row.action}
                        </Box>
                      </TableCell>
                      
                      <TableCell 
                        sx={{ 
                          pr: 3,
                          py: 2,
                          fontWeight: 500,
                          borderBottom: '1px dashed',
                          borderColor: 'divider',
                        }}
                      >
                        {row.performedBy}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Box
              sx={{
                p: 5,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:notebook-broken"
                width={48}
                height={48}
                sx={{ 
                  opacity: 0.5,
                  mb: 2,
                  color: 'text.secondary',
                }}
              />
              <Typography variant="h6" gutterBottom>
                No Log Entries
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No actions have been recorded for this campaign yet.
              </Typography>
            </Box>
          )}
        </Scrollbar>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: 'background.neutral',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: 'grey.200',
            color: 'grey.800',
            '&:hover': {
              bgcolor: 'grey.300',
            },
            borderRadius: 1,
            boxShadow: 'none',
            textTransform: 'none',
            px: 3,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CampaignLog.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
