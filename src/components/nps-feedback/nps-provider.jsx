import PropTypes from 'prop-types';
import { useMemo, useState, useContext, useCallback, createContext } from 'react';

import NpsFeedbackModal from './nps-feedback-modal';

const NpsContext = createContext();

export const useNps = () => useContext(NpsContext);

const NpsProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  const showNpsModal = useCallback(() => {
    setOpen(true);
  }, []);

  const hideNpsModal = useCallback(() => {
    setOpen(false);
  }, []);

  const memoizedValue = useMemo(
    () => ({
      showNpsModal,
    }),
    [showNpsModal]
  );

  return (
    <NpsContext.Provider value={memoizedValue}>
      {children}

      <NpsFeedbackModal open={open} onSuccess={hideNpsModal} />
    </NpsContext.Provider>
  );
};

export default NpsProvider;

NpsProvider.propTypes = {
  children: PropTypes.node,
};
