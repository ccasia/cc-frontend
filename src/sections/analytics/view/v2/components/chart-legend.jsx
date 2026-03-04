import PropTypes from 'prop-types';

import { Stack, Typography } from '@mui/material';

export default function ChartLegend({ items, interactive, hiddenSeries, onToggle }) {
  return (
    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
      {items.map((item) => {
        const isHidden = interactive && hiddenSeries?.includes(item.label);

        return (
          <Stack
            key={item.label}
            direction="row"
            alignItems="center"
            spacing={0.75}
            onClick={interactive && onToggle ? () => onToggle(item.label) : undefined}
            sx={{
              cursor: interactive ? 'pointer' : 'default',
              opacity: isHidden ? 0.4 : 1,
              transition: 'opacity 0.2s ease',
              userSelect: 'none',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: item.color,
                display: 'inline-block',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: '#666',
                fontWeight: 500,
                fontSize: 12,
                textDecoration: isHidden ? 'line-through' : 'none',
              }}
            >
              {item.label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

ChartLegend.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
  interactive: PropTypes.bool,
  hiddenSeries: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func,
};
