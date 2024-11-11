import PropTypes from 'prop-types';

import { Box, Avatar, Button, ListItemText } from '@mui/material';

const FirstStep = ({ item, onNext }) => (
  <Box sx={{ textAlign: 'center' }}>
    <Avatar sx={{ width: 60, height: 60, bgcolor: '#FFF0E5', mx: 'auto' }}>👽</Avatar>
    <ListItemText
      sx={{
        mt: 2,
        textAlign: 'center',
      }}
      primary={item.title}
      secondary={item.description}
      primaryTypographyProps={{
        fontFamily: (theme) => theme.typography.fontSecondaryFamily,
        variant: 'h3',
        fontWeight: 400,
      }}
      secondaryTypographyProps={{
        variant: 'subtitle2',
      }}
    />

    <Button
      onClick={onNext}
      sx={{
        mt: 5,
        bgcolor: '#1340FF',
        boxShadow: '0px -3px 0px 0px rgba(0, 0, 0, 0.45) inset',
        color: '#FFF',
        px: 5,
        py: 1,
        '&:hover': {
          bgcolor: '#1340FF',
        },
      }}
    >
      Let&apos;s go!
    </Button>
  </Box>
);

export default FirstStep;

FirstStep.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
  onNext: PropTypes.func,
};
