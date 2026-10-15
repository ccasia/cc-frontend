import PropTypes from 'prop-types';
import { useRef, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

import { Box, Stack, InputBase, Typography, CircularProgress } from '@mui/material';

import { getCurrencyPrefix } from 'src/utils/currency';
import axiosInstance, { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';

const FRAME_SX = { borderRadius: 1, px: 0.75, py: 0.5, mx: -0.75, my: -0.5 };
const LINE_HEIGHT = '22px';

export default function AgreementBudgetCell({
  agreement,
  currency,
  disabled,
  locked,
  onSaved,
}) {
  const currencySymbol = getCurrencyPrefix(currency) || currency;
  const isLocked = Boolean(locked);
  const isReadOnly = disabled || isLocked;

  const storedValue = agreement?.budgetAmount == null ? '' : String(agreement.budgetAmount);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(storedValue);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingValue, setPendingValue] = useState(null);
  const [editorWidth, setEditorWidth] = useState(null);
  const valueRef = useRef(null);

  const savedValue = pendingValue ?? storedValue;

  const startEditing = () => {
    if (isReadOnly || isSaving) return;
    setEditorWidth(valueRef.current?.offsetWidth ?? null);
    setDraft(savedValue);
    setIsEditing(true);
  };

  const save = async () => {
    setIsEditing(false);

    const trimmed = draft.trim();
    const amount = trimmed === '' ? null : Number(trimmed);
    const current = savedValue === '' ? null : Number(savedValue);
    if (amount === current) return;

    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      enqueueSnackbar('Budget must be a positive number', { variant: 'error' });
      return;
    }

    try {
      setIsSaving(true);
      setPendingValue(amount === null ? '' : String(amount));
      await axiosInstance.patch(endpoints.campaign.agreementBudget(agreement.id), {
        budgetAmount: amount,
      });
      await onSaved?.();
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to update budget', { variant: 'error' });
    } finally {
      setPendingValue(null);
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') {
      setDraft(savedValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <InputBase
        autoFocus
        type="number"
        value={draft}
        placeholder="0.00"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        startAdornment={
          <Box component="span" sx={{ color: '#8E8E93', mr: 0.5, flexShrink: 0 }}>
            {currencySymbol}
          </Box>
        }
        inputProps={{ min: 0, step: '0.01', 'aria-label': 'Budget' }}
        sx={{
          ...FRAME_SX,
          display: 'flex',
          width: editorWidth ?? 'auto',
          bgcolor: '#ffffff',
          boxShadow: 'inset 0 0 0 1.5px #1340FF',
          fontSize: 13.5,
          fontWeight: 600,
          lineHeight: LINE_HEIGHT,
          '& input': { p: 0, height: LINE_HEIGHT },
          '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            m: 0,
          },
        }}
      />
    );
  }

  const hasBudget = savedValue !== '';
  // An empty, editable budget gets a resting grey fill so "Set budget" reads as clickable.
  const isPrompt = !isReadOnly && !hasBudget;

  // One trailing slot: the spinner takes the pencil's place while saving (same 14px footprint).
  let trailingIcon = null;
  if (isSaving) {
    trailingIcon = <CircularProgress size={14} sx={{ color: '#8E8E93' }} />;
  } else if (isLocked) {
    // A locked (approved) budget shows no icon at all, not the pencil.
    trailingIcon = null;
  } else if (hasBudget) {
    trailingIcon = <Iconify icon="solar:pen-linear" width={14} sx={{ color: '#8E8E93' }} />;
  } else if (!isReadOnly) {
    trailingIcon = (
      <Box
        className="budget-edit-icon"
        sx={{ display: 'flex', opacity: 0, transition: 'opacity 0.15s' }}
      >
        <Iconify icon="solar:pen-linear" width={14} sx={{ color: '#8E8E93' }} />
      </Box>
    );
  }

  return (
    <Stack
      ref={valueRef}
      direction="row"
      alignItems="center"
      spacing={0.75}
      onClick={(e) => {
        if (isReadOnly) return;
        e.stopPropagation();
        startEditing();
      }}
      sx={{
        width: 'fit-content',
        cursor: isReadOnly ? 'inherit' : 'text',
        ...FRAME_SX,
        bgcolor: isPrompt ? '#F5F5F5' : 'transparent',
        transition: 'background-color 0.15s',
        '&:hover': isReadOnly
          ? {}
          : { bgcolor: isPrompt ? '#EBEBEB' : '#F5F5F5', '& .budget-edit-icon': { opacity: 1 } },
      }}
    >
      {hasBudget ? (
        <Typography
          variant="subtitle2"
          sx={{ fontSize: 13.5, lineHeight: LINE_HEIGHT, fontWeight: 400 }}
        >
          {`${currencySymbol} ${Number(savedValue).toFixed(2)}`}
        </Typography>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: '#8E8E93',
            fontSize: { xs: '0.7rem', sm: '0.875rem' },
            lineHeight: LINE_HEIGHT,
          }}
        >
          {isReadOnly ? 'Not set' : 'Set budget'}
        </Typography>
      )}
      {trailingIcon}
    </Stack>
  );
}

AgreementBudgetCell.propTypes = {
  agreement: PropTypes.object,
  currency: PropTypes.string,
  disabled: PropTypes.bool,
  locked: PropTypes.bool,
  onSaved: PropTypes.func,
};
