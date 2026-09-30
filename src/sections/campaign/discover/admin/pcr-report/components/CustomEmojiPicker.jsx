import React from 'react';
import PropTypes from 'prop-types';
import EmojiPicker from 'emoji-picker-react';

import { Popover } from '@mui/material';

const CustomEmojiPicker = ({ anchor, onClose, onPick }) => (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={() => {
        onClose();
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <EmojiPicker
        onEmojiClick={(emojiObject) => {
          onPick(emojiObject);
          onClose();
        }}
      />
    </Popover>
  );

export default CustomEmojiPicker;

CustomEmojiPicker.propTypes = {
  anchor: PropTypes.func,
  onClose: PropTypes.func,
  // emojiPickerType: PropTypes.string,
  onPick: PropTypes.func,
};
