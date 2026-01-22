import { useMemo } from 'react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

import {
  Box,
  Step,
  Badge,
  styled,
  Stepper,
  StepLabel,
  Typography,
  StepContent,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';

import { fDate } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';

const QConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 11,
    left: 'calc(-50% + 11px)',
    right: 'calc(50% + 11px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#00AB55',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: '#00AB55',
    },
  },
  [`&.Mui-error .${stepConnectorClasses.line}`]: {
    borderColor: '#D4321C',
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 2,
    borderRadius: 1,
  },
}));

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

  const getIcon = () => {
    if (error) {
      return <Iconify icon="eva:close-fill" width={16} />;
    }
    if (completed) {
      return <Iconify icon="eva:checkmark-fill" width={16} />;
    }
    return <Iconify icon="solar:clock-circle-bold" width={16} />;
  };

  return <StepIconRoot ownerState={{ active, completed, error }}>{getIcon()}</StepIconRoot>;
}

CustomStepIcon.propTypes = {
  active: PropTypes.bool,
  completed: PropTypes.bool,
  error: PropTypes.bool,
};

export default function LogisticsStepper({ logistic, isReservation }) {
  if (!logistic) return null;

  const { status, deliveryDetails, reservationDetails, updatedAt, completedAt, shippedAt } =
    logistic;
  const hasIssue = status === 'ISSUE_REPORTED';

  let activeStep = 0;
  let steps = [];

  if (isReservation) {
    const isDetailsDone = reservationDetails?.isConfirmed;
    const isScheduled = reservationDetails?.slots?.some((slot) => slot.status === 'SELECTED');
    const isCompleted = ['COMPLETED', 'RECEIVED'].includes(status);

    let completionDescription = 'Waiting for creator to complete visit...';
    if (hasIssue) {
      completionDescription = 'Please review issue to continue';
    } else if (isCompleted) {
      completionDescription = 'Visit completed on';
    }

    if (isDetailsDone && isScheduled && !isCompleted) activeStep = 2;
    else if (isCompleted) activeStep = 3;
    if (isDetailsDone && !isScheduled) activeStep = 1;

    steps = [
      {
        step: 1,
        label: 'Confirm Details',
        description: isDetailsDone
          ? `Completed on ${fDate(updatedAt)}`
          : 'Add any details you want the creator to note.',
        isCompleted: isDetailsDone,
        isActive: !isDetailsDone,
        color: isDetailsDone ? 'text.secondary' : '#FF3500',
      },
      {
        step: 2,
        label: 'Confirm Slot',
        description: isScheduled
          ? `Completed on ${fDate(updatedAt)}`
          : 'Schedule a slot for the creator.',
        isCompleted: isScheduled,
        isActive: !isScheduled,
        color: isScheduled ? 'text.secondary' : '#1340FF',
      },
      {
        step: 3,
        label: hasIssue ? 'Issue Reported' : 'Completed',
        description: isCompleted
          ? `${completionDescription} ${fDate(completedAt)}`
          : completionDescription,
        isCompleted,
        isActive: isScheduled && isDetailsDone && !isCompleted,
        error: hasIssue,
        color: hasIssue ? '#FF3500' : '#1ABF66',
      },
    ];
  } else {
    if (status === 'PENDING_ASSIGNMENT') activeStep = 0;
    else if (status === 'SCHEDULED') activeStep = 1;
    else if (status === 'SHIPPED') activeStep = 2;
    else if (['DELIVERED', 'RECEIVED', 'COMPLETED'].includes(status)) activeStep = 4;
    else if (status === 'ISSUE_REPORTED') activeStep = 3;

    steps = [
      {
        step: 1,
        label: 'Assign Product',
        description: 'Assign product to creator',
        completedDate: deliveryDetails?.createdAt,
        color: '#FF3500',
      },
      {
        step: 2,
        label: 'Schedule Delivery',
        description: 'Schedule a delivery to continue',
        completedDate: logistic.shippedAt,
        color: '#FF3500',
      },
      {
        step: 3,
        label: 'Shipped Out',
        description: 'We will update the status when the delivery date comes.',
        completedDate: logistic.deliveredAt || logistic.receivedAt,

        color: '#1340FF',
      },
      {
        step: 4,
        label: hasIssue ? 'Delivery Failed' : 'Received',
        description: hasIssue ? 'Please review issue to continue' : 'Waiting for confirmation...',
        completedDate: logistic.deliveredAt || logistic.receivedAt,
        error: hasIssue,
        color: '#FF3500',
      },
    ];
  }

  return (
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
        const isActive = isReservation ? step.isActive : activeStep === index;
        const isCompleted = isReservation ? step.isCompleted : activeStep > index;
        const isBorderActive = isCompleted;
        const isStepCompleted = activeStep > index;
        const isLastStep = index === steps.length - 1;

        return (
          <Step key={step.label} expanded>
            <StepLabel
              StepIconComponent={CustomStepIcon}
              // error={step.error && activeStep === index}
              StepIconProps={{
                active: isActive,
                completed: isCompleted,
                error: step.error && isActive,
              }}
              sx={{
                py: 0,
                '& .MuiStepLabel-label': {
                  color: 'text.primary',
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
                {isReservation && isStepCompleted && (
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
  );
}

LogisticsStepper.propTypes = {
  logistic: PropTypes.object,
  isReservation: PropTypes.bool,
};

// ----------------------------------------------------------------------

export function CreatorLogisticsStepper({ status, logistic, isReservation }) {
  const isIssue = status === 'ISSUE_REPORTED';
  const reservationDetails = logistic?.reservationDetails;
  const isAutoSchedule = logistic?.campaign?.reservationConfig?.mode === 'AUTO_SCHEDULE';
  const deliveryDetails = logistic?.deliveryDetails;
  const isConfirmed = deliveryDetails?.isConfirmed;

  let activeStep = 0;
  let steps = [];
  
  if (isReservation) {
    if (status === 'NOT_STARTED') activeStep = 0;
    else if (status === 'PENDING_ASSIGNMENT') activeStep = 1;
    else if (status === 'SCHEDULED' || status === 'ISSUE_REPORTED') activeStep = 2;
    else if (['COMPLETED', 'RECEIVED', 'ISSUE_REPORTED'].includes(status)) activeStep = 3;

    steps = [
      {
        step: 1,
        label: 'Check Availability',
        date: logistic?.createdAt,
        desc: status === 'NOT_STARTED' ? 'Please provide necessary details.' : 'Completed on',
        color: '#FF3500',
      },
      {
        step: 2,
        label: 'Confirm Slot',
        date: activeStep > 1 ? logistic?.updatedAt : null,
        desc:
          status === 'PENDING_ASSIGNMENT'
            ? 'Waiting for Client to confirm your slot...'
            : 'Completed on',
        color: '#1340FF',
      },
      {
        step: 3,
        label: isIssue ? 'Issue Reported' : 'Complete Visit',
        date: logistic?.completedAt,
        desc: isIssue ? 'We’ll review your issue and resolve it shortly.' : 'Completed on',
        error: isIssue,
      },
    ];
  } else {
    if (
      ['SCHEDULED', 'SHIPPED', 'DELIVERED', 'RECEIVED', 'COMPLETED', 'ISSUE_REPORTED'].includes(
        status
      )
    ) {
      activeStep = 1;
    }
    if (['SHIPPED', 'DELIVERED', 'RECEIVED', 'COMPLETED', 'ISSUE_REPORTED'].includes(status)) {
      activeStep = 2;
    }
    if (['RECEIVED', 'COMPLETED'].includes(status)) {
      activeStep = 3;
    }

    steps = [
      {
        step: 1,
        label: 'Confirm Details',
        date: deliveryDetails?.createdAt,
        desc: isConfirmed ? '' : 'Please confirm your details',
        color: '#1340FF',
      },
      {
        step: 2,
        label: 'Delivery Scheduled',
        date: logistic?.shippedAt ? logistic.createdAt : null, // Use createdAt logic or similar as per requirement
        desc: 'Waiting for Client to update delivery details...',
        color: '#1340FF',
      },
      {
        step: 3,
        label: isIssue ? 'Issue Reported' : 'Receive Product',
        date: logistic?.deliveredAt || logistic?.receivedAt,
        desc: isIssue ? 'We’ll review your issue and resolve it shortly.' : 'Completed on',
        error: isIssue,
      },
    ];
  }

  const hasNewInfo = useMemo(() => {
    if (!isAutoSchedule || !reservationDetails || !logistic?.id) return false;

    const fields = [
      { key: 'pic', val: reservationDetails.picName },
      { key: 'budget', val: reservationDetails.budget },
      { key: 'promo', val: reservationDetails.promoCode },
      { key: 'remarks', val: reservationDetails.clientRemarks },
    ];

    return fields.some((f) => f.val && !localStorage.getItem(`seen-${logistic.id}-${f.key}`));
  }, [isAutoSchedule, reservationDetails, logistic?.id]);

  return (
    <Stepper
      alternativeLabel
      activeStep={activeStep}
      connector={<QConnector />}
      sx={{
        ...(isIssue && {
          '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
            borderColor: '#FF4842',
          },
        }),
      }}
    >
      {steps.map((step, index) => {
        const isErrorStep = step.error && activeStep === index;

        return (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={(props) => (
                <Badge
                  variant="dot"
                  color="error"
                  invisible={index !== 2 || !hasNewInfo}
                  sx={{
                    '& .MuiBadge-badge': {
                      top: 2,
                      right: 2,
                      border: '2px solid #fff',
                    },
                  }}
                >
                  <CustomStepIcon {...props} />
                </Badge>
              )}
              error={isErrorStep}
            >
              {isReservation ? (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                  >
                    STEP {step.step}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#231F20' }}>
                    {step.label}
                  </Typography>
                  {(activeStep > index ||
                    (activeStep === index && step.error) ||
                    (activeStep === index &&
                      index === 2 &&
                      ['RECEIVED', 'COMPLETED'].includes(status))) && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isErrorStep ? '#1340FF' : 'text.secondary',
                        display: 'block',
                      }}
                    >
                      {step.desc} {step.date && !isErrorStep && fDate(step.date)}
                    </Typography>
                  )}
                  {activeStep === index && !step.error && index !== 2 && (
                    <Typography
                      variant="caption"
                      sx={{ color: step.color, display: 'block', fontsize: '10px' }}
                    >
                      {step.desc}
                    </Typography>
                  )}
                  {status === 'SCHEDULED' && index === 2 && !isErrorStep && (
                    <Typography
                      variant="caption"
                      sx={{ color: '#FF3500', display: 'block', fontWeight: 500 }}
                    >
                      Mark visit as complete.
                    </Typography>
                  )}
                </>
              ) : (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                  >
                    STEP {step.step}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#231F20' }}>
                    {step.label}
                  </Typography>
                  {(activeStep > index ||
                    (activeStep === index && step.error) ||
                    (activeStep === index &&
                      index === 2 &&
                      ['RECEIVED', 'COMPLETED'].includes(status))) && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isErrorStep ? '#1340FF' : 'text.secondary',
                        display: 'block',
                      }}
                    >
                      Completed on {step.date && !isErrorStep && fDate(step.date)}
                    </Typography>
                  )}
                  {isConfirmed && activeStep === 0 && index === 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: isErrorStep ? '#1340FF' : 'text.secondary',
                        display: 'block',
                      }}
                    >
                      Completed on {step.date && !isErrorStep && fDate(step.date)}
                    </Typography>
                  )}
                  {activeStep === index && !step.error && index !== 2 && (
                    <Typography
                      variant="caption"
                      sx={{ color: step.color, display: 'block', fontsize: '10px' }}
                    >
                      {step.desc}
                    </Typography>
                  )}
                  {status === 'SHIPPED' && index === 2 && !isErrorStep && (
                    <Typography
                      variant="caption"
                      sx={{ color: '#FF3500', display: 'block', fontWeight: 500 }}
                    >
                      Please confirm when products are received
                    </Typography>
                  )}
                </>
              )}
            </StepLabel>
          </Step>
        );
      })}
    </Stepper>
  );
}

CreatorLogisticsStepper.propTypes = {
  status: PropTypes.string,
  logistic: PropTypes.object,
  isReservation: PropTypes.bool,
};
