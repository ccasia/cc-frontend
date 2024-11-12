/* eslint-disable perfectionist/sort-imports */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import { m } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import { Avatar } from '@mui/material';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useGetNotificationById from 'src/hooks/use-get-notification-by-id';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { varHover } from 'src/components/animate';
import NotificationModal from '../notificationModal';
import NotificationItem from './notification-item';

// ----------------------------------------------------------------------

const TABS = [
  {
    value: 'all',
    label: 'All',
    count: 22,
  },
  {
    value: 'unread',
    label: 'Unread',
    count: 12,
  },
  // {
  //   value: 'archived',
  //   label: 'Archived',
  //   count: 10,
  // },
];

// ----------------------------------------------------------------------

export default function NotificationsPopover() {
  const drawer = useBoolean();
  const [isModalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useGetNotificationById();
  const { socket } = useSocketContext();

  const smUp = useResponsive('up', 'sm');

  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);
  const totalUnRead = data?.notifications?.filter((item) => !item.read).length;
  //  const totalArchive = data?.notifications?.filter((item) => !item.archive).length;

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.patch(endpoints.notification.read);
      const newData = data.notifications.map((notification) => ({ ...notification, read: true }));
      mutate(endpoints.notification.root, { notifications: newData }, false);
    } catch (error) {
      console.log(error);
    }
  };

  // const archiveAll = async () => {
  //   try {
  //     await axiosInstance.patch(endpoints.notification.archive);
  //     const newData = data.notifications.map((notification) => ({
  //       ...notification,
  //       archive: true,
  //     }));
  //     mutate(endpoints.notification.root, { notifications: newData }, false);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const renderHead = (
    <>
      <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
        <Typography
          variant="body1"
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            flexGrow: 1,
            fontWeight: 'normal',
            letterSpacing: 2,
            fontSize: '32px',
          }}
        >
          Notifications
        </Typography>

        <Tooltip title="Mark all as read">
          <Button
            color="primary"
            variant="outlined"
            onClick={handleOpenModal}
            sx={{ display: 'flex', alignItems: 'center' }}
            startIcon={<Iconify icon="eva:done-all-fill" />}
            disabled={totalUnRead < 1}
          >
            Mark all as read
          </Button>
        </Tooltip>

        {/* {!!totalArchive && (
      <Tooltip title="Archive all">
        <IconButton color="primary" onClick={archiveAll}>
          <Iconify icon="material-symbols:archive" />
        </IconButton>
      </Tooltip>
    )} */}

        {!smUp && (
          <IconButton onClick={drawer.onFalse}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        )}
      </Stack>
      <NotificationModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleMarkAllAsRead}
      />
    </>
  );

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={handleChangeTab}
      variant="fullWidth"
      TabIndicatorProps={{
        children: <span />,
        sx: {
          height: 1,
          py: 1,
          zIndex: -10000,
          bgcolor: 'transparent',
          transition: 'all .3s ease-in-out',
          '&.MuiTabs-indicator > span': {
            bgcolor: '#FFF',
            borderColor: '#E7E7E7',
            // bgcolor: (theme) =>
            //   theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.white,
            width: '100%',
            height: '100%',
            display: 'inline-flex',
            borderRadius: 1,
            boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
          },
        },
      }}
      sx={{
        borderRadius: 2,
        m: 1,
        '&.MuiTabs-root': {
          zIndex: 1,
          minHeight: 'auto',
          flexShrink: 0,
          bgcolor: '#F4F4F4',
        },
        '& .MuiTabs-scroller': {
          p: 1,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          sx={{
            '&.Mui-selected': {
              borderRadius: 2,
              fontWeight: 600,
            },
            '&:not(:last-of-type)': {
              mr: 0,
            },
          }}
          value={tab.value}
          label={tab.label}
          icon={
            tab.value === 'unread' && (
              <Label>
                {/* {tab.value === 'all' && `(${data?.notifications?.filter((item) => !item.archive)?.length})`} */}
                {tab.value === 'unread' && totalUnRead}

                {/* {tab.value === 'archived' &&
                `(${data?.notifications.filter((notification) => notification.archive).length})`} */}
              </Label>
            )
          }
        />
      ))}
    </Tabs>
  );

  const renderList = !isLoading && (
    <Scrollbar>
      {currentTab === 'unread' &&
      data?.notifications?.filter((item) => !item.read && !item.archive).length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          sx={{ width: 1, height: '100vh' }}
        >
          <Avatar
            src="/assets/images/chat/no-messageicon.png"
            alt="No Messages Icon"
            sx={{ width: 80, height: 80, marginBottom: 2 }}
          />
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              fontSize: '16px',
              fontFamily: (theme) => theme.typography.fontPrimaryFamily,
            }}
          >
            Woohoo! You have a clean inbox
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              fontSize: '16px',
              fontFamily: (theme) => theme.typography.fontPrimaryFamily,
            }}
          >
            (for now)
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {data?.notifications
            ?.filter((item) => {
              if (currentTab === 'unread') {
                return !item.read && !item.archive;
              }
              if (currentTab === 'archived') {
                return item.archive;
              }
              return !item.archive;
            })
            .sort((a, b) => dayjs(b.notification.createdAt).diff(dayjs(a.notification.createdAt)))
            .map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
        </List>
      )}
    </Scrollbar>
  );

  useEffect(() => {
    socket?.on('notification', () => {
      mutate(endpoints.notification.root);
    });

    return () => {
      socket?.off('notification');
    };
  }, [socket]);

  return (
    <>
      <IconButton
        sx={{
          borderRadius: 1,
          boxShadow: (theme) => `0px 1px 1px 1px ${theme.palette.grey[400]}`,
        }}
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        color={drawer.value ? 'primary' : 'default'}
        onClick={drawer.onTrue}
      >
        <Badge
          badgeContent={!isLoading && (totalUnRead < 20 ? totalUnRead : `20+`)}
          color="error"
          variant="dot"
        >
          <Iconify icon="mdi:bell-outline" width={18} />
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
        }}
        PaperProps={{
          sx: { width: 1, maxWidth: 420 },
        }}
      >
        {renderHead}

        <Divider />

        {renderTabs}

        <Divider />

        {renderList}
      </Drawer>
    </>
  );
}
