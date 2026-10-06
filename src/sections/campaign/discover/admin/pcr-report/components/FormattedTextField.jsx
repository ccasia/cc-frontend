import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';

import { Box, Stack, IconButton } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';

import { sanitizeReportHtml } from '../utils/sanitize-report-html';

/**
 * @param {Object} props
 * @param {'campaign_summary' |'engagement_interactions' |'views_analysis' |'audience_sentiment' |'top_creator_personas' |'campaign_recommendations'} props.section
 */

const FormattedTextField = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  sx = {},
  isAiGenerated = false,
  section,
}) => {
  const editorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // console.log(isInitialized);

  // Initialize content only once
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const applyFormat = (formatType) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText) return;

    // Save the current selection
    const { startContainer } = range;
    const { startOffset } = range;
    const { endContainer } = range;
    const { endOffset } = range;

    try {
      // Use execCommand for better browser compatibility
      // Even though deprecated, it still works reliably across browsers
      let command;
      if (formatType === 'bold') {
        command = 'bold';
      } else if (formatType === 'italic') {
        command = 'italic';
      } else if (formatType === 'underline') {
        command = 'underline';
      }

      // Focus the editor first
      if (editorRef.current) {
        editorRef.current.focus();
      }

      // Restore selection
      const newRange = document.createRange();
      newRange.setStart(startContainer, startOffset);
      newRange.setEnd(endContainer, endOffset);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Apply formatting
      document.execCommand(command, false, null);

      // Update the value
      if (editorRef.current) {
        onChange({ target: { value: sanitizeReportHtml(editorRef.current.innerHTML) } });
      }

      // Keep selection for potential additional formatting
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 0);
    } catch (error) {
      console.error('Error applying format:', error);

      // Fallback to manual DOM manipulation
      let formattedElement;
      if (formatType === 'bold') {
        formattedElement = document.createElement('strong');
      } else if (formatType === 'italic') {
        formattedElement = document.createElement('em');
      } else if (formatType === 'underline') {
        formattedElement = document.createElement('u');
      }

      formattedElement.textContent = selectedText;
      range.deleteContents();
      range.insertNode(formattedElement);

      // Move cursor after the inserted element
      const newRange = document.createRange();
      newRange.setStartAfter(formattedElement);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Update the value
      if (editorRef.current) {
        onChange({ target: { value: sanitizeReportHtml(editorRef.current.innerHTML) } });
      }
    }
  };

  const handleInput = (e) => {
    onChange({ target: { value: sanitizeReportHtml(e.currentTarget.innerHTML) } });
  };

  const handleKeyDown = (e) => {
    // Check for Cmd (Mac) or Ctrl (Windows/Linux)
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyFormat('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyFormat('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        applyFormat('underline');
      }
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Formatting Toolbar */}
      <Stack
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
        direction="row"
        alignItems="center"
        spacing={1}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '4px',
            padding: '2px',
          }}
        >
          <IconButton
            size="small"
            onClick={() => applyFormat('bold')}
            sx={{ width: 24, height: 24, color: '#636366' }}
          >
            <FormatBoldIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => applyFormat('italic')}
            sx={{ width: 24, height: 24, color: '#636366' }}
          >
            <FormatItalicIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => applyFormat('underline')}
            sx={{ width: 24, height: 24, color: '#636366' }}
          >
            <FormatUnderlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* {isAiGenerated && (
          <Button
            size="small"
            sx={{
              color: '#636366',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '4px',
              boxShadow: '0px 2px rgba(231, 231, 231, 1)',
              border: 1.5,
              borderColor: 'rgba(231, 231, 231, 1)',
            }}
            startIcon={<Iconify icon="codicon:refresh" sx={{ ml: 0.5 }} />}
            variant="outlined"
            onClick={() => mutation.mutate()}
          >
            Regenerate
          </Button>
        )} */}
      </Stack>

      {/* Editable Content */}
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        sx={{
          minHeight: `${rows * 24}px`,
          padding: '12px',
          paddingTop: '40px',
          paddingRight: '100px',
          borderRadius: '8px',
          border: '1px solid #E5E7EB',
          outline: 'none',
          fontFamily: 'Aileron',
          fontWeight: 400,
          fontSize: '20px',
          lineHeight: '24px',
          color: '#231F20',
          bgcolor: '#F3F4F6',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          '&:focus': {
            borderColor: '#1340FF',
          },
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: '#9CA3AF',
          },
          '& strong': {
            fontWeight: 700,
            fontFamily: 'Aileron',
          },
          '& em': {
            fontStyle: 'italic',
            fontFamily: 'Aileron',
          },
          '& u': {
            textDecoration: 'underline',
            fontFamily: 'Aileron',
          },
          ...(isAiGenerated && {
            borderColor: 'rgba(138, 90, 254, 1)',
            background: 'rgba(138, 90, 254, 0.2)',
          }),
          ...sx,
        }}
      />
    </Box>
  );
};

export default FormattedTextField;

FormattedTextField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  sx: PropTypes.object,
  isAiGenerated: PropTypes.bool,
  section: PropTypes.string,
};
