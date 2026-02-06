import PropTypes from 'prop-types';
import { useRef, useMemo, useState, useContext, useCallback, createContext } from 'react';

import NpsFeedbackModal from './nps-feedback-modal';

const NpsContext = createContext();

export const useNps = () => useContext(NpsContext);

const NpsProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const onMutateRef = useRef(null);

  const showNpsModal = useCallback(() => {
    setOpen(true);
  }, []);

  const hideNpsModal = useCallback(() => {
    setOpen(false);
  }, []);

  const setOnMutate = useCallback((fn) => {
    onMutateRef.current = fn;
  }, []);

  const memoizedValue = useMemo(
    () => ({
      showNpsModal,
      setOnMutate,
    }),
    [showNpsModal, setOnMutate]
  );

  return (
    <NpsContext.Provider value={memoizedValue}>
      {children}

      <NpsFeedbackModal
        open={open}
        onSuccess={hideNpsModal}
        onMutate={() => onMutateRef.current?.()}
      />
    </NpsContext.Provider>
  );
};

export default NpsProvider;

NpsProvider.propTypes = {
  children: PropTypes.node,
};
