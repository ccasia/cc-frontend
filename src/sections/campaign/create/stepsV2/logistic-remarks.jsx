import { useRef } from 'react';
import PropTypes from 'prop-types';
import { Controller, useFormContext } from 'react-hook-form';

import { Box, Chip, Stack, FormLabel, TextField, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import { pressSx } from '../components/motion';
import { multiLineSx } from '../components/field-styles';

const TOPICS = [
  'Payment arrangement',
  'Venue policies',
  'Cancellation policy',
  'Instructions',
  'Rules and disclaimers',
  'Menu links',
];

const PLACEHOLDER = [
  'Payment arrangement: Sponsored by the brand',
  'Venue policies: No pets, smart casual dress code',
  'Cancellation policy: Tell us at least 24 hours before',
].join('\n');

const hasTopic = (text, topic) => new RegExp(`^${topic}:`, 'im').test(text ?? '');

const LogisticRemarks = ({ align = 'center', topSpacing = 5 }) => {
  const { control, getValues, setValue } = useFormContext();
  const boxRef = useRef(null);

  // Adds "Topic: " on a new line and puts the cursor after it
  const addTopic = (topic) => {
    const current = (getValues('clientRemarks') ?? '').replace(/\s+$/, '');
    setValue('clientRemarks', `${current ? `${current}\n` : ''}${topic}: `, { shouldDirty: true });
    setTimeout(() => {
      const input = boxRef.current?.querySelector('textarea[name="clientRemarks"]');
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
      input.scrollTop = input.scrollHeight;
    });
  };

  return (
    <Box sx={{ pt: topSpacing, pb: 5 }}>
      <Box ref={boxRef} sx={{ maxWidth: 600, mx: align === 'left' ? 0 : 'auto', mb: 10 }}>
        <FormLabel
          htmlFor="client-remarks"
          sx={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: 'black' }}
        >
          Remarks for creators
        </FormLabel>
        <Typography sx={{ fontSize: 14, lineHeight: '20px', color: '#636366', mt: 0.5 }}>
          Optional. Every creator in this campaign sees these details. Tap a topic to add it.
        </Typography>

        <Controller
          name="clientRemarks"
          control={control}
          render={({ field }) => (
            <>
              <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 1.5, mb: 2 }}>
                {TOPICS.map((topic) => {
                  const added = hasTopic(field.value, topic);
                  return (
                    <Chip
                      key={topic}
                      label={topic}
                      size="small"
                      variant="outlined"
                      disabled={added}
                      onClick={() => addTopic(topic)}
                      icon={
                        <Iconify icon={added ? 'eva:checkmark-fill' : 'eva:plus-fill'} width={14} />
                      }
                      sx={{
                        height: 28,
                        borderRadius: '8px',
                        borderColor: '#E8E8E8',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#231F20',
                        transition: 'transform 140ms ease-out, background-color 150ms ease',
                        '& .MuiChip-icon': { color: 'inherit', ml: '6px' },
                        '&.Mui-disabled': { opacity: 1, color: '#8E8E93', bgcolor: '#F4F6F8' },
                        ...pressSx,
                      }}
                    />
                  );
                })}
              </Stack>

              <TextField
                {...field}
                value={field.value ?? ''}
                id="client-remarks"
                placeholder={PLACEHOLDER}
                multiline
                minRows={6}
                maxRows={16}
                fullWidth
                sx={multiLineSx}
              />
            </>
          )}
        />
      </Box>
    </Box>
  );
};

LogisticRemarks.propTypes = {
  align: PropTypes.oneOf(['center', 'left']),
  topSpacing: PropTypes.number,
};

export default LogisticRemarks;
