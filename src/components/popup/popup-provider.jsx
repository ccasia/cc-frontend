import PropTypes from 'prop-types';
import React, { useMemo, useState, useContext, useCallback, createContext, useEffect } from 'react';

import { useAuthContext } from 'src/auth/hooks';
import useSocketContext from 'src/socket/hooks/useSocketContext';

import ShortlistingPopup from './shortlisting-popup';

const PopupContext = createContext();

export const usePopup = () => useContext(PopupContext);

const PopupProvider = ({ children }) => {
  const [shortlistingPopup, setShortlistingPopup] = useState({
    open: false,
    campaignData: null,
  });

  const { user } = useAuthContext();
  const { socket } = useSocketContext();

  const showShortlistingPopup = useCallback((campaignData) => {
    setShortlistingPopup({
      open: true,
      campaignData,
    });
  }, []);

  const hideShortlistingPopup = useCallback(() => {
    setShortlistingPopup({
      open: false,
      campaignData: null,
    });
  }, []);

  // Listen for shortlisting socket events
  useEffect(() => {
    if (socket && user?.role === 'creator') {
      const handleShortlisted = (data) => {
        // Show popup only for creators when they get shortlisted
        if (data?.campaignId && data?.campaignName) {
          showShortlistingPopup({
            campaignId: data.campaignId,
            campaignName: data.campaignName,
          });
        }
      };

      socket.on('shortlisted', handleShortlisted);

      return () => {
        socket.off('shortlisted', handleShortlisted);
      };
    }
  }, [socket, user, showShortlistingPopup]);

  const memoizedValue = useMemo(
    () => ({
      showShortlistingPopup,
      hideShortlistingPopup,
    }),
    [showShortlistingPopup, hideShortlistingPopup]
  );

  return (
    <PopupContext.Provider value={memoizedValue}>
      {children}
      
      {/* Shortlisting Popup */}
      <ShortlistingPopup
        open={shortlistingPopup.open}
        onClose={hideShortlistingPopup}
        campaignData={shortlistingPopup.campaignData}
      />
    </PopupContext.Provider>
  );
};

export default PopupProvider;

PopupProvider.propTypes = {
  children: PropTypes.node,
};
