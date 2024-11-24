/* eslint-disable perfectionist/sort-imports */
import 'src/utils/highlight';

import PropTypes from 'prop-types';
import ReactQuill from 'react-quill';

import { alpha } from '@mui/material/styles';

import { useRef, useState } from 'react';
import { StyledEditor } from './styles';
import Toolbar, { formats } from './toolbar';

// ----------------------------------------------------------------------

export default function Editor({
  id = 'minimal-quill',
  error,
  simple = false,
  helperText,
  sx,
  ...other
}) {
  const modules = {
    toolbar: {
      container: `#${id}`,
    },
    history: {
      delay: 500,
      maxStack: 100,
      userOnly: true,
    },
    syntax: true,
    clipboard: {
      matchVisual: false,
    },
  };

  const quillRef = useRef(null);
  const [savedRange, setSavedRange] = useState(null);

  const handleSelectionChange = (range, source, editor) => {
    if (range && source === 'user') {
      setSavedRange(range);
    }
  };

  return (
    <>
      <StyledEditor
        sx={{
          ...(error && {
            border: (theme) => `solid 1px ${theme.palette.error.main}`,
            '& .ql-editor': {
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
            },
          }),
          ...sx,
        }}
      >
        <Toolbar id={id} simple={simple} quillRef={quillRef} savedRange={savedRange} />

        <ReactQuill
          ref={quillRef}
          modules={modules}
          formats={formats}
          onChangeSelection={handleSelectionChange}
          onChange={(e) => console.log(e)}
          placeholder="Pitch your text here !"
          {...other}
        />
      </StyledEditor>

      {helperText && helperText}
    </>
  );
}

Editor.propTypes = {
  error: PropTypes.bool,
  helperText: PropTypes.object,
  id: PropTypes.string,
  simple: PropTypes.bool,
  sx: PropTypes.object,
};
