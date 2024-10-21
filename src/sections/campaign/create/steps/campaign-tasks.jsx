import dayjs from 'dayjs';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';
import { useFieldArray } from 'react-hook-form';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Tab,
  Tabs,
  Card,
  Stack,
  Tooltip,
  MenuItem,
  Checkbox,
  TextField,
  Typography,
  IconButton,
  FormControlLabel,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import { RHFSelect, RHFTextField } from 'src/components/hook-form';

const CampaignTaskManagement = ({ methods }) => {
  const [currentTab, setCurrentTab] = useState('admin');
  const [isAdminSameTimeline, setIsAdminSameTimeline] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isBoxOpen, setIsBoxOpen] = useState(false);

  const { control, watch, setValue } = methods;
  const timeline = watch('timeline');

  const {
    fields: adminFields,
    append: adminAppend,
    remove: adminRemove,
  } = useFieldArray({
    control,
    name: 'campaignTasksAdmin',
  });

  useEffect(() => {
    if (isAdminSameTimeline) {
      setValue(
        'campaignTasksAdmin',
        timeline
          ?.filter((item) => item.for === 'admin')
          .map((item) => ({
            name: item.timeline_type.name,
            dependency: '',
            dueDate: dayjs(item.endDate),
            status: '',
          }))
      );
    }
  }, [isAdminSameTimeline, setValue, timeline]);

  const handleOnChangeInputAdmin = (e, index) => {
    setValue(`campaignTasksAdmin[${index}].name`, e.target.value);
  };

  useEffect(() => {
    console.log(isBoxOpen);
  }, [isBoxOpen]);

  return (
    <Box>
      <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)} variant="fullWidth">
        <Tab label="Admin" value="admin" />
        <Tab label="Creator" value="creator" />
      </Tabs>

      {/* Task Management Content */}
      {currentTab === 'admin' && (
        <Box p={2} mt={2}>
          <FormControlLabel
            control={<Checkbox />}
            label="Same as timeline"
            onChange={(e) => setIsAdminSameTimeline(e.target.checked)}
          />

          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            }}
            gap={1}
          >
            {adminFields.map((item, index) => (
              <Box component={Card} p={2} key={item.id} position="relative" draggable>
                <Stack gap={1}>
                  <RHFTextField
                    name={`campaignTasksAdmin[${index}].name`}
                    label="Task Name"
                    variant="standard"
                    size="small"
                    onChange={(e) => handleOnChangeInputAdmin(e, index)}
                  />
                  <RHFSelect
                    name={`campaignTasksAdmin[${index}].dependency`}
                    label="Set Dependency"
                    size="small"
                  >
                    {adminFields
                      .filter((elem) => elem.id !== item.id)
                      .map((value) => (
                        <MenuItem key={value.id} value={value.id}>
                          {value.name}
                        </MenuItem>
                      ))}
                  </RHFSelect>

                  {/* <RHFDatePicker name={`campaignTasksAdmin[${index}].dueDate`} label="Due Date" /> */}
                  {/* <DatePicker
                    {...register(`campaignTasksAdmin[${index}].dueDate`)}
                    label="Due Date"
                    minDate={new Date()}
                  /> */}
                  <RHFSelect
                    name={`campaignTasksAdmin[${index}].status`}
                    label="Status"
                    size="small"
                  >
                    <MenuItem value="NOT_STARTED">NOT_STARTED</MenuItem>
                    <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  </RHFSelect>
                </Stack>
                <IconButton
                  color="error"
                  sx={{ position: 'absolute', top: 10, right: 10 }}
                  onClick={() => adminRemove(index)}
                >
                  <Iconify icon="ic:round-delete" />
                </IconButton>
              </Box>
            ))}
            <Box
              component={Card}
              variant="outlined"
              p={2}
              sx={{
                position: 'relative',
                '&:hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? theme.palette.grey[900]
                      : theme.palette.grey[300],
                  cursor: 'pointer',
                },
              }}
              height={150}
            >
              {isBoxOpen ? (
                <Stack spacing={1} alignItems="end">
                  <TextField
                    value={newTaskName}
                    placeholder="Task Name"
                    fullWidth
                    size="small"
                    onChange={(e) => setNewTaskName(e.target.value)}
                  />

                  <Stack
                    component={m.div}
                    initial={{ opacity: 0, scale: 0.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    direction="row"
                    gap={1}
                  >
                    <Tooltip title="Cancel" onClick={() => setIsBoxOpen(false)}>
                      <IconButton
                        onClick={() => {
                          setNewTaskName('');
                          setIsBoxOpen(false);
                        }}
                      >
                        <Iconify icon="mdi:cancel-bold" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Confirm">
                      <IconButton
                        color="success"
                        onClick={() => {
                          if (newTaskName) {
                            adminAppend({
                              name: newTaskName,
                              dependency: '',
                              dueDate: null,
                              status: '',
                            });
                            setNewTaskName('');
                            setIsBoxOpen(false);
                          }
                        }}
                      >
                        <Iconify icon="hugeicons:tick-04" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => {
                    setIsBoxOpen(true);
                  }}
                >
                  <Stack gap={1} alignItems="center">
                    <Iconify icon="basil:add-solid" width={22} />
                    <Typography variant="subtitle2">Add new task</Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CampaignTaskManagement;

CampaignTaskManagement.propTypes = {
  methods: PropTypes.object,
};
