import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Button, TextField, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

const MAX_POSTING_LINKS = 2;

const SubmissionPostingLinkField = ({
  postingLinks,
  onPostingLinkChange,
  onAddPostingLink,
  onRemovePostingLink,
  isEditable,
  disabled = false,
}) => (
  <>
    <Typography
      variant="body2"
      fontWeight="bold"
      color="#636366"
    >
      Posting Link
    </Typography>

    {isEditable ? (
      <Stack spacing={1} sx={{ mt: 1 }}>
        {postingLinks.map((link, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <TextField
              fullWidth
              value={link}
              onChange={(e) => onPostingLinkChange(index, e.target.value)}
              placeholder="Posting Link"
              disabled={disabled}
              sx={{
                maxWidth: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  backgroundColor: 'white',
                },
              }}
            />
            {index > 0 && (
              <IconButton
                size="small"
                onClick={() => onRemovePostingLink(index)}
                disabled={disabled}
                aria-label="Remove posting link"
              >
                <Iconify icon="eva:close-fill" />
              </IconButton>
            )}
          </Stack>
        ))}
        {postingLinks.length < MAX_POSTING_LINKS && (
          <Button
            size="small"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={onAddPostingLink}
            disabled={disabled}
            sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
          >
            Add another link
          </Button>
        )}
      </Stack>
    ) : (
      <Stack spacing={1} sx={{ mt: 1 }}>
        {postingLinks.length > 0 ? (
          postingLinks.map((link, index) => (
            <Typography
              key={index}
              component="a"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              sx={{
                color: '#0062CD',
                lineHeight: 1.5,
                p: 2,
                border: '1px solid #EBEBEB',
                borderRadius: 1,
                backgroundColor: '#fff',
                width: '100%',
                display: 'block',
                cursor: 'pointer',
                textDecoration: 'none',
                textOverflow: 'inherit',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {link}
            </Typography>
          ))
        ) : (
          <Box
            sx={{
              p: 2,
              border: '1px solid #EBEBEB',
              borderRadius: 1,
              backgroundColor: '#fff',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No posting link provided
            </Typography>
          </Box>
        )}
      </Stack>
    )}
  </>
);

SubmissionPostingLinkField.propTypes = {
  postingLinks: PropTypes.arrayOf(PropTypes.string).isRequired,
  onPostingLinkChange: PropTypes.func.isRequired,
  onAddPostingLink: PropTypes.func,
  onRemovePostingLink: PropTypes.func,
  isEditable: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
};

export default SubmissionPostingLinkField;
