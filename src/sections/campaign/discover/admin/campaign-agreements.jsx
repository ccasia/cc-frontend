/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { enqueueSnackbar } from 'notistack';
import { useNavigate, useLocation } from 'react-router';
import { memo, useMemo, useState, useEffect, useCallback } from 'react';

import { alpha } from '@mui/system';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Menu,
  Table,
  Stack,
  Button,
  Dialog,
  Avatar,
  Tooltip,
  Divider,
  Checkbox,
  TableRow,
  MenuItem,
  TableCell,
  TableHead,
  TableBody,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  InputAdornment,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import useSyncCampaignCredits from 'src/hooks/use-sync-campaign-credits';
import { useGetAgreements } from 'src/hooks/agreement/use-get-agreements';

import { fDate } from 'src/utils/format-time';
import { getCurrencyPrefix } from 'src/utils/currency';
import axiosInstance, { endpoints } from 'src/utils/axios';
import { getCampaignBudget } from 'src/utils/campaign-budget';
import { resolveTierPlatformForDisplay } from 'src/utils/credit-tier-platform';

import { useAuthContext } from 'src/auth/hooks';
import { OUTREACH_STATUS_OPTIONS } from 'src/contants/outreach';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useMainContext } from 'src/layouts/dashboard/hooks/dsahboard-context';

import Iconify from 'src/components/iconify';
import { useTable } from 'src/components/table';
import EmptyContent from 'src/components/empty-content';
import { RHFTextField } from 'src/components/hook-form';
import ScrollTabs from 'src/components/table/scroll-tabs';
import SortableHeader from 'src/components/table/sortable-header';
import FormProvider from 'src/components/hook-form/form-provider';
import { StatusChip, useOneLineChipWidth } from 'src/components/status-chip';

import { INDEX_SX } from '../master-list-row-kit';
import AgreementBudgetCell from './agreement-budget-cell';
import AgreementOutreachCell from './agreement-outreach-cell';
import CampaignAgreementEdit from './campaign-agreement-edit';
import ReceiptRequiredToggle from './receipt-required-toggle';
import SendBulkAgreementModal from './send-bulk-agreement-modal';
import RegenerateInvoiceDialog from './regenerate-invoice-dialog';
import usePitchSocket from '../client/v3-pitches/use-pitch-socket';
import SendAdditionalAgreementModal from './send-additional-agreement-modal';
import OutreachFilterMenu, { OUTREACH_NOT_SET } from './outreach-filter-menu';
import {
  useColumnOrder,
  REORDER_TABLE_ATTR,
  ColumnReorderProvider,
  DraggableColumnHeader,
} from './agreement-column-reorder';

const ROUND_LABELS = {
  1: 'First Agreement',
  2: 'Second Agreement',
  3: 'Third Agreement',
  4: 'Fourth Agreement',
  5: 'Fifth Agreement',
  6: 'Sixth Agreement',
  7: 'Seventh Agreement',
  8: 'Eighth Agreement',
  9: 'Ninth Agreement',
  10: 'Tenth Agreement',
};

const getRoundLabel = (round) => ROUND_LABELS[round] || `Agreement ${round}`;

const FILTER_PILL_SX = {
  height: 34,
  minHeight: 34,
  padding: '8px 16px',
  gap: '4px',
  border: 'none',
  borderBottom: 'none',
  borderRadius: '100px',
  fontFamily: 'Inter Display, Inter, sans-serif',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '18px',
  textTransform: 'none',
  whiteSpace: 'nowrap',
  minWidth: 'unset',
  flexShrink: 0,
  boxShadow: 'none',
  '& .MuiButton-endIcon': {
    ml: 0,
    mr: 0,
  },
};

const getFilterPillSx = (isActive) => ({
  ...FILTER_PILL_SX,
  bgcolor: isActive ? 'rgba(19, 64, 255, 0.10)' : '#F5F5F5',
  color: isActive ? '#1340FF' : '#231F20',
  fontWeight: isActive ? 600 : 500,
  '&:hover': {
    bgcolor: isActive ? 'rgba(19, 64, 255, 0.16)' : '#EBEBEB',
    border: 'none',
    borderBottom: 'none',
    boxShadow: 'none',
  },
});

function FilterPillEndIcons({ isActive, isOpen, onClear, clearLabel }) {
  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClear();
  };

  return (
    <Stack direction="row" alignItems="center" spacing={0.25} component="span">
      {isActive && (
        <Box
          component="span"
          role="button"
          tabIndex={0}
          aria-label={clearLabel}
          onClick={handleClear}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              handleClear(event);
            }
          }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            borderRadius: '50%',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'rgba(19, 64, 255, 0.16)',
            },
          }}
        >
          <Iconify icon="eva:close-fill" width={14} />
        </Box>
      )}
      <Iconify
        icon="eva:chevron-down-fill"
        width={20}
        sx={{
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}
      />
    </Stack>
  );
}

FilterPillEndIcons.propTypes = {
  isActive: PropTypes.bool,
  isOpen: PropTypes.bool,
  onClear: PropTypes.func.isRequired,
  clearLabel: PropTypes.string.isRequired,
};

// Custom checkbox look: white square with a blue border + blue check when checked, plain
// grey-outlined square when empty — square corners (no radius) — used for both the header
// "select all" and the per-row "select for additional agreement" checkboxes.
const checkboxIconSx = {
  width: 16,
  height: 16,
  borderRadius: 0.4,
  border: '1.5px solid #D9D9D9',
  bgcolor: '#fff',
};
const uncheckedCheckboxIcon = <Box component="span" sx={checkboxIconSx} />;

const CHECKBOX_CELL_SX = { width: 28, minWidth: 28, pl: 1.5, pr: 0 };
const INDEX_CELL_SX = { width: 32, minWidth: 32, pl: 0.5, pr: 1.5, textAlign: 'center' };
// Shared by the Status header and body cells: the column's measured width excludes padding, so
// both must pad the same for the chips to line up and fit.
const STATUS_CELL_PX = { xs: 0, sm: 2 };

// The actions column is pinned to the right edge; when the table overflows, the other columns
// scroll sideways underneath it. The shadow shows while there's content hidden beneath it.
const CTA_CELL_SX = { position: 'sticky', right: 0, zIndex: 1, transition: 'box-shadow 0.2s' };
const CTA_SHADOW = '-8px 0 8px -8px rgba(0, 0, 0, 0.18)';

