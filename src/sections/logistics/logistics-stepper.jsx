import PropTypes from 'prop-types';
import { useState } from 'react';
import { format } from 'date-fns';

import {
  Box,
  Step,
  Button,
  Stepper,
  StepLabel,
  Typography,
  StepContent,
  styled,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const StepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: '#EFEFEF',
  zIndex: 1,
  color: '#EFEFEF',
  width: 24,
  height: 24,
  display: 'flex',
  borderRadius: '50%',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #EFEFEF',
  ...(ownerState.active && {
    borderColor: '#1340FF',
    backgroundColor: '#1340FF',
    color: '#fff',
  }),
  ...(ownerState.completed && {
    borderColor: '#1ABF66',
    backgroundColor: '#1ABF66',
    color: '#fff',
  }),
  ...(ownerState.error && {
    borderColor: theme.palette.error.main,
    backgroundColor: theme.palette.error.main,
    color: '#fff',
  }),
}));

function CustomStepIcon(props) {
  const { active, completed, error } = props;

  return (
    <StepIconRoot ownerState={{ active, completed, error }}>
      {error ? (
        <Iconify icon="eva:close-fill" width={16} />
      ) : completed ? (
        <Iconify icon="eva:checkmark-fill" width={16} />
      ) : (
        <Iconify icon="solar:clock-circle-bold" width={16} />
      )}
    </StepIconRoot>
  );
}

CustomStepIcon.propTypes = {
  active: PropTypes.bool,
  completed: PropTypes.bool,
  error: PropTypes.bool,
};

export default function LogisticsStepper({ logistic }) {
  if (!logistic) return null;

  const { status, deliveryDetails } = logistic;

  // Determine Active Step Index based on status
  let activeStep = 0;
  if (status === 'PENDING_ASSIGNMENT') activeStep = 0;
  else if (status === 'SCHEDULED') activeStep = 1;
  else if (status === 'SHIPPED')
    activeStep = 2; // "Out for delivery" logic
  else if (['DELIVERED', 'RECEIVED', 'COMPLETED'].includes(status)) activeStep = 4;
  else if (status === 'ISSUE_REPORTED') activeStep = 3; // Trigger error state on step 3/4

  const isIssue = status === 'ISSUE_REPORTED';

  const steps = [
    {
      step: 1,
      label: 'Assign Product',
      description: 'Assign product to creator',
      completedDate: logistic.updatedAt,
      color: '#FF3500',
    },
    {
      step: 2,
      label: 'Schedule Delivery',
      description: 'Enter delivery details to continue',
      completedDate: deliveryDetails?.createdAt,
      color: '#FF3500',
    },
    {
      step: 3,
      label: 'Shipped Out',
      description: 'We will update the status when the delivery date comes.',
      completedDate: logistic.shippedAt,
      color: '#1340FF',
    },
    {
      step: 4,
      label: isIssue ? 'Delivery Failed' : 'Received',
      description: isIssue ? 'Please review issue to continue' : 'Waiting for confirmation...',
      completedDate: logistic.deliveredAt || logistic.receivedAt,
      error: isIssue,
      color: '#FF3500',
    },
  ];

  return (
    <>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{
          '& .MuiStepLabel-root': {
            padding: 0,
          },
          '& .MuiStepConnector-line': {
            display: 'none',
          },
        }}
      >
        {steps.map((step, index) => {
          const isStepCompleted = activeStep > index;
          const isLastStep = index === steps.length - 1;

          return (
            <Step key={step.label} expanded>
              <StepLabel
                StepIconComponent={CustomStepIcon}
                error={step.error && activeStep === index}
                sx={{
                  py: 0,
                  '& .MuiStepLabel-label': {
                    color: 'text.primary', // Always Black
                    fontWeight: 600,
                  },
                  '& .MuiStepLabel-iconContainer': {
                    paddingRight: 2,
                  },
                }}
              >
                <Typography variant="caption" component="span" sx={{ color: 'text.secondary' }}>
                  STEP {step.step}
                </Typography>
              </StepLabel>
              <StepContent
                sx={{
                  mt: 0,
                  borderLeft: isLastStep ? 'none' : '2px solid',
                  borderColor: isStepCompleted ? '#1ABF66' : '#EFEFEF',
                  pb: isLastStep ? 0 : 2,
                  pl: 3.5,
                  ml: '11px',
                }}
              >
                <Box display="flex" flexDirection="column">
                  <Typography variant="subtitle2" component="span" sx={{ fontWeight: 700 }}>
                    {step.label}
                  </Typography>

                  {/* Show Button if it's the current step and has a button */}
                  {isStepCompleted && step.completedDate && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Completed on {format(new Date(step.completedDate), 'dd/MM/yyyy')}
                    </Typography>
                  )}

                  {/* 2. Current Active Step */}
                  {activeStep === index && (
                    <Typography variant="caption" sx={{ color: step.color, fontWeight: 400 }}>
                      {step.description}
                    </Typography>
                  )}
                </Box>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </>
  );
}

LogisticsStepper.propTypes = {
  logistic: PropTypes.object,
};
