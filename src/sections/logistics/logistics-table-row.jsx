import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
// import Step from '@mui/material/Step';
// import Stepper from '@mui/material/Stepper';
// import StepLabel from '@mui/material/StepLabel';
// import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

import ScheduleDeliveryDialog from './dialogs/schedule-delivery-dialog';

// ----------------------------------------------------------------------------

// const QConnector = styled(StepConnector)(({ theme }) => ({
//   [`&.${stepConnectorClasses.alternativeLabel}`]: {
//     top: 10,
//     left: 'calc(-50% + 16px)',
//     right: 'calc(50% + 16px)',
//   },
//   [`&.${stepConnectorClasses.active}`]: {
//     [`&.${stepConnectorClasses.line}`]: {
//       borderColor: '#00AB55',
//     },
//   },
//   [`&.${stepConnectorClasses.completed}`]: {
//     [`& .${stepConnectorClasses.line}`]: {
//       borderColor: '#00AB55',
//     },
//   },
//   [`& .${stepConnectorClasses.line}`]: {
//     borderColor: theme.palette.divider,
//     borderTopWidth: 2,
//     borderRadius: 1,
//   },
// }));

// const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
//   color: theme.palette.text.disabled,
//   display: 'flex',
//   height: 22,
//   alignItems: 'center',
//   ...(ownerState.active && {
//     color: '#00AB55',
//   }),
//   '& .completed-icon': {
//     color: '#00AB55',
//     zIndex: 1,
//     fontSize: 18,
//   },
//   '& .circle': {
//     width: 8,
//     height: 8,
//     borderRadius: '50%',
//     backgroundColor: 'currentColor',
//   },
// }));

// function StepIcon(props) {
//   const { active, completed, className } = props;

//   return (
//     <StepIconRoot ownerState={{ active }} className={className}>
//       {completed ? (
//         <Iconify icon="eva:checkmark-fill" className="completed-icon" />
//       ) : (
//         <div className="circle" />
//       )}
//     </StepIconRoot>
//   );
// }

// StepIcon.propTypes = {
//   active: PropTypes.bool,
//   className: PropTypes.string,
//   completed: PropTypes.bool,
// };

// ----------------------------------------------------------------------------
export default function LogisticsTableRow({ row, onUpdate }) {
  const { creator, status, items } = row;
  const [openSchedule, setOpenSchedule] = useState(false);

  const getStatusConfig = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING_ASSIGNMENT':
        return {
          label: 'UNASSIGNED',
          color: '#B0B0B0',
          hasAction: true,
        };
      case 'SCHEDULED':
        return {
          label: 'YET TO SHIP',
          color: '#FF9A02',
          hasAction: true,
        };
      case 'SHIPPED':
        return {
          label: 'SHIPPED OUT',
          color: '#8A5AFE',
          hasAction: false,
        };
      case 'DELIVERED':
        return {
          label: 'DELIVERED',
          color: '#1ABF66',
          hasAction: false,
        };
      case 'RECEIVED':
      case 'COMPLETED':
        return {
          label: 'COMPLETED',
          color: '#1ABF66',
          hasAction: false,
        };
      case 'ISSUE_REPORTED':
        return {
          label: 'FAILED',
          color: '#D4321C',
          hasAction: true,
        };
      default:
        return {
          label: currentStatus,
          color: '#B0B0B0',
          hasAction: false,
        };
    }
  };
  const configCurrentStatus = getStatusConfig(status);

  const isUnassigned = !items || items.length === 0;
  // const finalStatus = isUnassigned ? getStatusConfig('PENDING_ASSIGNMENT') : configCurrentStatus;
  const finalStatus = getStatusConfig('SHIPPED');

  return (
    <>
      <TableRow hover>
        {/* Column 1: Name */}
        <TableCell sx={{ display: 'flex', alignItems: 'center', width: '40%' }}>
          <Avatar alt={creator?.name} src={creator?.photoURL} sx={{ mr: 2 }} />
          <ListItemText
            primary={creator?.name}
            primaryTypographyProps={{ typography: 'subtitle2' }}
          />
        </TableCell>
        {/* Column 2: Products */}
        <TableCell sx={{ width: '40%' }}>
          {items && items.length > 0 ? (
            <Box display="flex" flexDirection="column">
              {items.map((item, index) => (
                <Typography key={index} variant="body2">
                  {item.product?.productName} ({item.quantity})
                </Typography>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          )}
        </TableCell>
        {/* Column 3: Status */}
        <TableCell sx={{ width: '20%', textAlign: 'right' }}>
          <Box sx={{ display: 'flex', pr: 2 }}>
            <Box
              onClick={finalStatus.onClick}
              // sx={{
              //   position: 'relative',
              //   display: 'inline-flex',
              //   alignItems: 'center',
              //   justifyContent: 'center',
              //   minWidth: 120,
              //   height: 36,
              //   px: 2,
              //   borderRadius: 1,
              //   border: `1px solid ${finalStatus.color}`,
              //   bgcolor: 'transparent',
              //   cursor: finalStatus.onClick ? 'pointer' : 'default',
              //   transition: 'all 0.2s',
              //   '&:hover': finalStatus.onClick ? { bgcolor: `${finalStatus.color}14` } : {},
              // }}
              sx={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                // minWidth: { xs: 80, sm: 110, md: 130 },
                width: 'fit-content',
                height: { xs: 28, sm: 30 },
                padding: { xs: '4px 8px', sm: '6px 10px' },
                borderRadius: '6px',
                border: `1px solid ${finalStatus.color}`,
                boxShadow: `0px -2px 0px 0px ${finalStatus.color} inset`,
                backgroundColor: '#FFFFFF',
                color: finalStatus.color,
                fontSize: { xs: 8, sm: 10, md: 12 },
                fontWeight: 600,
                textTransform: 'uppercase',
                '&:hover': {
                  backgroundColor: '#F8F9FA',
                  border: `1px solid ${finalStatus.color}`,
                  boxShadow: `0px -2px 0px 0px ${finalStatus.color} inset`,
                },
                '&:active': {
                  boxShadow: `0px -1px 0px 0px ${finalStatus.color} inset`,
                  transform: 'translateY(1px)',
                },
              }}
            >
              <Typography
                variant="subtitle2"
                // sx={{
                //   width: { xs: 80, sm: 110, md: 130 },
                //   height: { xs: 28, sm: 30 },
                //   padding: { xs: '4px 8px', sm: '6px 10px' },
                //   borderRadius: '6px',
                //   border: '1px solid #E7E7E7',
                //   boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                //   backgroundColor: '#FFFFFF',
                //   color: finalStatus.color,
                //   fontSize: { xs: 8, sm: 10, md: 12 },
                //   fontWeight: 600,
                //   textTransform: 'uppercase',
                //   '&:hover': {
                //     backgroundColor: '#F8F9FA',
                //     border: '1px solid #E7E7E7',
                //     boxShadow: '0px -2px 0px 0px #E7E7E7 inset',
                //   },
                //   '&:active': {
                //     boxShadow: '0px -1px 0px 0px #E7E7E7 inset',
                //     transform: 'translateY(1px)',
                //   },
                // }}
              >
                {finalStatus.label}
              </Typography>
            </Box>
          </Box>
        </TableCell>
      </TableRow>
      <ScheduleDeliveryDialog
        open={openSchedule}
        onClose={() => setOpenSchedule(false)}
        logistic={row}
        onUpdate={onUpdate}
      />
    </>
  );
}

LogisticsTableRow.propTypes = {
  row: PropTypes.object,
  onUpdate: PropTypes.func,
};