const checkedCheckboxIcon = (
  <Box
    component="span"
    sx={{
      ...checkboxIconSx,
      border: '1.5px solid #1340FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Iconify icon="eva:checkmark-fill" width={11} sx={{ color: '#1340FF' }} />
  </Box>
);

const AMOUNT_TEXT_SX = { fontSize: { xs: '0.7rem', sm: '0.875rem' } };

// White icon button with the same 3px lip as the text action buttons beside it. The row's Stack
// stretches it to their height.
const ICON_ACTION_SX = {
  minWidth: 0,
  px: 1.25,
  py: 2,
  bgcolor: '#ffffff',
  color: '#221f20',
  border: '1.5px solid',
  borderColor: '#e7e7e7',
  borderBottom: '3px solid',
  borderBottomColor: '#e7e7e7',
  borderRadius: 1.15,
  '&:hover': {
    bgcolor: '#f5f5f5',
    border: '1.5px solid',
    borderColor: '#221f20',
    borderBottom: '3px solid',
    borderBottomColor: '#221f20',
  },
  '&.Mui-disabled': {
    bgcolor: '#ffffff',
    border: '1.5px solid #e7e7e7',
    borderBottom: '3px solid #e7e7e7',
    cursor: 'not-allowed',
    pointerEvents: 'auto',
  },
};

function renderAmountText(content) {
  return (
    <Typography variant="body2" sx={AMOUNT_TEXT_SX}>
      {content}
    </Typography>
  );
}

const AMOUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// 'MYR' → 'RM', 'SGD' → 'S$', ...; unknown codes are shown as-is.
const toCurrencySymbol = (code) => getCurrencyPrefix(code) || code;

const formatMoney = (amount, code) =>
  `${toCurrencySymbol(code)} ${AMOUNT_FORMATTER.format(amount)}`;

const formatAmountsByCurrency = (amountsByCurrency) => {
  const entries = Object.entries(amountsByCurrency);
  if (entries.length === 0) return '0';
  return entries.map(([code, amount]) => formatMoney(amount, code)).join(' | ');
};

// Price and budget for a row are both in the shortlisted creator's currency.
// Returns the currency code (e.g. 'MYR'): the footer groups and compares budgets by code.
const getRowCurrency = (item) =>
  (item?.user?.shortlisted?.[0] || item?.shortlistedCreator)?.currency || 'MYR';

// Guest creators must link a platform account before send; submissions merge by userId.
// Platform creators often have no AGREEMENT_FORM row until after the agreement is sent (v4 flow).
const guestNeedsLinkBeforeSend = (item) =>
  item?.user?.creator?.isGuest === true && !item?.submission;

// The admin's keyed-in budget can't be edited once the agreement is approved.
const isBudgetLocked = (item) => item?.submission?.status === 'APPROVED';

// Label and colour of a row's agreement status chip.
const getAgreementStatus = (item) => {
  if (item?.submission?.status === 'PENDING_REVIEW') {
    return { text: 'PENDING APPROVAL', color: '#FFC702' };
  }
  if (item?.submission?.status === 'APPROVED') return { text: 'APPROVED', color: '#1ABF66' };
  if (item?.isSent) return { text: 'Sent To Creator', color: '#8A5AFE' };
  return { text: 'Pending', color: '#f19f39' };
};

// Green above half left, orange at half or less, red at a quarter or less.
const getRemainingColor = (remaining, total) => {
  const remainingPct = total > 0 ? remaining / total : 0;
  if (remainingPct <= 0) return '#FF5630';
  if (remainingPct <= 0.5) return '#FFAB00';
  return '#1ABF66';
};

function AgreementRowContent({
  item,
  index,
  visibleColumns,
  campaign,
  isDisabled,
  smUp,
  ctaShadow,
  isSelected,
  selectionCategory,
  isEligibleForAdditional,
  isReceiptSaving,
  approveLoading,
  rejectLoading,
  actions,
}) {
  const {
    getTierDataForItem,
    handleViewAgreement,
    handleEditAgreement,
    handleSendAgreement,
    handleProfileClick,
    handleOutreachSaved,
    handleApproveAgreement,
    handleOpenRejectDialog,
    handleToggleReceiptRequired,
    mutateAgreements,
    onToggleSelect,
  } = actions;

  // The gap after the fixed index column is its own right padding, so whichever column comes
  // first drops its left padding (Creator, by default).
  const firstColumnSx = (id) => (id === visibleColumns[0] ? { pl: 0 } : {});

  const isAmountValid = !Number.isNaN(
    parseFloat(item?.user?.shortlisted[0]?.amount?.toString()) ||
      parseFloat(item?.amount?.toString())
  );

  const isPendingReview = item?.submission?.status === 'PENDING_REVIEW';
  const rowCategory = isEligibleForAdditional ? 'additional' : 'bulk';
  const isCategoryLocked = selectionCategory && selectionCategory !== rowCategory;
  const checkboxTooltip = isCategoryLocked
    ? `Clear your current selection to pick a creator for ${
        selectionCategory === 'bulk' ? 'a bulk' : 'an additional'
      } agreement`
    : '';

  const product = item?.productSeeding?.length ? item.productSeeding[0] : null;
  const agreementStatus = getAgreementStatus(item);

  const displayValue = () => {
    if (item.isSeeding) {
      if (!product) return renderAmountText('Not assigned');

      return (
        <Typography variant="subtitle2" sx={{ fontSize: 13.5 }}>
          {`${toCurrencySymbol(getRowCurrency(item))} ${parseFloat(
            product?.value
          ).toFixed(2)}`}
        </Typography>
      );
    }

    if (isAmountValid) {
      return (
        <Typography variant="subtitle2" sx={{ fontSize: 13.5 }}>
          {`${toCurrencySymbol(getRowCurrency(item))} ${
            parseFloat(item?.amount?.toString()).toFixed(2) ||
            parseFloat(item?.user?.shortlisted[0]?.amount?.toString()).toFixed(2)
          }`}
        </Typography>
      );
    }

    return renderAmountText('Not set');
  };

  // One body cell per reorderable column. data-column lets the dragged column fade.
  const renderCell = (id) => {
    switch (id) {
      case 'creator':
        return (
          <TableCell key={id} data-column={id} sx={firstColumnSx(id)}>
            <Stack direction="row" alignItems="center" spacing={{ xs: 1 }}>
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                }}
              >
                <Avatar
                  src={item?.user?.photoURL}
                  alt={item?.user?.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: '2px solid',
                    borderColor: 'background.paper',
                    boxShadow: (theme) => theme.customShadows.z8,
                  }}
                >
                  {item?.user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Box>

              <Stack spacing={0.5} flex={1}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography
                    variant="body2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick(item);
                    }}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline', color: '#1340FF' },
                    }}
                  >
                    {item?.user?.name}
                  </Typography>
                  {item?.isSeeding && (
                    <Tooltip title="Seeding agreement" arrow>
                      <Iconify
                        icon={
                          isSelected
                            ? 'mdi:seed'
                            : 'mdi:seed-outline'
                        }
                        color="#1304FF"
                        width={16}
                        sx={{ flexShrink: 0 }}
                      />
                    </Tooltip>
                  )}
                </Stack>
                {!item?.user?.email?.endsWith('@tempmail.com') && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {item?.user?.email}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </TableCell>
        );

      case 'tier': {
        const tierData = getTierDataForItem(item);
        const tierPlatform = resolveTierPlatformForDisplay(item, campaign);

        return (
          <TableCell
            key={id}
            data-column={id}
            sx={{
              width: { xs: 90, sm: 'auto' },
              py: { xs: 0.5, sm: 1 },
              px: { xs: 1, sm: 2 },
              ...firstColumnSx(id),
            }}
          >
            {tierData ? (
              <Stack alignItems="start">
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Iconify
                    icon={
                      tierPlatform === 'tiktok'
                        ? 'ic:baseline-tiktok'
                        : 'mdi:instagram'
                    }
                    width={15}
                    sx={{
                      color: tierPlatform === 'tiktok' ? '#000000' : '#E4405F',
                      flexShrink: 0,
                    }}
                  />
                  <Typography fontSize={13.5} whiteSpace="nowrap">
                    {tierData.name}
                  </Typography>
                </Stack>
                <Typography
                  variant="body2"
                  fontSize={13.5}
                  sx={{
                    color: '#8e8e93',
                    display: 'block',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tierData.creditsPerVideo} credit
                  {tierData.creditsPerVideo !== 1 ? 's' : ''}
                </Typography>
              </Stack>
            ) : (
              <Typography fontSize={13.5}>-</Typography>
            )}
          </TableCell>
        );
      }

      case 'outreach':
        return (
          <TableCell key={id} data-column={id} sx={firstColumnSx(id)}>
            <AgreementOutreachCell
              agreement={item}
              disabled={isDisabled}
              onSaved={handleOutreachSaved}
            />
          </TableCell>
        );

      case 'status':
        return (
          <TableCell
            key={id}
            data-column={id}
            sx={{ px: STATUS_CELL_PX, ...firstColumnSx(id) }}
          >
            <StatusChip wrap color={agreementStatus.color}>
              {agreementStatus.text}
            </StatusChip>
          </TableCell>
        );

      case 'budget':
        return (
          <TableCell
            key={id}
            data-column={id}
            sx={{
              width: { xs: '20%', sm: 'auto' },
              whiteSpace: 'nowrap',
              ...firstColumnSx(id),
            }}
          >
            <AgreementBudgetCell
              agreement={item}
              currency={getRowCurrency(item)}
              disabled={isDisabled}
              locked={isBudgetLocked(item)}
              onSaved={mutateAgreements}
            />
          </TableCell>
        );

      case 'price':
        return (
          <TableCell
            key={id}
            data-column={id}
            sx={{
              width: { xs: '20%', sm: 'auto' },
              whiteSpace: 'nowrap',
              ...firstColumnSx(id),
            }}
          >
            {displayValue()}
          </TableCell>
        );

      case 'receipt': {
        // An existing invoice no longer locks it (a draft is regenerated, a sent
        // one gets a separate reimbursement invoice) — only billed receipts do.
        const lockReason = item.receiptsBilled
          ? 'Receipts for this agreement are already invoiced'
          : item.isSeeding
            ? 'Not available for seeding agreements'
            : isDisabled
              ? 'You do not have permission to change this'
              : '';

        return (
          <TableCell key={id} data-column={id} sx={firstColumnSx(id)}>
            {/* A flex box, not inline content, so the toggle isn't sat on a text
                baseline and centres exactly in both directions */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Tooltip title={lockReason} disableHoverListener={!lockReason}>
                <Box component="span" sx={{ display: 'flex' }}>
                  <ReceiptRequiredToggle
                    checked={Boolean(item.isReceiptRequired)}
                    disabled={Boolean(lockReason)}
                    loading={isReceiptSaving}
                    onChange={(next) => handleToggleReceiptRequired(item, next)}
                  />
                </Box>
              </Tooltip>
            </Box>
          </TableCell>
        );
      }

      default:
        return null;
    }
  };

  return (
    <TableRow
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: alpha('#CCC', 0.1),
          // The pinned cell is opaque, so it takes the same tint as a solid colour
          '& .cta-cell': { bgcolor: '#FAFAFA' },
        },
      }}
      component="div"
      onClick={() => {
        if (!item.isSent) {
          handleEditAgreement(item);
        } else {
          handleViewAgreement(item?.agreementUrl, item);
        }
      }}
    >
      <TableCell
        padding="checkbox"
        onClick={(e) => e.stopPropagation()}
        sx={CHECKBOX_CELL_SX}
      >
        <Tooltip title={checkboxTooltip}>
          <span>
            <Checkbox
              icon={uncheckedCheckboxIcon}
              checkedIcon={checkedCheckboxIcon}
              checked={isSelected}
              disabled={isDisabled || isCategoryLocked}
              onChange={() => {
                onToggleSelect(item.userId);
              }}
              sx={{ p: 0 }}
            />
          </span>
        </Tooltip>
      </TableCell>
      <TableCell sx={INDEX_CELL_SX}>
        <Typography sx={INDEX_SX}>{index + 1}</Typography>
      </TableCell>
      {visibleColumns.map(renderCell)}

      <TableCell
        className="cta-cell"
        sx={{ ...CTA_CELL_SX, boxShadow: ctaShadow, bgcolor: '#FFFFFF', pr: 0 }}
      >
        {smUp ? (
          <Stack direction="row" gap={1}>
            {item?.agreementUrl && (
              <Tooltip title="View agreement" arrow>
                <Button
                  onClick={() => handleViewAgreement(item?.agreementUrl, item)}
                  size="small"
                  variant="contained"
                  sx={ICON_ACTION_SX}
                >
                  <Iconify icon="basil:document-outline" width={20} />
                </Button>
              </Tooltip>
            )}

            {!item.isSent ? (
              // For pending (not sent) agreements, show Send Agreement button
              <Tooltip
                title={
                  guestNeedsLinkBeforeSend(item)
                    ? 'Link creator before sending agreement'
                    : ''
                }
                arrow
              >
                <span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAgreement(item);
                    }}
                    disabled={isDisabled || guestNeedsLinkBeforeSend(item)}
                    size="small"
                    variant="contained"
                    startIcon={
                      <Iconify
                        icon="bx:send"
                        sx={{
                          color: '#fff',
                        }}
                      />
                    }
                    sx={{
                      px: 2,
                      py: 2,
                      bgcolor: '#1340FF',
                      color: '#ffffff',
                      border: '1.5px solid #1340FF',
                      borderBottom: '3px solid',
                      borderBottomColor: '#00000073',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        bgcolor: '#0a2dd9',
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'rgba(19, 64, 255, 0.5)',
                        border: '1px solid rgba(19, 64, 255, 0.5)',
                        color: '#ffffff',
                        cursor: 'not-allowed',
                        pointerEvents: 'auto',
                      },
                    }}
                  >
                    Send Agreement
                  </Button>
                </span>
              </Tooltip>
            ) : (
              // For sent agreements, show Edit Amount and action buttons
              <>
                {isPendingReview ? (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRejectDialog(item);
                      }}
                      size="small"
                      variant="contained"
                      disabled={isDisabled || rejectLoading}
                      sx={{
                        px: 2,
                        py: 2,
                        bgcolor: '#ffffff',
                        color: '#D4321C',
                        border: '1.5px solid',
                        borderColor: '#e7e7e7',
                        borderBottom: '3px solid',
                        borderBottomColor: '#e7e7e7',
                        borderRadius: 1,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          border: '1.5px solid',
                          borderColor: '#D4321C',
                          borderBottom: '3px solid',
                          borderBottomColor: '#D4321C',
                        },
                        '&.Mui-disabled': {
                          border: '1.5px solid #e7e7e7',
                          borderBottom: '3px solid #e7e7e7',
                          cursor: 'not-allowed',
                          pointerEvents: 'auto',
                        },
                      }}
                    >
                      Reject
                    </Button>
                    <LoadingButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApproveAgreement(item);
                      }}
                      size="small"
                      variant="contained"
                      loading={approveLoading}
                      disabled={isDisabled}
                      sx={{
                        px: 2,
                        py: 2,
                        bgcolor: '#FFFFFF',
                        color: '#1ABF66',
                        border: '1.5px solid',
                        borderColor: '#E7E7E7',
                        borderBottom: '3px solid',
                        borderBottomColor: '#E7E7E7',
                        borderRadius: 1,
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          border: '1.5px solid',
                          borderColor: '#1ABF66',
                          borderBottom: '3px solid',
                          borderBottomColor: '#1ABF66',
                        },
                        '&.Mui-disabled': {
                          border: '1.5px solid #e7e7e7',
                          borderBottom: '3px solid #e7e7e7',
                          cursor: 'not-allowed',
                          pointerEvents: 'auto',
                        },
                      }}
                    >
                      Approve
                    </LoadingButton>
                  </>
                ) : (
                  <>
                    <Tooltip title="Edit amount" arrow>
                      <span style={{ display: 'flex' }}>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAgreement(item);
                          }}
                          disabled={isDisabled}
                          size="small"
                          variant="contained"
                          sx={ICON_ACTION_SX}
                        >
                          <Iconify icon="eva:edit-2-outline" width={20} />
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title="Resend agreement" arrow>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendAgreement(item);
                        }}
                        size="small"
                        variant="contained"
                        disabled={isDisabled || !isAmountValid}
                        sx={ICON_ACTION_SX}
                      >
                        <Iconify
                          icon="bx:send"
                          sx={{
                            color:
                              isDisabled || !isAmountValid
                                ? 'rgba(19, 64, 255, 0.5)'
                                : '#1340FF',
                          }}
                          width={20}
                        />
                      </Button>
                    </Tooltip>
                  </>
                )}
              </>
            )}
          </Stack>
        ) : (
          <Stack direction="row" gap={1}>
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleViewAgreement(item?.agreementUrl, item);
              }}
            >
              <Iconify icon="hugeicons:view" />
            </IconButton>
            <IconButton
              color="warning"
              onClick={(e) => {
                e.stopPropagation();
                handleEditAgreement(item);
              }}
              disabled={isDisabled}
              sx={{
                '&.Mui-disabled': { cursor: 'not-allowed', pointerEvents: 'auto' },
              }}
            >
              <Iconify icon="iconamoon:edit-light" />
            </IconButton>

            {isPendingReview ? (
              <>
                <IconButton
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenRejectDialog(item);
                  }}
                  disabled={isDisabled || rejectLoading}
                  sx={{
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                  }}
                >
                  <Iconify icon="solar:close-circle-bold" />
                </IconButton>
                <IconButton
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApproveAgreement(item);
                  }}
                  disabled={isDisabled}
                  sx={{
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                      pointerEvents: 'auto',
                    },
                  }}
                >
                  <Iconify icon="solar:check-circle-bold" />
                </IconButton>
              </>
            ) : (
              <IconButton
                color={item.isSent ? 'warning' : 'primary'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendAgreement(item);
                }}
                disabled={isDisabled || !isAmountValid}
                sx={{
                  '&.Mui-disabled': {
                    cursor: 'not-allowed',
                    pointerEvents: 'auto',
                  },
                }}
              >
                <Iconify icon="bx:send" />
              </IconButton>
            )}
          </Stack>
        )}
      </TableCell>
    </TableRow>
  );
}

