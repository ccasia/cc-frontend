import PropTypes from 'prop-types';
import { m, useReducedMotion } from 'framer-motion';

// Short fade and rise when a section mounts, e.g. switching between settings and the edit form
export default function SwapIn({ children }) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </m.div>
  );
}

SwapIn.propTypes = {
  children: PropTypes.node,
};
