import dayjs from 'dayjs';
import { mutate } from 'swr';
import { m } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
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
  {
    value: 'archived',
    label: 'Archived',
    count: 10,
  },
];

// ----------------------------------------------------------------------

export default function NotificationsPopover() {
  const drawer = useBoolean();

  const { data, isLoading } = useGetNotificationById();
  const { socket } = useSocketContext();

  const smUp = useResponsive('up', 'sm');

  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const totalUnRead = data?.notifications?.filter((item) => !item.read).length;
  const totalArchive = data?.notifications?.filter((item) => !item.archive).length;

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.patch(endpoints.notification.read);
      const newData = data.notifications.map((notification) => ({ ...notification, read: true }));
      mutate(endpoints.notification.root, { notifications: newData }, false);
    } catch (error) {
      console.log(error);
    }
  };

  const archiveAll = async () => {
    try {
      await axiosInstance.patch(endpoints.notification.archive);
      const newData = data.notifications.map((notification) => ({
        ...notification,
        archive: true,
      }));
      mutate(endpoints.notification.root, { notifications: newData }, false);
    } catch (error) {
      console.log(error);
    }
  };

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!totalUnRead && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      {!!totalArchive && (
        <Tooltip title="Archive all">
          <IconButton color="primary" onClick={archiveAll}>
            <Iconify icon="material-symbols:archive" />
          </IconButton>
        </Tooltip>
      )}

      {!smUp && (
        <IconButton onClick={drawer.onFalse}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      )}
    </Stack>
  );

  const renderTabs = (
    <Tabs value={currentTab} onChange={handleChangeTab}>
      {TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={
                (tab.value === 'unread' && 'info') ||
                (tab.value === 'archived' && 'success') ||
                'default'
              }
            >
              {tab.value === 'all' && data?.notifications?.filter((item) => !item.archive)?.length}
              {tab.value === 'unread' &&
                data?.notifications.filter((notification) => !notification.read).length}
              {tab.value === 'archived' &&
                data?.notifications.filter((notification) => notification.archive).length}
            </Label>
          }
          sx={{
            '&:not(:last-of-type)': {
              mr: 3,
            },
          }}
        />
      ))}
    </Tabs>
  );

  const renderList = !isLoading && (
    <Scrollbar>
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
    </Scrollbar>
  );

  useEffect(() => {
    socket?.on('notification', () => {
      mutate(endpoints.notification.root);
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        color={drawer.value ? 'primary' : 'default'}
        onClick={drawer.onTrue}
      >
        <Badge badgeContent={totalUnRead < 20 ? totalUnRead : `20+`} color="error">
          <Iconify icon="solar:bell-bing-bold-duotone" width={24} />
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

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ pl: 2.5, pr: 1 }}
        >
          {renderTabs}
          <IconButton onClick={handleMarkAllAsRead}>
            <Iconify icon="solar:settings-bold-duotone" />
          </IconButton>
        </Stack>

        <Divider />

        {renderList}

        <Box sx={{ p: 1 }}>
          <Button fullWidth size="large">
            View All
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
