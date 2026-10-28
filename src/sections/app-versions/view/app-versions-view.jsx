import { useState } from 'react';

import { Box, Stack, Skeleton, Container, Typography } from '@mui/material';

import PlatformTabs from '../components/platform-tabs';
import PlatformPanel from '../components/platform-panel';
import { useAppVersionPolicies } from '../hooks/use-app-version-policies';

export default function AppVersionsView() {
  const { policies, isPending, isError } = useAppVersionPolicies();
  const [platform, setPlatform] = useState('IOS');
  const policy = policies.find((item) => item.platform === platform) ?? policies[0];

  return (
    <Container maxWidth="lg">
      <Box>
        <Typography
          sx={{ fontFamily: (theme) => theme.typography.fontSecondaryFamily, fontSize: 48, mb: 1 }}
        >
          App Versions
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 880 }}>
          Decide which mobile app versions must update and which get an optional prompt. Raise the
          minimum version only when old builds stop working.
        </Typography>

        {isError && (
          <Typography variant="body2" sx={{ color: 'error.main' }}>
            Could not load app versions. Refresh the page to try again.
          </Typography>
        )}

        {isPending && (
          <Stack spacing={3}>
            <Skeleton variant="rounded" width={240} height={46} />
            <Skeleton variant="rounded" height={52} />
            <Skeleton variant="rounded" height={480} />
          </Stack>
        )}

        {policy && (
          <PlatformPanel
            key={policy.platform}
            policy={policy}
            tabs={
              <PlatformTabs policies={policies} value={policy.platform} onChange={setPlatform} />
            }
          />
        )}
      </Box>
    </Container>
  );
}
