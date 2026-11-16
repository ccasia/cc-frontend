import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useContext, createContext } from 'react';

import { Box } from '@mui/material';

import { sectionInSx } from './motion';

const StepOpened = createContext(null);

// A section that is there when its step opens comes in with the step's own slide.
// Only a section that shows up later (a pick made on the step) plays its own entrance.
export function StepOpenedProvider({ children }) {
  const opened = useRef(false);
  useEffect(() => {
    opened.current = true;
  }, []);
  return <StepOpened.Provider value={opened}>{children}</StepOpened.Provider>;
}

StepOpenedProvider.propTypes = { children: PropTypes.node };

// Decided once, when the section mounts, so a later render never starts the animation
export function useEntrance(sx) {
  const opened = useContext(StepOpened);
  const [play] = useState(() => !opened || opened.current);
  return play ? sx : undefined;
}

export default function SectionIn({ component: Component = Box, sx, ...other }) {
  const entrance = useEntrance(sectionInSx);
  return <Component sx={{ ...entrance, ...sx }} {...other} />;
}

SectionIn.propTypes = {
  component: PropTypes.elementType,
  sx: PropTypes.object,
};
