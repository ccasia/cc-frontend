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

  const handleMarkAsRead = async (notificationId) => {
    console.log('Marking notification as read with ID:', notificationId);

    try {
      await axiosInstance.patch(endpoints.notification.markAsRead(notificationId));

      // Update the state to reflect that the specific notification is read
      const newData = data.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true, readAt: new Date() }
          : notification
      );

      // // Mutate the state with the updated notification data
      mutate(endpoints.notification.root, { notifications: newData }, false);
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
            // letterSpacing: 2,
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
            sx={{
              height: '40px',
              background: '#FFFFFF',
              border: '1px solid #E8E8E8',
              boxShadow: 'inset 0px -3px 0px #E7E7E7',
              borderRadius: '8px',
              '&.Mui-disabled': {
                background: '#FFFFFF',
                border: '1px solid #E8E8E8',
                boxShadow: 'inset 0px -3px 0px #E7E7E7',
              },
            }}
            startIcon={
              <img
                alt="sda"
                src={
                  totalUnRead < 1
                    ? '/assets/icons/notification/ic_mark_read_gray.svg'
                    : '/assets/icons/notification/ic_mark_read.svg'
                }
              />
            }
            disabled={totalUnRead < 1}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: totalUnRead < 1 ? '#8E8E93' : '#026D54',
                fontSize: '14px',
                lineHeight: '18px',
              }}
            >
              Mark all as Read
            </Typography>
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
          padding: '4px',
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
            border: '1px solid #E8E8E8',
            boxShadow: 'inset 0px -3px 0px #E7E7E7',
          },
        },
      }}
      sx={{
        borderRadius: 1,
        m: 1,
        '&.MuiTabs-root': {
          zIndex: 1,
          minHeight: 'auto',
          flexShrink: 0,
          bgcolor: '#F4F4F4',
        },
        '& .MuiTabs-scroller': {
          p: '0px',
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
            '&:not(.Mui-selected)': {
              color: '#8E8E93',
            },
            '&:not(:last-of-type)': {
              mr: 0,
            },
          }}
          value={tab.value}
          label={tab.value === 'unread' ? `Unread (${totalUnRead})` : tab.label}
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
              <NotificationItem
                key={notification.id}
                notification={notification}
                markAsRead={handleMarkAsRead}
              />
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
        id="notificationBtn"
        sx={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6px 10px 9px',
          gap: '2px',
          width: '40px',
          height: '40px',
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          boxShadow: 'inset 0px -3px 0px #E7E7E7',
          borderRadius: '8px',
          '& .MuiBadge-dot': {
            top: '5px',
            right: '5px',
            border: '1px solid #FFFFFF',
            borderRadius: '500px',
          },
        }}
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        color={drawer.value ? 'primary' : 'default'}
        // onClick={drawer.onTrue}
        onClick={() => {
          drawer.onTrue(); // Original function
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "notification_button_click",
            buttonName: "Notification Bell",
            buttonId: "notificationBtn",
          });
        }}
      >
        <Badge
          badgeContent={!isLoading && (totalUnRead < 20 ? totalUnRead : `20+`)}
          color="error"
          variant="dot"
        >
          <Iconify>
            <img alt="asd" src="/assets/icons/notification/ic_bell.svg" />
          </Iconify>
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
          sx: { width: 1, maxWidth: 370, borderRadius: '12px 0 0 0' },
        }}
      >
        {renderHead}

        <Divider />

        {renderTabs}

        {renderList}
      </Drawer>
    </>
  );
}
