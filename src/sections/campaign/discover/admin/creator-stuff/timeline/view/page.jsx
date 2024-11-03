import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import { Box, Paper, Stack, Button, Divider, Typography } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { MAP_TIMELINE } from 'src/utils/map-timeline';

import Label from 'src/components/label';

import TimelineModal from '../modal';

const TimelineCreator = ({ campaign, creator }) => {
  const dialog = useBoolean();
  const [selectedTimeline, setSelectedTimeline] = useState({
    item: null,
    dependsOn: null,
    dependencies: null,
    campaign,
  });

  const submissionTimelines = campaign?.submission?.filter(
    (item) => item?.userId === creator?.user?.id
  );

  return (
    <Box>
      <Stack spacing={2}>
        {submissionTimelines
          // ?.sort((a, b) => dayjs(a.dueDate).isBefore(dayjs(b.dueDate), 'day'))
          ?.map((item) => {
            const dependsOn = item?.dependentOn[0]?.dependentSubmissionId;
            const dependencies = item?.dependencies[0]?.submissionId;
            return (
              <React.Fragment key={item?.id}>
                <Box component={Paper} p={2}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1">
                        {MAP_TIMELINE[item?.submissionType?.type]}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            setSelectedTimeline((prev) => ({
                              ...prev,
                              item,
                              dependsOn,
                              dependencies,
                            }));
                            dialog.onTrue();
                          }}
                          disabled
                        >
                          Coming soon.
                        </Button>
                        <Label>{item?.status}</Label>
                      </Stack>
                    </Stack>
                    <Divider
                      sx={{
                        borderStyle: 'dashed',
                      }}
                    />
                    <Stack
                      direction="row"
                      justifyContent="space-around"
                      alignItems="center"
                      divider={
                        <Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />
                      }
                    >
                      <Box>
                        <Typography variant="subtitle2">Dependent On</Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {MAP_TIMELINE[
                            submissionTimelines?.find((val) => val?.id === dependsOn)
                              ?.submissionType?.type
                          ] ?? 'None'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2">Dependencies</Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {MAP_TIMELINE[
                            submissionTimelines?.find((val) => val?.id === dependencies)
                              ?.submissionType?.type
                          ] ?? 'None'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2">Due Date</Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                          {dayjs(item?.dueDate).format('ddd LL')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Box>
              </React.Fragment>
            );
          })}
        <TimelineModal dialog={dialog} selected={selectedTimeline} />
      </Stack>
    </Box>
  );
};

export default TimelineCreator;

TimelineCreator.propTypes = {
  campaign: PropTypes.object,
  creator: PropTypes.object,
};
