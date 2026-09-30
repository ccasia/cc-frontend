import { mutate } from 'swr';
import { m } from 'framer-motion';
import { useState, useEffect } from 'react';

import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { useGetReleaseNotes, useGetUnseenReleaseNote } from 'src/hooks/use-get-release-notes';

import axiosInstance, { endpoints } from 'src/utils/axios';

import useSocketContext from 'src/socket/hooks/useSocketContext';

import Iconify from 'src/components/iconify';
import { varHover } from 'src/components/animate';

import WhatsNewPopup from 'src/sections/release-notes/components/whats-new-popup';
import WhatsNewDrawer from 'src/sections/release-notes/components/whats-new-drawer';

export default function ReleaseNotesButton() {
  const drawer = useBoolean();
  const { socket } = useSocketContext();

  // Fetch the history lazily on first open, then keep it — toggling the SWR key off on close
  // would blank the drawer mid-animation and refetch everything on every reopen.
  const [hasOpened, setHasOpened] = useState(false);

  const { releaseNote: unseenRelease, mutate: mutateUnseen } = useGetUnseenReleaseNote();
  const { releases, isLoading } = useGetReleaseNotes(hasOpened);

  // Superadmin published (or deleted) a release — refetch so the popup shows instantly.
  // History is revalidated by key (stable reference; no-op until it has been fetched).
  useEffect(() => {
    if (!socket) return undefined;

    const handleChanged = () => {
      mutateUnseen();
      mutate(endpoints.releaseNotes.root);
    };

    socket.on('releaseNotes:changed', handleChanged);

    return () => {
      socket.off('releaseNotes:changed', handleChanged);
    };
  }, [socket, mutateUnseen]);

  const markSeen = async () => {
    if (!unseenRelease) return;

    mutateUnseen({ data: null }, false);
    try {
      await axiosInstance.post(endpoints.releaseNotes.seen);
    } catch (error) {
      console.error('Error marking release notes as seen:', error);
    }
  };

  const handleOpenDrawer = () => {
    setHasOpened(true);
    drawer.onTrue();
    markSeen();
  };

  return (
    <>
      <Tooltip title="What's New">
        <IconButton
          component={m.button}
          whileTap="tap"
          whileHover="hover"
          variants={varHover(1.05)}
          color={drawer.value ? 'primary' : 'default'}
          onClick={handleOpenDrawer}
          sx={{
            width: 40,
            height: 40,
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            boxShadow: 'inset 0px -3px 0px #E7E7E7',
            borderRadius: '8px',
            '& .MuiBadge-dot': {
              top: '-2px',
              right: '-2px',
              border: '1px solid #FFFFFF',
            },
          }}
        >
          <Badge variant="dot" color="error" invisible={!unseenRelease}>
            <Iconify
              icon="material-symbols:build-outline-rounded"
              width={20}
              style={{ color: 'black' }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <WhatsNewDrawer
        open={drawer.value}
        onClose={drawer.onFalse}
        releases={releases}
        isLoading={isLoading}
      />

      <WhatsNewPopup
        open={Boolean(unseenRelease)}
        releaseNote={unseenRelease}
        onDismiss={markSeen}
      />
    </>
  );
}
