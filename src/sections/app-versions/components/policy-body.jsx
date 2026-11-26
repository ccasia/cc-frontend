import PropTypes from 'prop-types';

import { Box, Stack, Divider } from '@mui/material';

import Section from './section';
import PhonePreview from './phone-preview';
import VersionRuler from './version-ruler';
import { COLORS } from '../utils';

// Page layout: one Versions card on the left (status, ruler, then rows or fields), sticky phone preview on the right
export default function PolicyBody({
  top,
  title,
  titleAdornment,
  description,
  action,
  statusBadge,
  status,
  minimumVersion,
  latestVersion,
  storeVersion,
  storeName,
  message,
  animateRuler,
  children,
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' },
        alignItems: 'start',
      }}
    >
      <Stack
        spacing={3.5}
        divider={<Divider sx={{ borderColor: COLORS.border }} />}
        sx={{
          minWidth: 0,
          pr: { md: 4 },
          borderRight: { md: `1px solid ${COLORS.border}` },
        }}
      >
        {top}

        <Section
          title={title}
          titleAdornment={
            <>
              {titleAdornment}
              {statusBadge}
            </>
          }
          description={description}
          action={action}
        >
          <Box sx={{ borderRadius: 1.5, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            {status}
            <Box sx={{ px: 2.5, pt: 2, pb: 1.75, borderBottom: `1px solid ${COLORS.border}` }}>
              <VersionRuler
                minimumVersion={minimumVersion}
                latestVersion={latestVersion}
                storeVersion={storeVersion}
                storeName={storeName}
                animateIn={animateRuler}
              />
            </Box>
            {children}
          </Box>
        </Section>
      </Stack>

      <Box
        sx={{
          position: { md: 'sticky' },
          top: { md: 96 },
          pl: { md: 4 },
          pt: { xs: 4, md: 0 },
          mt: { xs: 4, md: 0 },
          borderTop: { xs: `1px solid ${COLORS.border}`, md: 'none' },
        }}
      >
        <Section title="Preview" description="What users see in the app.">
          <PhonePreview
            minimumVersion={minimumVersion}
            latestVersion={latestVersion}
            message={message}
          />
        </Section>
      </Box>
    </Box>
  );
}

PolicyBody.propTypes = {
  top: PropTypes.node,
  title: PropTypes.string.isRequired,
  titleAdornment: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
  statusBadge: PropTypes.node,
  status: PropTypes.node,
  minimumVersion: PropTypes.string.isRequired,
  latestVersion: PropTypes.string.isRequired,
  storeVersion: PropTypes.string,
  storeName: PropTypes.string,
  message: PropTypes.string,
  animateRuler: PropTypes.bool,
  children: PropTypes.node,
};