AgreementRowContent.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number,
  visibleColumns: PropTypes.arrayOf(PropTypes.string),
  campaign: PropTypes.object,
  isDisabled: PropTypes.bool,
  smUp: PropTypes.bool,
  ctaShadow: PropTypes.string,
  isSelected: PropTypes.bool,
  selectionCategory: PropTypes.string,
  isEligibleForAdditional: PropTypes.bool,
  isReceiptSaving: PropTypes.bool,
  approveLoading: PropTypes.bool,
  rejectLoading: PropTypes.bool,
  actions: PropTypes.object.isRequired,
};

const AgreementRow = memo(AgreementRowContent);

// Convert AgreementDialog to a full component with approve/reject functionality
const AgreementDialog = ({
  open,
  onClose,
  url,
  agreement,
  campaign,
  onApprove,
  onReject,
  isDisabled: propIsDisabled = false,
}) => {
  const isPendingReview = agreement?.submission?.status === 'PENDING_REVIEW';
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const feedbackDialog = useBoolean();
  const { user } = useAuthContext();

  // Merge prop-based isDisabled with existing Finance role check
  const financeDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const isDisabled = propIsDisabled || financeDisabled;

  const methods = useForm({
    defaultValues: {
      feedback: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleApproveAgreement = async () => {
    try {
      setApproveLoading(true);
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'approve',
        userId: agreement?.userId,
        submissionId: agreement?.submission?.id,
        submission: agreement?.submission,
      });
      mutate(endpoints.campaign.creatorAgreement(agreement?.campaignId));
      // Also refresh V3 pitches data to update pitch status
      mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
      // Also refresh submissions data
      if (onApprove) {
        onApprove();
      }
      onClose();
      enqueueSnackbar(res?.data?.message || 'Agreement approved successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to approve agreement', { variant: 'error' });
    } finally {
      setApproveLoading(false);
    }
  };

  const onSubmitFeedback = handleSubmit(async (data) => {
    try {
      setRejectLoading(true);
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'reject',
        userId: agreement?.userId,
        submissionId: agreement?.submission?.id,
        feedback: data.feedback,
        submission: agreement?.submission,
      });

      mutate(endpoints.campaign.creatorAgreement(agreement?.campaignId));
      // Also refresh V3 pitches data to update pitch status
      mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
      // Also refresh submissions data
      if (onReject) {
        onReject();
      }
      feedbackDialog.onFalse();
      onClose();
      reset();
      enqueueSnackbar(res?.data?.message || 'Agreement rejected successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to reject agreement', { variant: 'error' });
    } finally {
      setRejectLoading(false);
    }
  });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#F4F4F4' } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ position: 'relative' }}>
            <Typography
              component="div"
              sx={{
                fontFamily: 'Instrument Serif',
                fontSize: '40px',
                fontWeight: 400,
                mb: -2,
                mt: -1,
              }}
            >
              Agreement
            </Typography>
            {agreement?.submission?.status === 'PENDING_REVIEW' && (
              <Typography
                variant="body2"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  color: '#FFC702',
                  borderColor: '#FFC702',
                  mt: 1.5,
                }}
              >
                PENDING APPROVAL
              </Typography>
            )}
            {agreement?.submission?.status === 'APPROVED' && (
              <Typography
                variant="body2"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  color: '#1ABF66',
                  borderColor: '#1ABF66',
                  mt: 1.5,
                }}
              >
                APPROVED
              </Typography>
            )}
            {agreement?.isSent && !agreement?.submission?.status && (
              <Typography
                variant="body2"
                sx={{
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderBottom: '3px solid',
                  borderRadius: 0.8,
                  bgcolor: 'white',
                  color: '#8A5AFE',
                  borderColor: '#8A5AFE',
                  mt: 1.5,
                }}
              >
                SENT TO CREATOR
              </Typography>
            )}
            {agreement?.updatedAt && (
              <Typography variant="body2" sx={{ color: '#8e8e93', mt: 1.5 }}>
                {`Issued ${fDate(agreement.updatedAt)}, ${dayjs(agreement.updatedAt).format('LT')}`}
              </Typography>
            )}

            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                color: '#637381',
                padding: 1.5,
                width: 48,
                height: 48,
                '&:hover': {
                  bgcolor: 'rgba(99, 115, 129, 0.08)',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={24} height={24} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <iframe
            src={agreement?.submission?.content || url}
            title="Agreement"
            style={{ width: '100%', height: '600px', border: 'none' }}
          />
        </DialogContent>
        {isPendingReview && (
          <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'flex-end', gap: -1 }}>
            <Button
              variant="contained"
              onClick={feedbackDialog.onTrue}
              disabled={isDisabled || rejectLoading}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#ffffff',
                color: '#D4321C',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  border: '1.5px solid',
                  borderColor: '#D4321C',
                  borderBottom: '3px solid',
                  borderBottomColor: '#D4321C',
                },
                '&.Mui-disabled': {
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
                },
              }}
            >
              Reject
            </Button>
            <LoadingButton
              variant="contained"
              onClick={handleApproveAgreement}
              loading={approveLoading}
              disabled={isDisabled}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#FFFFFF',
                color: '#1ABF66',
                border: '1.5px solid',
                borderColor: '#E7E7E7',
                borderBottom: '3px solid',
                borderBottomColor: '#E7E7E7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                  border: '1.5px solid',
                  borderColor: '#1ABF66',
                  borderBottom: '3px solid',
                  borderBottomColor: '#1ABF66',
                },
                '&.Mui-disabled': {
                  border: '1.5px solid #e7e7e7',
                  borderBottom: '3px solid #e7e7e7',
                  cursor: 'not-allowed',
                  pointerEvents: 'auto',
                },
              }}
            >
              Approve
            </LoadingButton>
          </DialogActions>
        )}
      </Dialog>

      <Dialog open={feedbackDialog.value} onClose={feedbackDialog.onFalse} maxWidth="xs" fullWidth>
        <FormProvider methods={methods} onSubmit={onSubmitFeedback}>
          <DialogTitle>Feedback</DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <RHFTextField
                name="feedback"
                label="Feedback"
                placeholder="Reason to reject"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                reset();
                feedbackDialog.onFalse();
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#ffffff',
                color: '#636366',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#e7e7e7',
                },
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting || rejectLoading}
              disabled={isDisabled}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#2e6c56',
                color: '#fff',
                border: 'none',
                borderBottom: '3px solid',
                borderBottomColor: '#202021',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#1e4a3a',
                },
                '&:disabled': {
                  display: 'none',
                },
              }}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>
    </>
  );
};

