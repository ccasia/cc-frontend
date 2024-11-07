import PropTypes from 'prop-types';
import React, { useMemo, useState, useContext, useCallback, createContext } from 'react';

import { Box } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

const Poppup = createContext();

export const useNotification = () => useContext(Poppup);

const PoppupProvider = ({ children }) => {
  const [notifications, setNotifications] = useState('adssa');
  const bool = useBoolean();

  const test = useCallback((text) => {
    alert(text);
  }, []);

  const memoizedValue = useMemo(() => ({ notifications, bool, test }), [notifications, bool, test]);

  return (
    <Poppup.Provider value={memoizedValue}>
      {bool.value && (
        <Box
          sx={{
            width: 400,
            height: 300,
            position: 'fixed',
            bgcolor: '#F4F4F4',
            zIndex: 1000,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderRadius: 2,
          }}
        />
      )}

      {children}
    </Poppup.Provider>
  );
};

export default PoppupProvider;

PoppupProvider.propTypes = {
  children: PropTypes.node,
};
