import { useState } from 'react';
import { m } from 'framer-motion';

import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';

import { useResponsive } from 'src/hooks/use-responsive';

import { useUnreadMessageCount } from 'src/context/UnreadMessageCountContext';

import Iconify from 'src/components/iconify';
import { varHover } from 'src/components/animate';

import ChatModalMobile from 'src/sections/client/modal/chat-modal-mobile';

// Chat popover button for mobile header; opens full-screen ChatModalMobile
export default function ChatPopover() {
  const lgUp = useResponsive('up', 'lg');
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadMessageCount();

  if (lgUp) {
    // Desktop uses floating chat in Main; no header button
    return null;
  }

  return (
    <>
      <IconButton
        id="chatBtn"
        sx={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: '40px',
          height: '40px',
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          boxShadow: 'inset 0px -3px 0px #E7E7E7',
          borderRadius: '8px',
          '&:hover': { background: '#F9F9F9' },
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
        onClick={() => {
          setOpen(true);
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: 'chat_button_click',
            buttonName: 'Chat Popover',
            buttonId: 'chatBtn',
          });
        }}
      >
        <Badge color="error" variant="dot" invisible={!unreadCount}>
          <Iconify icon="bx:chat" width={24} color="#000" />
        </Badge>
      </IconButton>
			<ChatModalMobile open={open} onClose={() => setOpen(false)} />	  
    </>
  );
}

// No props yet
