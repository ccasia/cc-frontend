import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import Step from '@mui/material/Step';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { styled } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

import ScheduleDeliveryDialog from './dialogs/schedule-delivery-dialog';

// ----------------------------------------------------------------------------

const QConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`&.${stepConnectorClasses.line}`]: {
      borderColor: '#00AB55',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#00AB55',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 2,
    borderRadius: 1,
  },
}));

const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  color: theme.palette.text.disabled,
  display: 'flex',
  height: 22,
  alignItems: 'center',
  ...(ownerState.active && {
    color: '#00AB55',
  }),
  '& .completed-icon': {
    color: '#00AB55',
    zIndex: 1,
    fontSize: 18,
  },
  '& .circle': {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
}));

function StepIcon(props) {
  const { active, completed, className } = props;

  return (
    <StepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <Iconify icon="eva:checkmark-fill" className="completed-icon" />
      ) : (
        <div className="circle" />
      )}
    </StepIconRoot>
  );
}

StepIcon.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string,
  completed: PropTypes.bool,
};

// ----------------------------------------------------------------------------
export default function LogisticsTableRow({ row, onUpdate }) {
  const { creator, status, items } = row;
  const [openSchedule, setOpenSchedule] = useState(false);

  let activeStep = 0;

  if (status === 'SCHEDULED') {
    activeStep = 0;
  } else if (status === 'SHIPPED' || status === 'DELIVERED') {
    activeStep = 1;
  } else if (status === 'RECEIVED' || status === 'COMPLETED') {
    activeStep = 2;
  }

  const hasIssue = status === 'ISSUE_REPORTED';

  const STEPS = ['Confirm Details', 'Delivery Scheduled', 'Receive Product'];

  return (
    <>
      <TableRow hover>
        {/* Column 1: Name */}
        <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar alt={creator?.name} src={creator?.photoURL} sx={{ mr: 2 }} />
          <ListItemText
            primary={creator?.name}
            primaryTypographyProps={{ typography: 'subtitle2' }}
          />
        </TableCell>
        {/* Column 2: Products */}
        <TableCell>
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
        <TableCell>
          {isIssue ? (
            <Box
              sx={{
                bgcolor: 'error.lighter',
                color: 'error.dark',
                p: 1,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: 'fit-content',
              }}
            >
              <Iconify icon="eva:alert-triangle-fill" width={20} />
              <Typography variant="subtitle2">Issue Reported</Typography>
            </Box>
          ) : (
            <Stepper alternativeLabel activeStep={activeStep} connector={<QConnector />}>
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={StepIcon}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
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
