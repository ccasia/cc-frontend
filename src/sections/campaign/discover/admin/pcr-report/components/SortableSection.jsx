import React from 'react';
import PropTypes from 'prop-types';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

import Box from '@mui/material/Box';

const SortableSection = ({ id, children, isEditMode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !isEditMode,
  });

  const style = {
    transform: isDragging
      ? `${CSS.Transform.toString(transform)} scale(0.95)`
      : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const handlePointerDown = (e) => {
    const { target } = e;
    const tagName = target.tagName.toLowerCase();
    if (
      tagName === 'button' ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'a' ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('a') ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]') ||
      target.onclick ||
      target.closest('[onclick]') ||
      window.getComputedStyle(target).cursor === 'pointer'
    ) {
      e.stopPropagation();
      return;
    }

    // Allow drag for other elements
    if (listeners?.onPointerDown) {
      listeners.onPointerDown(e);
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      onPointerDown={isEditMode ? handlePointerDown : undefined}
      sx={{
        cursor: isEditMode ? 'grab' : 'default',
        '&:active': {
          cursor: isEditMode ? 'grabbing' : 'default',
        },
        '& button, & input, & textarea, & a, & [contenteditable="true"]': {
          cursor: 'pointer !important',
        },
        '& input, & textarea': {
          cursor: 'text !important',
        },
      }}
    >
      {children}
    </Box>
  );
};

SortableSection.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  isEditMode: PropTypes.bool.isRequired,
};

export default SortableSection;
