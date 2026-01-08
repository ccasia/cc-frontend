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
      completionDescription = 'Visit completed';
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
        color: '#FF3500',
      },
      {
        step: 2,
        label: 'Schedule',
        description: isScheduled
          ? `Completed on ${fDate(updatedAt)}`
          : 'Schedule a slot for the creator.',
        isCompleted: isScheduled,
        isActive: !isScheduled,
        color: '#1340FF',
      },
      {
        step: 3,
        label: hasIssue ? 'Issue Reported' : `Completed on ${fDate(completedAt)}`,
        description: completionDescription,
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
        description: 'Enter delivery details to continue',
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
  );
  // }
  // return (
  //   <Stepper
  //     activeStep={activeStep}
  //     orientation="vertical"
  //     sx={{
  //       '& .MuiStepLabel-root': {
  //         padding: 0,
  //       },
  //       '& .MuiStepConnector-line': {
  //         display: 'none',
  //       },
  //     }}
  //   >
  //     {steps.map((step, index) => {
  //       // For Reservation, we use explicit flags. For Product, we use the activeStep logic.
  //       const isActive = isReservation ? step.isActive : activeStep === index;
  //       const isCompleted = isReservation ? step.isCompleted : activeStep > index;
  //       const isLastStep = index === steps.length - 1;

  //       // Logic for the line color:
  //       // - Green (#1ABF66) if the step is completed AND it's not the immediate parent of the active step.
  //       // - Blue (#1340FF) if the step is completed AND it is leading directly into the active step.
  //       // - Grey (#EFEFEF) otherwise.
  //       const isLineBlue = activeStep === index + 1;
  //       const lineColor = isCompleted ? (isLineBlue ? '#1340FF' : '#1ABF66') : '#EFEFEF';

  //       return (
  //         <Step key={step.label} expanded>
  //           <StepLabel
  //             StepIconComponent={CustomStepIcon}
  //             StepIconProps={{
  //               active: isActive,
  //               completed: isCompleted,
  //               error: step.error && isActive,
  //             }}
  //             sx={{
  //               py: 0,
  //               '& .MuiStepLabel-label': {
  //                 color: 'text.primary',
  //                 fontWeight: 600,
  //               },
  //               '& .MuiStepLabel-iconContainer': {
  //                 paddingRight: 2,
  //               },
  //             }}
  //           >
  //             <Typography variant="caption" component="span" sx={{ color: 'text.secondary' }}>
  //               STEP {step.step || index + 1}
  //             </Typography>
  //           </StepLabel>
  //           <StepContent
  //             sx={{
  //               mt: 0,
  //               borderLeft: isLastStep ? 'none' : '2px solid',
  //               borderColor: lineColor,
  //               pb: isLastStep ? 0 : 2,
  //               pl: 3.5,
  //               ml: '11px',
  //             }}
  //           >
  //             <Box display="flex" flexDirection="column">
  //               <Typography variant="subtitle2" component="span" sx={{ fontWeight: 700 }}>
  //                 {step.label}
  //               </Typography>

  //               {/* Completed State: Show Date */}
  //               {isCompleted && (step.completedDate || step.description) && (
  //                 <Typography variant="caption" sx={{ color: 'text.secondary' }}>
  //                   {step.completedDate
  //                     ? `Completed on ${format(new Date(step.completedDate), 'dd/MM/yyyy')}`
  //                     : step.description}
  //                 </Typography>
  //               )}

  //               {/* Active State: Show Actionable Description */}
  //               {isActive && (
  //                 <Typography variant="caption" sx={{ color: step.color, fontWeight: 400 }}>
  //                   {step.description}
  //                 </Typography>
  //               )}
  //             </Box>
  //           </StepContent>
  //         </Step>
  //       );
  //     })}
  //   </Stepper>
  // );
}

LogisticsStepper.propTypes = {
  logistic: PropTypes.object,
  isReservation: PropTypes.bool,
};

// ----------------------------------------------------------------------

export function CreatorLogisticsStepper({ status, updatedDates, isReservation }) {
  const isIssue = status === 'ISSUE_REPORTED';
  const reservationDetails = updatedDates?.reservationDetails;
  const isAutoSchedule = updatedDates?.campaign?.reservationConfig?.mode === 'AUTO_SCHEDULE';

  let activeStep = 0;
  let steps = [];
  console.log('isReservation:', isReservation);
  if (isReservation) {
    if (status === 'NOT_STARTED') activeStep = 0;
    else if (status === 'PENDING_ASSIGNMENT') activeStep = 1;
    else if (status === 'SCHEDULED' || status === 'ISSUE_REPORTED') activeStep = 2;
    else if (['COMPLETED', 'RECEIVED', 'ISSUE_REPORTED'].includes(status)) activeStep = 3;

    steps = [
      {
        step: 1,
        label: 'Check Availability',
        date: updatedDates?.createdAt,
        desc: 'Completed on',
      },
      {
        step: 2,
        label: 'Confirm Slot',
        date: activeStep > 1 ? updatedDates?.updatedAt : null,
        desc:
          status === 'PENDING_ASSIGNMENT'
            ? 'Waiting for Client to confirm your slot...'
            : 'Completed on',
      },
      {
        step: 3,
        label: isIssue ? 'Issue Reported' : 'Complete Visit',
        date: updatedDates?.completedAt,
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
        date: updatedDates?.createdAt,
        desc: 'Completed on',
      },
      {
        step: 2,
        label: 'Delivery Scheduled',
        date: updatedDates?.shippedAt ? updatedDates.createdAt : null, // Use createdAt logic or similar as per requirement
        desc: 'Completed on',
      },
      {
        step: 3,
        label: isIssue ? 'Issue Reported' : 'Receive Product',
        date: updatedDates?.deliveredAt || updatedDates?.receivedAt,
        desc: isIssue ? 'We’ll review your issue and resolve it shortly.' : 'Completed on',
        error: isIssue,
      },
    ];
  }

  const hasNewInfo = useMemo(() => {
    if (!isAutoSchedule || !reservationDetails || !updatedDates?.id) return false;

    const fields = [
      { key: 'pic', val: reservationDetails.picName },
      { key: 'budget', val: reservationDetails.budget },
      { key: 'promo', val: reservationDetails.promoCode },
      { key: 'remarks', val: reservationDetails.clientRemarks },
    ];

    return fields.some((f) => f.val && !localStorage.getItem(`seen-${updatedDates.id}-${f.key}`));
  }, [isAutoSchedule, reservationDetails, updatedDates?.id]);

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
                      border: '2px solid #fff', // Makes it pop
                    },
                  }}
                >
                  <CustomStepIcon {...props} />
                </Badge>
              )}
              error={isErrorStep}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
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
                    // mt: 0.5,
                  }}
                >
                  {step.desc} {step.date && !isErrorStep && fDate(step.date)}
                </Typography>
              )}
              {activeStep === index && !step.error && index !== 2 && (
                <Typography
                  variant="caption"
                  sx={{ color: '#1340FF', display: 'block', fontsize: '10px' }}
                >
                  Waiting for Client to confirm your slot...{' '}
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
            </StepLabel>
          </Step>
        );
      })}
    </Stepper>
  );
}

CreatorLogisticsStepper.propTypes = {
  status: PropTypes.string,
  updatedDates: PropTypes.object,
  isReservation: PropTypes.bool,
};
