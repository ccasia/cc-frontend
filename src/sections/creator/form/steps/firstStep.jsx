import PropTypes from 'prop-types';

import { Box, Avatar, Button, ListItemText } from '@mui/material';

import { useResponsive } from 'src/hooks/use-responsive';

const FirstStep = ({ item, onNext }) => {
  const smUp = useResponsive('up', 'sm');

  return (
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

      <Box
        width={1}
        px={4}
        sx={{
          ...(!smUp && {
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
          }),
        }}
      >
        <Button
          onClick={onNext}
          fullWidth={!smUp}
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
    </Box>
  );
};

export default FirstStep;

FirstStep.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
  }),
  onNext: PropTypes.func,
};
