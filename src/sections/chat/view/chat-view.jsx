import { useParams } from 'react-router-dom';

//  import Image from "material-ui-image";
import Stack from '@mui/material/Stack';
import { Box, Avatar } from '@mui/material';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useSearchParams } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { useGetAllThreads } from 'src/api/chat';
import { useUnreadMessageCount } from 'src/context/UnreadMessageCountContext';

import { useSettingsContext } from 'src/components/settings';

import ChatNav from '../chat-nav';
import ThreadMessages from './threadmessages';

// ----------------------------------------------------------------------

export default function ChatView() {
  // const router = useRouter();
  const { user } = useAuthContext();
  const settings = useSettingsContext();
  const searchParams = useSearchParams();
  const unreadMessageCount = useUnreadMessageCount();
  const selectedConversationId = searchParams.get('id') || '';
  const { threads, loading, error } = useGetAllThreads(); // Fetch all threads using hook

  // Filter threads to find those that the user is part of
  const userThreads = threads?.filter((thread) =>
    thread.UserThread.some((ut) => ut.userId === user.id)
  );

  // Check if user has threads
  const hasThreads = userThreads && userThreads.length > 0;

  const { id } = useParams();

  const renderContent = () => {
    if (id) {
      return <ThreadMessages threadId={id} />;
    }

    if (loading) {
      // If loading threads
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          sx={{ width: 1, height: '100%' }}
        >
          <Typography
            variant="body1"
            color="textSecondary"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              letterSpacing: 2,
            }}
          >
            Loading threads & messages...
          </Typography>
        </Box>
      );
    }

    if (hasThreads) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{ width: 1, height: '100%' }}
        >
          <Box display="flex" flexDirection="column" alignItems="center">
            {unreadMessageCount > 0 ? (
              <>
                <Avatar
                  src="/assets/images/chat/msgalerticon.png"
                  alt="No Messages Icon"
                  sx={{ width: 80, height: 80, marginBottom: 2 }}
                />
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    letterSpacing: 2,
                  }}
                >
                  You have {unreadMessageCount} unread message{unreadMessageCount !== 1 ? 's' : ''}
                </Typography>
              </>
            ) : (
              <>
                <Avatar
                  src="/assets/images/chat/no-messageicon.png"
                  alt="No Messages Icon"
                  sx={{ width: 80, height: 80, marginBottom: 2 }}
                />
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    letterSpacing: 2,
                  }}
                >
                  No New messages!
                </Typography>
              </>
            )}
          </Box>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{
              fontFamily: (theme) => theme.typography.fontPrimaryFamily,
              letterSpacing: 1,
            }}
          >
            Select a chat to view here
          </Typography>
        </Box>
      );
    }

    // If no chats are available
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        sx={{ width: 1, height: '100%' }}
      >
        <Avatar
          src="/assets/images/chat/no-messageicon.png"
          alt="No Messages Icon"
          sx={{ width: 80, height: 80, marginBottom: 2 }}
        />
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            letterSpacing: 2,
          }}
        >
          No messages to show
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{
            fontFamily: (theme) => theme.typography.fontPrimaryFamily,
          }}
        >
          Woohoo! You have a clean inbox (for now)
        </Typography>
      </Box>
    );
  };

  // Renders the navigation

  const renderNav = <ChatNav contacts={[]} selectedConversationId={selectedConversationId} />;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Box
        sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: { xs: 3, md: 4 } }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: (theme) => theme.typography.fontSecondaryFamily,
            px: 2,
          }}
        >
          Chats 💬
        </Typography>
      </Box>

      <Stack direction="row" sx={{ height: '72vh' }} gap={2}>
        <Box sx={{ border: 1, borderRadius: 2, borderColor: '#EBEBEB' }}>{renderNav}</Box>

        <Stack
          sx={{
            width: 1,
            height: 1,
            overflow: 'hidden',
            border: 1,
            borderRadius: 2,
            borderColor: '#EBEBEB',
          }}
        >
          <Stack
            direction="row"
            sx={{
              width: 1,
              height: 1,
              overflow: 'hidden',
              borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderContent()}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}

ChatView.propTypes = {
  // id: PropTypes.object.isRequired,
  // threadId: PropTypes.string,
};
