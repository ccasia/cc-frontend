import PropTypes from 'prop-types';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Stack,
  Avatar,
  Accordion,
  Typography,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';

const colors = {
  accent: '#1340FF',
  primary: '#000000',
  border: '#E8ECEE',
};

export default function AnalyticsSection({ title, icon: Icon, children, defaultExpanded = true }) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{
        boxShadow: 'none',
        border: `1px solid ${colors.border}`,
        borderRadius: '12px !important',
        '&:before': { display: 'none' },
        mb: 4,
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 3,
          py: 1,
          '& .MuiAccordionSummary-content': { my: 1.5 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: `${colors.accent}15`, color: colors.accent, width: 40, height: 40 }}>
            <Icon />
          </Avatar>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: colors.primary,
              fontSize: '1.1rem',
              fontFamily: 'Instrument Serif, serif',
            }}
          >
            {title}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
        {children}
      </AccordionDetails>
    </Accordion>
  );
}

AnalyticsSection.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
  defaultExpanded: PropTypes.bool,
};