// Update the propTypes definition
AgreementDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  url: PropTypes.string,
  agreement: PropTypes.object,
  campaign: PropTypes.object,
  onApprove: PropTypes.func,
  onReject: PropTypes.func,
  isDisabled: PropTypes.bool,
};

const CampaignAgreements = ({ campaign, campaignMutate, isDisabled: propIsDisabled = false }) => {
  const { data, isLoading, mutate: mutateAgreements } = useGetAgreements(campaign?.id);

  const { socket } = useSocketContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [agreementFilterAnchorEl, setAgreementFilterAnchorEl] = useState(null);
  // Multi-select, like the master list's: outreach status values plus OUTREACH_NOT_SET.
  const [outreachFilter, setOutreachFilter] = useState([]);
  const [outreachFilterAnchorEl, setOutreachFilterAnchorEl] = useState(null);
  const [activeRound, setActiveRound] = useState(1);
  const [receiptToggleId, setReceiptToggleId] = useState(null);
  // { item, invoiceNumber, amount, agreementAmount, currency, wasEdited } from the 409 response
  const [regenerateWarning, setRegenerateWarning] = useState(null);

  // Reimbursement receipts are a v4-only flow
  const showReceiptColumn = campaign?.submissionVersion === 'v4';

  const table = useTable();
  const sendAdditionalDialog = useBoolean();
  const sendBulkDialog = useBoolean();

  const [searchQuery, setSearchQuery] = useState(
    () => new URLSearchParams(location.search).get('creator') || ''
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('creator')) {
      params.delete('creator');
      navigate({ search: params.toString() }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [sortColumn, setSortColumn] = useState('name'); // 'name', 'date', 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const dialog = useBoolean();
  const editDialog = useBoolean();
  const feedbackDialog = useBoolean();

  const [selectedUrl, setSelectedUrl] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const { user } = useAuthContext();
  const { mainRef } = useMainContext();

  const smUp = useResponsive('up', 'sm');

  // Tracks whether columns are hidden beneath the pinned actions column, to show its shadow.
  const [tableScrollEl, setTableScrollEl] = useState(null);
  const [isCtaOverlapping, setIsCtaOverlapping] = useState(false);

  const updateCtaOverlap = useCallback(() => {
    if (!tableScrollEl) return;
    const { scrollLeft, clientWidth, scrollWidth } = tableScrollEl;
    setIsCtaOverlapping(scrollLeft + clientWidth < scrollWidth - 1);
  }, [tableScrollEl]);

  useEffect(() => {
    if (!tableScrollEl) return undefined;
    updateCtaOverlap();
    // Re-check when the container resizes or the table's own width changes (rows, filters).
    const observer = new ResizeObserver(updateCtaOverlap);
    observer.observe(tableScrollEl);
    if (tableScrollEl.firstElementChild) observer.observe(tableScrollEl.firstElementChild);
    return () => observer.disconnect();
  }, [tableScrollEl, updateCtaOverlap]);

  const ctaShadow = isCtaOverlapping ? CTA_SHADOW : 'none';

  // Get tier data for an agreement item
  const getTierDataForItem = useCallback(
    (item) => {
      if (!campaign?.isCreditTier) return null;

      // Only ever show the tier agreed for THIS campaign. The creator's live tier tracks their
      // media kit and drifts as they grow, so falling back to it would misreport what we pay.
      const shortlisted = item?.user?.shortlisted?.[0] || item?.shortlistedCreator;
      if (shortlisted?.creditTier) {
        return {
          name: shortlisted.creditTier?.name || 'Unknown Tier',
          creditsPerVideo: shortlisted.creditPerVideo ?? shortlisted.creditTier?.creditsPerVideo ?? 1,
        };
      }

      const campaignShortlisted = campaign?.shortlisted?.find((s) => s.userId === item?.user?.id);

      if (campaignShortlisted?.creditTier) {
        return {
          name: campaignShortlisted.creditTier?.name || 'Unknown Tier',
          creditsPerVideo:
            campaignShortlisted.creditPerVideo ??
            campaignShortlisted.creditTier?.creditsPerVideo ??
            1,
        };
      }

      return null;
    },
    [campaign]
  );

  // Handle column sort click
  const handleColumnSort = (column) => {
    if (sortColumn === column) {
      // Same column - toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column - set to asc
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Toggle sort direction (for alphabetical button - legacy)
  const handleToggleSort = () => {
    setSortColumn('name');
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  // Using shared SortableHeader component from components/table

  const methods = useForm({
    defaultValues: {
      feedback: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Extract submissions fetch into reusable callback
  const fetchSubmissions = useCallback(async () => {
    if (!campaign?.id) return;
    try {
      const response = await axiosInstance.get(
        `${endpoints.submission.root}?campaignId=${campaign.id}`
      );
      setSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [campaign?.id]);

  // Initial fetch
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Real-time updates when creator submits agreement, or another admin sends a new round —
  // without this, a freshly-sent round 2 briefly shows round 1's cached submission status
  // (e.g. APPROVED) until a manual refresh, since it has no submission of its own yet.
  useEffect(() => {
    if (!socket) return undefined;

    const handleAgreementReady = () => {
      mutateAgreements(); // Refresh agreements data (SWR)
      fetchSubmissions(); // Refresh submissions data (status for approve/reject buttons)
    };

    const handleAgreementUpdated = (payload) => {
      if (payload?.campaignId !== campaign?.id) return;
      mutateAgreements();
      fetchSubmissions();
      campaignMutate?.();
    };

    socket.on('agreementReady', handleAgreementReady);
    socket.on('campaign:agreement:updated', handleAgreementUpdated);

    return () => {
      socket.off('agreementReady', handleAgreementReady);
      socket.off('campaign:agreement:updated', handleAgreementUpdated);
    };
  }, [socket, campaign?.id, mutateAgreements, fetchSubmissions, campaignMutate]);

  // Saved counters can be stale (older data, or changes made before every path recounted)
  useSyncCampaignCredits(campaign, campaignMutate);

  // Outreach status is shared with the master list (it lives on the pitch). Pick up changes other
  // admins make there; the event skips our own changes, which handleOutreachSaved covers.
  // Withdraw/remove also changes the agreement list and the credit counters.
  const handlePitchStatusUpdate = useCallback(() => {
    mutateAgreements();
    campaignMutate?.();
  }, [mutateAgreements, campaignMutate]);

  usePitchSocket({
    socket,
    campaignId: campaign?.id,
    onOutreachUpdate: mutateAgreements,
    onPitchStatusUpdate: handlePitchStatusUpdate,
    userId: user?.id,
  });

  const handleOutreachSaved = useCallback(() => {
    // Refresh the master list's pitches too, so the change is there when switching tabs.
    mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
    return mutateAgreements();
  }, [campaign?.id, mutateAgreements]);

  // Combine the agreements data with submission status
  const combinedData = useMemo(() => {
    if (!data || !submissions || loadingSubmissions) return data;

    return data.map((agreement) => {
      const round = agreement.round || 1;
      // AGREEMENT_FORM submissions are one per round (contentOrder = round) — match on both
      // so a creator's later round doesn't inherit an earlier round's status.
      const roundMatches = submissions.filter(
        (sub) => sub.userId === agreement.userId && sub.submissionType?.type === 'AGREEMENT_FORM'
      );

      const agreementSubmission =
        roundMatches.find((sub) => (sub.contentOrder || 1) === round) ||
        (roundMatches.length === 1 ? roundMatches[0] : undefined);

      return {
        ...agreement,
        submission: agreementSubmission,
      };
    });
  }, [data, submissions, loadingSubmissions]);

  const pitchApprovedAgreements = useMemo(() => {
    if (!combinedData) return [];

    // Collect approved user IDs from pitches
    const approvedPitchUserIds = new Set();

    if (Array.isArray(campaign?.pitch)) {
      campaign.pitch
        .filter(
          (pitchItem) =>
            pitchItem?.status === 'APPROVED' ||
            pitchItem?.status === 'AGREEMENT_SUBMITTED' ||
            pitchItem?.status === 'AGREEMENT_PENDING' ||
            pitchItem?.status === 'approved'
        )
        .forEach((pitchItem) => {
          if (pitchItem?.userId) {
            approvedPitchUserIds.add(pitchItem.userId);
          }
        });
    }

    // Also include shortlisted creators who may not have a pitch record
    // This handles backwards compatibility for creators shortlisted before the pitch system.
    // V4 caveat: a ShortListedCreator row can exist BEFORE client approval (e.g. after admin
    // uses Link Creator on a SENT_TO_CLIENT pitch). Only include shortlist entries that have
    // no matching pitch — otherwise the pitch's approval gate is the source of truth.
    const allPitchUserIds = new Set(
      (Array.isArray(campaign?.pitch) ? campaign.pitch : [])
        .map((pitchItem) => pitchItem?.userId)
        .filter(Boolean)
    );

    const shortlistedUserIds = new Set();

    if (Array.isArray(campaign?.shortlisted)) {
      campaign.shortlisted.forEach((shortlistedItem) => {
        if (shortlistedItem?.userId && !allPitchUserIds.has(shortlistedItem.userId)) {
          shortlistedUserIds.add(shortlistedItem.userId);
        }
      });
    }

    // Combine both sets - approved pitches and shortlisted creators
    const approvedCreatorSet = new Set([...approvedPitchUserIds, ...shortlistedUserIds]);

    if (!approvedCreatorSet.size) {
      return [];
    }

    return combinedData.filter(
      (agreement) =>
        approvedCreatorSet.has(agreement.userId) && !guestNeedsLinkBeforeSend(agreement)
    );
  }, [combinedData, campaign?.pitch, campaign?.shortlisted]);

  const pendingCount = useMemo(
    () => pitchApprovedAgreements?.filter((item) => !item.isSent).length || 0,
    [pitchApprovedAgreements]
  );

  // Rounds are independent per creator (not a campaign-wide batch) — a round tab only shows
  // up if at least one creator actually has a row for it.
  const roundsAvailable = useMemo(() => {
    const rounds = new Set();
    (pitchApprovedAgreements || []).forEach((item) => rounds.add(item.round || 1));
    return [...rounds].sort((a, b) => a - b);
  }, [pitchApprovedAgreements]);

  const roundCounts = useMemo(() => {
    const counts = {};
    (pitchApprovedAgreements || []).forEach((item) => {
      const round = item.round || 1;
      counts[round] = (counts[round] || 0) + 1;
    });
    return counts;
  }, [pitchApprovedAgreements]);

  useEffect(() => {
    if (roundsAvailable.length && !roundsAvailable.includes(activeRound)) {
      setActiveRound(roundsAvailable[0]);
    }
  }, [roundsAvailable, activeRound]);

  useEffect(() => {
    table.setSelected([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRound]);

  const roundScopedAgreements = useMemo(
    () => (pitchApprovedAgreements || []).filter((item) => (item.round || 1) === activeRound),
    [pitchApprovedAgreements, activeRound]
  );

  const filteredData = useMemo(() => {
    if (!roundScopedAgreements) return [];

    let result = [];

    if (selectedFilter === 'pendingAgreement') {
      // Not sent yet
      result = roundScopedAgreements.filter((item) => !item.isSent);
    } else if (selectedFilter === 'pendingApproval') {
      // Sent and waiting for creator to submit (PENDING_REVIEW)
      result = roundScopedAgreements.filter(
        (item) => item?.submission?.status === 'PENDING_REVIEW'
      );
    } else if (selectedFilter === 'sentToCreator') {
      // Sent to creator but not yet submitted
      result = roundScopedAgreements.filter(
        (item) =>
          item.isSent &&
          !['PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(item?.submission?.status)
      );
    } else if (selectedFilter === 'rejected') {
      // Rejected agreements
      result = roundScopedAgreements.filter((item) => item?.submission?.status === 'REJECTED');
    } else if (selectedFilter === 'approved') {
      // Approved agreements
      result = roundScopedAgreements.filter((item) => item?.submission?.status === 'APPROVED');
    } else {
      // All
      result = roundScopedAgreements;
    }

    if (outreachFilter.length > 0) {
      result = result.filter((item) =>
        outreachFilter.includes(item.outreachStatus || OUTREACH_NOT_SET)
      );
    }

    // Search functionality
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const creatorName = (item.user?.name || '').toLowerCase();
        const creatorEmail = (item.user?.email || '').toLowerCase();

        return creatorName.includes(query) || creatorEmail.includes(query);
      });
    }

    // Sort by selected column
    return [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'date': {
          // Sort by issue date (createdAt or updatedAt)
          const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        }
        case 'status': {
          // Get status priority for sorting
          const getStatusPriority = (item) => {
            if (item?.submission?.status === 'PENDING_REVIEW') return 1; // Pending Review first
            if (item?.submission?.status === 'REJECTED') return 2; // Rejected
            if (item?.submission?.status === 'APPROVED') return 3; // Approved
            if (item?.isSent) return 4; // Sent
            return 5; // Not sent
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          break;
        }
        case 'name':
        default: {
          const nameA = (a.user?.name || '').toLowerCase();
          const nameB = (b.user?.name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    selectedFilter,
    outreachFilter,
    sortColumn,
    sortDirection,
    roundScopedAgreements,
    searchQuery,
  ]);

  const statusLabels = useMemo(
    () => [...new Set(filteredData.map((item) => getAgreementStatus(item).text))],
    [filteredData]
  );
  const [statusColumnWidth, statusSizer] = useOneLineChipWidth(statusLabels);

  // Experimental column reordering: the admin's saved order, minus columns this campaign hides.
  const { columnOrder, moveColumn } = useColumnOrder();
  const visibleColumns = useMemo(
    () =>
      columnOrder.filter(
        (id) => (id !== 'tier' || campaign?.isCreditTier) && (id !== 'receipt' || showReceiptColumn)
      ),
    [columnOrder, campaign?.isCreditTier, showReceiptColumn]
  );

  // The gap after the fixed index column is its own right padding, so whichever column comes
  // first drops its left padding (Creator, by default).
  const firstColumnSx = (id) => (id === visibleColumns[0] ? { pl: 0 } : {});

  const renderColumnHeader = (id, dragProps) => {
    const headerSx = {
      py: 1,
      color: '#221f20',
      fontWeight: 600,
      bgcolor: '#f5f5f5',
      whiteSpace: 'nowrap',
    };

    switch (id) {
      case 'creator':
        return (
          <TableCell
            {...dragProps}
            sx={{
              ...headerSx,
              py: { xs: 0.5, sm: 1 },
              px: { xs: 1, sm: 2 },
              width: { xs: '25%', sm: 'auto' },
              minWidth: { xs: 120, sm: 'auto' },
              ...firstColumnSx(id),
            }}
          >
            Creator
          </TableCell>
        );

      case 'tier':
        return (
          <TableCell
            {...dragProps}
            sx={{
              ...headerSx,
              py: { xs: 0.5, sm: 1 },
              px: { xs: 1, sm: 2 },
              width: { xs: 90, sm: 'auto' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              ...firstColumnSx(id),
            }}
          >
            Tier
          </TableCell>
        );

      case 'outreach':
        return (
          <TableCell {...dragProps} sx={{ ...headerSx, ...firstColumnSx(id) }}>
            Outreach
          </TableCell>
        );

      case 'status':
        return (
          <SortableHeader
            {...dragProps}
            column="status"
            label="Status"
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleColumnSort}
            sx={{
              // Exactly the widest status on one line (content-box, so the cell padding matches
              // the body cells'); auto until it's been measured.
              width: {
                xs: '15%',
                sm: statusColumnWidth ? `${statusColumnWidth}px` : 'auto',
              },
              minWidth: { xs: 90, sm: 'auto' },
              boxSizing: 'content-box',
              px: STATUS_CELL_PX,
              ...firstColumnSx(id),
            }}
          />
        );

      case 'budget':
      case 'price':
        return (
          <TableCell
            {...dragProps}
            sx={{ ...headerSx, width: { xs: '20%', sm: 'auto' }, ...firstColumnSx(id) }}
          >
            {id === 'budget' ? 'Budget' : 'Price'}
          </TableCell>
        );

      case 'receipt':
        return (
          <TableCell {...dragProps} sx={{ ...headerSx, ...firstColumnSx(id) }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <span>Receipt</span>
              <Tooltip
                arrow
                title="When on, the creator uploads reimbursement receipts. The invoice is generated only after the video(s) and every receipt are approved, with each receipt as its own line."
              >
                <Iconify
                  icon="mdi:help-circle-outline"
                  width={16}
                  sx={{ color: '#8E8E93', cursor: 'help' }}
                />
              </Tooltip>
            </Stack>
          </TableCell>
        );

      default:
        return null;
    }
  };

  const campaignBudget = useMemo(() => getCampaignBudget(campaign), [campaign]);
  const campaignBudgetCurrency = campaign?.subscription?.currency ?? 'RM';

  const footerTotals = useMemo(() => {
    const totalCreators = filteredData.length;
    const amountsByCurrency = {};
    const budgetsByCurrency = {};
    const spendByCurrency = {};

    const creditsUsed = campaign?.creditsUtilized ?? 0;
    const creditsTotal = campaign?.campaignCredits ?? 0;
    const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);

    filteredData.forEach((item) => {
      const shortlisted = item?.user?.shortlisted?.[0] || item?.shortlistedCreator;
      const currency = getRowCurrency(item);

      const rawAmount =
        parseFloat(item?.amount?.toString()) || parseFloat(shortlisted?.amount?.toString()) || 0;
      if (rawAmount && !Number.isNaN(rawAmount)) {
        amountsByCurrency[currency] = (amountsByCurrency[currency] || 0) + rawAmount;
      }

      const budget = parseFloat(item?.budgetAmount?.toString());
      if (budget) {
        budgetsByCurrency[currency] = (budgetsByCurrency[currency] || 0) + budget;
      }

      const spend = rawAmount || budget;
      if (spend) {
        spendByCurrency[currency] = (spendByCurrency[currency] || 0) + spend;
      }
    });

    // Left = campaign budget − each creator's price (or budget, until they have a price). Only
    // amounts in the campaign budget's currency count.
    const budgetRemaining =
      campaignBudget != null
        ? campaignBudget - (spendByCurrency[campaignBudgetCurrency] || 0)
        : null;

    return {
      totalCreators,
      creditsUsed,
      creditsTotal,
      creditsRemaining,
      creditsRemainingColor: getRemainingColor(creditsRemaining, creditsTotal),
      amountsByCurrency,
      budgetsByCurrency,
      budgetRemaining,
      budgetRemainingColor: getRemainingColor(budgetRemaining, campaignBudget),
    };
  }, [
    filteredData,
    campaign?.creditsUtilized,
    campaign?.campaignCredits,
    campaignBudget,
    campaignBudgetCurrency,
  ]);

  const formattedAmounts = useMemo(
    () => formatAmountsByCurrency(footerTotals.amountsByCurrency),
    [footerTotals]
  );

  const formattedBudgets = useMemo(
    () =>
      Object.keys(footerTotals.budgetsByCurrency).length
        ? formatAmountsByCurrency(footerTotals.budgetsByCurrency)
        : formatMoney(0, campaignBudgetCurrency),
    [footerTotals, campaignBudgetCurrency]
  );

  // Row handlers are stable (useCallback) so memoised rows don't re-render on unrelated changes.
  const openViewDialog = dialog.onTrue;
  const openEditDialog = editDialog.onTrue;
  const openFeedbackDialog = feedbackDialog.onTrue;

  const handleViewAgreement = useCallback(
    (url, item) => {
      setSelectedUrl(url);
      setSelectedAgreement(item);
      openViewDialog();
    },
    [openViewDialog]
  );

  const handleEditAgreement = useCallback(
    (agreement) => {
      setSelectedAgreement(agreement);
      openEditDialog();
    },
    [openEditDialog]
  );

  const handleSendAgreement = useCallback(
    async (item) => {
      try {
        // Use different endpoints based on whether it's a resend or initial send
        const endpoint = item.isSent
          ? endpoints.campaign.resendAgreement
          : endpoints.campaign.sendAgreement;

        // For resend, use different payload format
        const payload = item.isSent ? { userId: item.userId, campaignId: item.campaignId } : item;

        const res = await axiosInstance.patch(endpoint, payload);
        mutate(endpoints.campaign.creatorAgreement(item?.campaignId));
        campaignMutate?.();
        enqueueSnackbar(res?.data?.message);
      } catch (error) {
        enqueueSnackbar(error?.message, { variant: 'error' });
      }
    },
    [campaignMutate]
  );

  // `confirmRegenerate` is sent only after the admin accepted the "draft will be regenerated" warning
  const handleToggleReceiptRequired = useCallback(
    async (item, required, confirmRegenerate = false) => {
      try {
        setReceiptToggleId(item.id);
        const res = await axiosInstance.patch(endpoints.reimbursement.setRequired(item.id), {
          required,
          ...(confirmRegenerate && { confirmRegenerate: true }),
        });
        setRegenerateWarning(null);
        // This table reads from React Query, so refresh it directly (SWR `mutate` won't).
        await mutateAgreements();
        enqueueSnackbar(res?.data?.message);
      } catch (error) {
        // The round's invoice is still a draft: warn before the backend deletes and regenerates it
        if (error?.code === 'DRAFT_INVOICE_EXISTS') {
          setRegenerateWarning({ item, ...error });
          return;
        }
        enqueueSnackbar(error?.message || 'Failed to update receipt requirement', {
          variant: 'error',
        });
      } finally {
        setReceiptToggleId(null);
      }
    },
    [mutateAgreements]
  );

  const handleApproveAgreement = useCallback(
    async (item) => {
      try {
        setApproveLoading(true);
        const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
          campaignId: campaign?.id,
          status: 'approve',
          userId: item?.userId,
          submissionId: item?.submission?.id,
          submission: item?.submission,
        });
        mutate(endpoints.campaign.creatorAgreement(item?.campaignId));
        // Also refresh V3 pitches data to update pitch status
        mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
        // Also refresh submissions data
        const response = await axiosInstance.get(
          `${endpoints.submission.root}?campaignId=${campaign?.id}`
        );
        setSubmissions(response.data);
        enqueueSnackbar(res?.data?.message || 'Agreement approved successfully');
      } catch (error) {
        enqueueSnackbar(error?.message || 'Failed to approve agreement', { variant: 'error' });
      } finally {
        setApproveLoading(false);
      }
    },
    [campaign?.id]
  );

  const handleOpenRejectDialog = useCallback(
    (agreement) => {
      setSelectedAgreement(agreement);
      openFeedbackDialog();
    },
    [openFeedbackDialog]
  );

  const handleProfileClick = useCallback(
    (creator) => {
      navigate(`/dashboard/creator/profile/${creator.userId}`);
    },
    [navigate]
  );

  // table.onSelectRow changes identity with every selection, which would re-render every row;
  // this toggle is built on the stable state setter instead.
  const { setSelected } = table;
  const toggleSelectRow = useCallback(
    (userId) =>
      setSelected((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      ),
    [setSelected]
  );

  const rowActions = useMemo(
    () => ({
      getTierDataForItem,
      handleViewAgreement,
      handleEditAgreement,
      handleSendAgreement,
      handleProfileClick,
      handleOutreachSaved,
      handleApproveAgreement,
      handleOpenRejectDialog,
      handleToggleReceiptRequired,
      mutateAgreements,
      onToggleSelect: toggleSelectRow,
    }),
    [
      getTierDataForItem,
      handleViewAgreement,
      handleEditAgreement,
      handleSendAgreement,
      handleProfileClick,
      handleOutreachSaved,
      handleApproveAgreement,
      handleOpenRejectDialog,
      handleToggleReceiptRequired,
      mutateAgreements,
      toggleSelectRow,
    ]
  );

  const onSubmitFeedback = handleSubmit(async (formData) => {
    try {
      setRejectLoading(true);
      const res = await axiosInstance.patch(endpoints.submission.admin.agreement, {
        campaignId: campaign?.id,
        status: 'reject',
        userId: selectedAgreement?.userId,
        submissionId: selectedAgreement?.submission?.id,
        feedback: formData.feedback,
        submission: selectedAgreement?.submission,
      });

      mutate(endpoints.campaign.creatorAgreement(selectedAgreement?.campaignId));
      // Also refresh V3 pitches data to update pitch status
      mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
      // Also refresh submissions data
      const response = await axiosInstance.get(
        `${endpoints.submission.root}?campaignId=${campaign.id}`
      );
      setSubmissions(response.data);
      feedbackDialog.onFalse();
      reset();
      enqueueSnackbar(res?.data?.message || 'Agreement rejected successfully');
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to reject agreement', { variant: 'error' });
    } finally {
      setRejectLoading(false);
    }
  });

  // Merge prop-based isDisabled with existing Finance role check
  const financeDisabled = useMemo(
    () => user?.admin?.role?.name === 'Finance' && user?.admin?.mode === 'advanced',
    [user]
  );
  const isDisabled = propIsDisabled || financeDisabled;

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    if (!roundScopedAgreements) {
      return {
        all: 0,
        pendingAgreement: 0,
        pendingApproval: 0,
        sentToCreator: 0,
        rejected: 0,
        approved: 0,
      };
    }

    return {
      all: roundScopedAgreements.length,
      pendingAgreement: roundScopedAgreements.filter((item) => !item.isSent).length,
      pendingApproval: roundScopedAgreements.filter(
        (item) => item?.submission?.status === 'PENDING_REVIEW'
      ).length,
      sentToCreator: roundScopedAgreements.filter(
        (item) =>
          item.isSent &&
          !['PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(item?.submission?.status)
      ).length,
      rejected: roundScopedAgreements.filter((item) => item?.submission?.status === 'REJECTED')
        .length,
      approved: roundScopedAgreements.filter((item) => item?.submission?.status === 'APPROVED')
        .length,
    };
  }, [roundScopedAgreements]);

  const agreementStatusOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      {
        value: 'pendingAgreement',
        label: `Pending Agreement (${filterCounts.pendingAgreement})`,
      },
      {
        value: 'pendingApproval',
        label: `Pending Approval (${filterCounts.pendingApproval})`,
      },
      {
        value: 'sentToCreator',
        label: `Sent To Creator (${filterCounts.sentToCreator})`,
      },
      { value: 'rejected', label: `Rejected (${filterCounts.rejected})` },
      { value: 'approved', label: `Approved (${filterCounts.approved})` },
    ],
    [filterCounts]
  );

  const isAgreementFilterActive = selectedFilter !== 'all';
  const agreementFilterLabel = isAgreementFilterActive
    ? agreementStatusOptions.find((option) => option.value === selectedFilter)?.label ||
      'Agreement Status'
    : 'Agreement Status';

  const handleAgreementFilterClick = (event) => {
    setAgreementFilterAnchorEl(event.currentTarget);
  };

  const handleAgreementFilterClose = () => {
    setAgreementFilterAnchorEl(null);
  };

  const handleAgreementFilterSelect = (value) => {
    setSelectedFilter(value);
    setAgreementFilterAnchorEl(null);
  };

  const handleAgreementFilterClear = () => {
    setSelectedFilter('all');
    setAgreementFilterAnchorEl(null);
  };

  const isOutreachFilterActive = outreachFilter.length > 0;
  let outreachFilterLabel = 'Outreach Status';
  if (outreachFilter.length > 1) {
    outreachFilterLabel = `Outreach Status (${outreachFilter.length})`;
  } else if (outreachFilter[0] === OUTREACH_NOT_SET) {
    outreachFilterLabel = 'Not Set';
  } else if (outreachFilter.length === 1) {
    outreachFilterLabel =
      OUTREACH_STATUS_OPTIONS.find((option) => option.value === outreachFilter[0])?.label ||
      outreachFilterLabel;
  }

  const handleOutreachFilterToggle = (value) => {
    setOutreachFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleOutreachFilterClear = () => {
    setOutreachFilter([]);
    setOutreachFilterAnchorEl(null);
  };

  // Eligible for an additional agreement: this round has already been sent to the creator.
  const eligibleForAdditionalIds = useMemo(
    () => new Set(filteredData.filter((item) => item.isSent).map((item) => item.userId)),
    [filteredData]
  );

  // Eligible for a bulk (first) agreement: this round hasn't been sent yet.
  const eligibleForBulkIds = useMemo(
    () => new Set(filteredData.filter((item) => !item.isSent).map((item) => item.userId)),
    [filteredData]
  );

  // The two send actions are mutually exclusive per selection — once a creator from one group
  // is checked, rows from the other group are disabled until the selection is cleared.
  const selectionCategory = useMemo(() => {
    if (table.selected.length === 0) return null;
    return eligibleForAdditionalIds.has(table.selected[0]) ? 'additional' : 'bulk';
  }, [table.selected, eligibleForAdditionalIds]);

  const selectedCreatorRows = useMemo(
    () =>
      filteredData.filter(
        (item) => table.selected.includes(item.userId) && eligibleForAdditionalIds.has(item.userId)
      ),
    [filteredData, table.selected, eligibleForAdditionalIds]
  );

  const selectedBulkCreatorRows = useMemo(
    () =>
      filteredData.filter(
        (item) => table.selected.includes(item.userId) && eligibleForBulkIds.has(item.userId)
      ),
    [filteredData, table.selected, eligibleForBulkIds]
  );

  if (isLoading || loadingSubmissions) {
    return <div>Loading...</div>; // A loading message while the data is being fetched
  }

  return (
    <Box>
      <Stack direction="column" spacing={2}>
        {roundsAvailable.length > 1 && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <ScrollTabs
              tabs={roundsAvailable.map((round) => ({
                value: round,
                label: getRoundLabel(round),
                count: roundCounts[round] || 0,
              }))}
              value={activeRound}
              onChange={setActiveRound}
            />
          </Stack>
        )}

        <Stack
          direction="column"
          spacing={{ xs: 1, sm: 1.5 }}
          justifyContent="flex-start"
          sx={{ mb: 1 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            sx={{ width: '100%' }}
            alignItems={{ sm: 'center' }}
            justifyContent="space-between"
            alignSelf="start"
            spacing={2}
            mb={0.5}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
            >
              <TextField
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  width: { xs: '100%', sm: 300 },
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#FFFFFF',
                    border: '1.5px solid #e7e7e7',
                    borderBottom: '3px solid #e7e7e7',
                    borderRadius: 1.15,
                    height: 44,
                    fontSize: '0.85rem',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused': {
                      border: '1.5px solid #e7e7e7',
                      borderBottom: '3px solid #e7e7e7',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    py: 1.25,
                    px: 0,
                    color: '#637381',
                    fontWeight: 600,
                    '&::placeholder': {
                      color: '#637381',
                      opacity: 1,
                      fontWeight: 400,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={18} sx={{ color: '#637381' }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Alphabetical Sort Button */}
              <Button
                onClick={handleToggleSort}
                endIcon={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {sortDirection === 'asc' ? (
                      <Stack direction="column" alignItems="center" spacing={0}>
                        <Typography
                          variant="caption"
                          sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                        >
                          A
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                        >
                          Z
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack direction="column" alignItems="center" spacing={0}>
                        <Typography
                          variant="caption"
                          sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 400 }}
                        >
                          Z
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ lineHeight: 1, fontSize: '10px', fontWeight: 700 }}
                        >
                          A
                        </Typography>
                      </Stack>
                    )}
                    <Iconify
                      icon={
                        sortDirection === 'asc'
                          ? 'eva:arrow-downward-fill'
                          : 'eva:arrow-upward-fill'
                      }
                      width={12}
                    />
                  </Stack>
                }
                sx={{
                  px: 1.5,
                  py: 0.75,
                  height: '42px',
                  color: '#637381',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 1,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: 'none',
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#221f20',
                  },
                }}
              >
                Alphabetical
              </Button>
              <Button
                variant="text"
                disableElevation
                onClick={(e) => setOutreachFilterAnchorEl(e.currentTarget)}
                endIcon={
                  <FilterPillEndIcons
                    isActive={isOutreachFilterActive}
                    isOpen={Boolean(outreachFilterAnchorEl)}
                    onClear={handleOutreachFilterClear}
                    clearLabel="Clear outreach status filters"
                  />
                }
                sx={getFilterPillSx(isOutreachFilterActive)}
              >
                {outreachFilterLabel}
              </Button>
              <Button
                variant="text"
                disableElevation
                onClick={handleAgreementFilterClick}
                endIcon={
                  <FilterPillEndIcons
                    isActive={isAgreementFilterActive}
                    isOpen={Boolean(agreementFilterAnchorEl)}
                    onClear={handleAgreementFilterClear}
                    clearLabel="Clear agreement status filters"
                  />
                }
                sx={getFilterPillSx(isAgreementFilterActive)}
              >
                {agreementFilterLabel}
              </Button>
              <Menu
                anchorEl={agreementFilterAnchorEl}
                open={Boolean(agreementFilterAnchorEl)}
                onClose={handleAgreementFilterClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 0.5,
                      minWidth: 200,
                      p: 0.5,
                      bgcolor: 'white',
                      boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
                      borderRadius: 1.5,
                    },
                  },
                }}
              >
                {agreementStatusOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    selected={selectedFilter === option.value}
                    onClick={() => handleAgreementFilterSelect(option.value)}
                    sx={{
                      fontFamily: 'Inter Display, Inter, sans-serif',
                      fontSize: 14,
                      fontWeight: selectedFilter === option.value ? 600 : 500,
                      color: '#231F20',
                      borderRadius: 1,
                      py: 0.75,
                    }}
                  >
                    {option.label}
                    {selectedFilter === option.value && (
                      <Iconify
                        icon="eva:checkmark-fill"
                        width={16}
                        sx={{ ml: 'auto', flexShrink: 0 }}
                      />
                    )}
                  </MenuItem>
                ))}
              </Menu>
              <OutreachFilterMenu
                anchorEl={outreachFilterAnchorEl}
                onClose={() => setOutreachFilterAnchorEl(null)}
                selected={outreachFilter}
                onToggle={handleOutreachFilterToggle}
                onClear={handleOutreachFilterClear}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
              {table.selected.length > 0 && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#221f20', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {table.selected.length} Creator{table.selected.length !== 1 ? 's' : ''} Selected
                  </Typography>
                  <Typography
                    component="button"
                    type="button"
                    onClick={() => table.setSelected([])}
                    sx={{
                      border: 'none',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      p: 0,
                      color: '#1340FF',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    Clear
                  </Typography>
                </Stack>
              )}
              <Tooltip
                title={
                  !isDisabled && selectedBulkCreatorRows.length === 0
                    ? 'Tick one or more pending creators to send a bulk agreement'
                    : ''
                }
              >
                <span>
                  <Button
                    variant="contained"
                    disabled={isDisabled || selectedBulkCreatorRows.length === 0}
                    onClick={sendBulkDialog.onTrue}
                    sx={{
                      minWidth: '38px',
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      pt: '8px',
                      pr: '12px',
                      pb: '11px',
                      pl: '12px',
                      gap: '4px',
                      bgcolor: '#FFFFFF',
                      color: '#1340FF',
                      border: '1px solid #E7E7E7',
                      boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      justifyContent: 'flex-start',
                      transition:
                        'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
                      '&:hover:not(.Mui-disabled)': {
                        bgcolor: '#F5F7FF',
                        boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
                        width: '175px',
                        '& .send-bulk-label': { opacity: 1, maxWidth: '160px' },
                      },
                      '&.Mui-disabled': {
                        opacity: 1,
                        color: '#B0B0B1',
                        border: '1px solid #EDEDED',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src="/assets/icons/overview/group2People.svg"
                      alt=""
                      sx={{ width: 16, height: 16, flexShrink: 0 }}
                    />
                    <Box
                      component="span"
                      className="send-bulk-label"
                      sx={{
                        display: 'inline-block',
                        opacity: 0,
                        maxWidth: 0,
                        overflow: 'hidden',
                        transition:
                          'opacity 0.25s ease 0.05s, max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      Send Bulk Agreement
                    </Box>
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  !isDisabled && selectedCreatorRows.length === 0
                    ? 'Tick one or more creators who already have an agreement to send an additional round'
                    : ''
                }
              >
                <span>
                  <Button
                    variant="contained"
                    disabled={isDisabled || selectedCreatorRows.length === 0}
                    onClick={sendAdditionalDialog.onTrue}
                    sx={{
                      minWidth: '38px',
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      px: '11px',
                      gap: '8px',
                      bgcolor: '#221f20',
                      color: '#fff',
                      border: '1.5px solid #221f20',
                      borderBottom: '3px solid #000',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      justifyContent: 'flex-start',
                      transition:
                        'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
                      '&:hover:not(.Mui-disabled)': {
                        bgcolor: '#000',
                        width: '210px',
                        '& .send-additional-label': { opacity: 1, maxWidth: '200px' },
                      },
                      '&.Mui-disabled': {
                        opacity: 1,
                        border: 'none',
                        color: '#fff',
                        background:
                          'linear-gradient(0deg, #B0B0B1, #B0B0B1), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                        boxShadow: '0px -3px 0px 0px #0000001A inset',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src="/assets/additional-ag.svg"
                      alt=""
                      sx={{ width: 14, height: 18, flexShrink: 0 }}
                    />
                    <Box
                      component="span"
                      className="send-additional-label"
                      sx={{
                        display: 'inline-block',
                        opacity: 0,
                        maxWidth: 0,
                        overflow: 'hidden',
                        transition:
                          'opacity 0.25s ease 0.05s, max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      Send Additional Agreement
                    </Box>
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>

        {!filteredData || filteredData.length < 1 ? (
          <EmptyContent title="No agreements found" />
        ) : (
          <TableContainer
            ref={setTableScrollEl}
            onScroll={updateCtaOverlap}
            sx={{
              width: '100%',
              position: 'relative',
              bgcolor: 'transparent',
              overflow: 'auto',
            }}
          >
            <ColumnReorderProvider
              columns={visibleColumns}
              onMove={moveColumn}
            >
              <Table size="small" {...{ [REORDER_TABLE_ATTR]: '' }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      padding="checkbox"
                      sx={{ ...CHECKBOX_CELL_SX, borderRadius: '10px 0 0 10px', bgcolor: '#f5f5f5' }}
                    >
                      <Checkbox
                        icon={uncheckedCheckboxIcon}
                        checkedIcon={checkedCheckboxIcon}
                        indeterminateIcon={checkedCheckboxIcon}
                        indeterminate={
                          table.selected.length > 0 &&
                          table.selected.length < eligibleForAdditionalIds.size
                        }
                        checked={
                          eligibleForAdditionalIds.size > 0 &&
                          table.selected.length === eligibleForAdditionalIds.size
                        }
                        disabled={
                          isDisabled ||
                          selectionCategory === 'bulk' ||
                          eligibleForAdditionalIds.size === 0
                        }
                        onChange={(e) => {
                          table.onSelectAllRows(e.target.checked, [...eligibleForAdditionalIds]);
                        }}
                        sx={{ p: 0 }}
                      />
                    </TableCell>
                    <TableCell sx={{ ...INDEX_CELL_SX, bgcolor: '#f5f5f5' }} />
                    {visibleColumns.map((id) => (
                      <DraggableColumnHeader key={id} id={id}>
                        {(dragProps) => renderColumnHeader(id, dragProps)}
                      </DraggableColumnHeader>
                    ))}
                    <TableCell
                      sx={{
                        ...CTA_CELL_SX,
                        zIndex: 2,
                        boxShadow: ctaShadow,
                        py: 1,
                        pr: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: { xs: '15%', sm: 'auto' },
                        minWidth: { xs: 70, sm: 'auto' },
                        borderRadius: '0 10px 10px 0',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Agreement PDF
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <AgreementRow
                      key={item.id}
                      item={item}
                      index={index}
                      visibleColumns={visibleColumns}
                      campaign={campaign}
                      isDisabled={isDisabled}
                      smUp={smUp}
                      ctaShadow={ctaShadow}
                      isSelected={table.selected.includes(item.userId)}
                      selectionCategory={selectionCategory}
                      isEligibleForAdditional={eligibleForAdditionalIds.has(item.userId)}
                      isReceiptSaving={receiptToggleId === item.id}
                      approveLoading={approveLoading}
                      rejectLoading={rejectLoading}
                      actions={rowActions}
                    />
                  ))}
                </TableBody>
              </Table>
            </ColumnReorderProvider>
          </TableContainer>
        )}
        {statusSizer}
      </Stack>

      <AgreementDialog
        open={dialog.value}
        onClose={dialog.onFalse}
        url={selectedUrl}
        agreement={selectedAgreement}
        campaign={campaign}
        isDisabled={isDisabled}
        onApprove={async () => {
          // Refresh V3 pitches data to update pitch status
          mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
          // Refresh submissions data
          const response = await axiosInstance.get(
            `${endpoints.submission.root}?campaignId=${campaign.id}`
          );
          setSubmissions(response.data);
        }}
        onReject={async () => {
          // Refresh V3 pitches data to update pitch status
          mutate(`/api/pitch/v3?campaignId=${campaign?.id}`);
          // Refresh submissions data
          const response = await axiosInstance.get(
            `${endpoints.submission.root}?campaignId=${campaign.id}`
          );
          setSubmissions(response.data);
        }}
      />

      <Dialog open={feedbackDialog.value} onClose={feedbackDialog.onFalse} maxWidth="xs" fullWidth>
        <FormProvider methods={methods} onSubmit={onSubmitFeedback}>
          <DialogTitle>Feedback</DialogTitle>
          <DialogContent>
            <Box pt={2}>
              <RHFTextField
                name="feedback"
                label="Feedback"
                placeholder="Reason to reject"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                reset();
                feedbackDialog.onFalse();
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#ffffff',
                color: '#636366',
                border: '1.5px solid',
                borderColor: '#e7e7e7',
                borderBottom: '3px solid',
                borderBottomColor: '#e7e7e7',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#e7e7e7',
                },
              }}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={isSubmitting || rejectLoading}
              disabled={isDisabled}
              sx={{
                textTransform: 'none',
                minHeight: 42,
                minWidth: 100,
                bgcolor: '#2e6c56',
                color: '#fff',
                border: 'none',
                borderBottom: '3px solid',
                borderBottomColor: '#202021',
                borderRadius: 1.15,
                fontWeight: 600,
                fontSize: '16px',
                '&:hover': {
                  bgcolor: '#1e4a3a',
                },
                '&:disabled': {
                  display: 'none',
                },
              }}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </FormProvider>
      </Dialog>

      <CampaignAgreementEdit
        dialog={editDialog}
        agreement={selectedAgreement}
        campaign={campaign}
        campaignMutate={campaignMutate}
        agreementsMutate={mutateAgreements}
      />

      {/* Turning receipts on while the round's invoice is still a draft deletes that draft */}
      <RegenerateInvoiceDialog
        warning={regenerateWarning}
        creatorName={regenerateWarning?.item?.user?.name}
        loading={Boolean(regenerateWarning) && receiptToggleId === regenerateWarning?.item?.id}
        onClose={() => setRegenerateWarning(null)}
        onConfirm={() => handleToggleReceiptRequired(regenerateWarning.item, true, true)}
      />

      <SendAdditionalAgreementModal
        open={sendAdditionalDialog.value}
        onClose={sendAdditionalDialog.onFalse}
        campaign={campaign}
        creators={selectedCreatorRows}
        campaignMutate={async () => {
          await mutateAgreements();
          // campaignMutate();
        }}

        onSent={async () => {
          table.setSelected([]);
          await Promise.all([mutateAgreements(), fetchSubmissions()]);
          if (campaignMutate) await campaignMutate();
        }}
      />

      <SendBulkAgreementModal
        open={sendBulkDialog.value}
        onClose={sendBulkDialog.onFalse}
        campaign={campaign}
        creators={selectedBulkCreatorRows}
        campaignMutate={campaignMutate}
        table={table}

        onSent={async (succeededUserIds) => {
          table.setSelected((prev) => prev.filter((id) => !succeededUserIds.includes(id)));
          await Promise.all([mutateAgreements(), fetchSubmissions()]);
          if (campaignMutate) await campaignMutate();
        }}
      />

      {/* Summary bar: portalled to layout wrapper, absolute-positioned at bottom */}
      {mainRef?.current?.parentElement &&
        createPortal(
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid',
              borderColor: 'divider',
              py: { xs: 0.75, sm: 1.25 },
              px: { xs: 1.5, sm: 3 },
              boxShadow: '0 -1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={{ xs: 1.5, sm: 3 }}
              divider={<Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />}
              sx={{
                maxWidth: 1200,
                mx: 'auto',
                flexWrap: 'wrap',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Iconify icon="mdi:star-four-points-outline" width={18} sx={{ color: '#8e8e93' }} />
                <Typography variant="body2" sx={{ color: '#8e8e93', fontWeight: 500 }}>
                  Credits:
                </Typography>
                <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 700 }}>
                  {`${footerTotals.creditsUsed}/${footerTotals.creditsTotal}`}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: footerTotals.creditsRemainingColor, fontWeight: 500 }}
                >
                  ({footerTotals.creditsRemaining} left)
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Iconify
                  icon="mdi:calculator-variant-outline"
                  width={18}
                  sx={{ color: '#8e8e93' }}
                />
                <Typography variant="body2" sx={{ color: '#8e8e93', fontWeight: 500 }}>
                  Budget:
                </Typography>
                <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 700 }}>
                  {campaignBudget != null
                    ? `${formattedBudgets}/${formatMoney(campaignBudget, campaignBudgetCurrency)}`
                    : formattedBudgets}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Iconify icon="mdi:wallet-outline" width={18} sx={{ color: '#8e8e93' }} />
                <Typography variant="body2" sx={{ color: '#8e8e93', fontWeight: 500 }}>
                  Total:
                </Typography>
                <Typography variant="body2" sx={{ color: '#221f20', fontWeight: 700 }}>
                  {formattedAmounts}
                </Typography>
                {footerTotals.budgetRemaining != null && (
                  <Typography
                    variant="body2"
                    sx={{ color: footerTotals.budgetRemainingColor, fontWeight: 500 }}
                  >
                    {`(${formatMoney(
                      Math.abs(footerTotals.budgetRemaining),
                      campaignBudgetCurrency
                    )} ${footerTotals.budgetRemaining >= 0 ? 'left' : 'over'})`}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Box>,
          mainRef.current.parentElement
        )}
    </Box>
  );
};

CampaignAgreements.propTypes = {
  campaign: PropTypes.any,
  campaignMutate: PropTypes.func,
  isDisabled: PropTypes.bool,
};

export default CampaignAgreements;
