import { useParams } from 'react-router-dom';

//  import Image from "material-ui-image";
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Box, Avatar, Divider } from '@mui/material';

import { useSearchParams } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

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
  const { threads, loading } = useGetAllThreads(); // Fetch all threads using hook
  const smDown = useResponsive('down', 'sm');

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
                  fontSize="36px"
                  gutterBottom
                  sx={{
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    letterSpacing: 0,
                    marginBottom: -0.25,
                  }}
                >
                  No messages to show
                </Typography>
              </>
            )}
          </Box>
          <Typography
            fontSize="16px"
            color="#636366"
            sx={{
              fontFamily: (theme) => theme.typography.fontPrimaryFamily,
              letterSpacing: 0,
            }}
          >
            Woohoo! You have a clean inbox (for now)
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
    <Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!smDown && (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: { md: 4 } }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: (theme) => theme.typography.fontSecondaryFamily,
              fontWeight: 'normal',
              px: !smDown && 2,
              mt: 2,
              mb: -2,
              ml: -1.5,
            }}
          >
            Chats 💬
          </Typography>
        </Box>
      )}

      {/* {smDown && <Divider sx={{ my: 1 }} />} */}

      {smDown && (
        <>
          {!id ? (
            <>
              <Box
                sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: { md: 4 } }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: (theme) => theme.typography.fontSecondaryFamily,
                    fontWeight: 'normal',
                    px: !smDown && 2,
                  }}
                >
                  Chats 💬
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <ChatNav contacts={[]} selectedConversationId={selectedConversationId} />
            </>
          ) : (
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
          )}
        </>
      )}

      {!smDown && (
        <Stack
          direction="row"
          sx={{
            flex: 1,
            minHeight: 0,
          }}
          gap={2}
        >
          <Box
            sx={{
              border: 1,
              borderRadius: 2,
              borderColor: '#EBEBEB',
              p: 2,
              overflowY: 'hidden',
              minWidth: 400,
              flexShrink: 0,
            }}
          >
            {renderNav}
          </Box>

          <Stack
            sx={{
              width: 1,
              height: '100%',
              border: 1,
              borderRadius: 2,
              borderColor: '#EBEBEB',
              flexGrow: 1,
            }}
          >
            <Stack
              direction="row"
              sx={{
                width: 1,
                height: 1,
                borderTop: (theme) => `solid 1px ${theme.palette.divider}`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {renderContent()}
            </Stack>
          </Stack>
        </Stack>
      )}
    </Container>
  );
}

ChatView.propTypes = {
  // id: PropTypes.object.isRequired,
  // threadId: PropTypes.string,
};
