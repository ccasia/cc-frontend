import PropTypes from 'prop-types';

import { Box, Stack, Tooltip, tooltipClasses } from '@mui/material';
import { styled } from '@mui/material/styles';

import Iconify from 'src/components/iconify';

import { COLORS } from '../utils';

// White card tooltip, same look as the Suggest dropdown
const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 340,
    padding: theme.spacing(0.75, 1.25),
    borderRadius: 10,
    border: `1px solid ${COLORS.border}`,
    backgroundColor: theme.palette.common.white,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.08)',
    color: theme.palette.grey[700],
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.4,
    textWrap: 'pretty',
  },
  [`& .${tooltipClasses.arrow}`]: {
    fontSize: 14,
    color: theme.palette.common.white,
    '&::before': { border: `1px solid ${COLORS.border}`, boxSizing: 'border-box' },
  },
}));

// Short delay so it does not flash when the pointer passes by; MUI opens the next one at once
export default function InfoTooltip(props) {
  return <StyledTooltip arrow enterDelay={150} TransitionProps={{ timeout: 150 }} {...props} />;
}

// Bold heading (with the item icons beside it), then a short line or one line per effect
export function TooltipContent({ heading, body, items, icon, iconColor }) {
  return (
    <>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {icon && <Iconify icon={icon} width={14} sx={{ color: iconColor, flexShrink: 0 }} />}
        {items?.map((item) => (
          <Iconify
            key={item.text}
            icon={item.icon}
            width={14}
            sx={{ color: item.color, flexShrink: 0 }}
          />
        ))}
        <Box sx={{ fontWeight: 600, color: COLORS.text }}>{heading}</Box>
      </Stack>

      {body && <Box sx={{ mt: 0.25 }}>{body}</Box>}

      {items?.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
          {items.map((item) =>
            items.length > 1 ? (
              <Stack key={item.text} direction="row" spacing={0.75}>
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    mt: '7px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    bgcolor: item.color,
                  }}
                />
                <span>{item.text}</span>
              </Stack>
            ) : (
              <span key={item.text}>{item.text}</span>
            )
          )}
        </Stack>
      )}
    </>
  );
}

TooltipContent.propTypes = {
  heading: PropTypes.node.isRequired,
  icon: PropTypes.string,
  iconColor: PropTypes.string,
  body: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.shape({ icon: PropTypes.string, color: PropTypes.string, text: PropTypes.string })
  ),
};
