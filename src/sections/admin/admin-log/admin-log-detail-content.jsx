import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

import { renderActionParts } from 'src/sections/campaign/manage/list/campaign-log/campaign-log-render-utils';
import {
  formatLogTime,
  getCategoryMeta,
  getPerformerBadge,
} from 'src/sections/campaign/manage/list/campaign-log/campaign-log-utils';

// ---------------------------------------------------------------------------
// Small presentational helpers — mirror the campaign-log detail card styling
// ---------------------------------------------------------------------------

function DetailCard({ icon, iconColor, headerBg, label, children }) {
  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: 1.5,
        border: '1px solid #F0F0F0',
        overflow: 'hidden',
        mb: 1,
      }}
    >
      <Box
        sx={{
          bgcolor: headerBg || '#F4F4F5',
          px: 1.5,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.625,
        }}
      >
        <Iconify icon={icon} width={13} sx={{ color: iconColor || '#8e8e93' }} />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            color: iconColor || '#8e8e93',
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box sx={{ px: 1.5, py: 1.25 }}>{children}</Box>
    </Box>
  );
}

DetailCard.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string,
  headerBg: PropTypes.string,
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

function DetailRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75 }}>
      {icon && <Iconify icon={icon} width={14} sx={{ color: '#8e8e93', mt: '2px', flexShrink: 0 }} />}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, mb: '1px' }}>{label}</Typography>
        <Typography sx={{ fontSize: 12, color: '#221F20', wordBreak: 'break-word', lineHeight: 1.5 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

DetailRow.propTypes = { label: PropTypes.string, value: PropTypes.node, icon: PropTypes.string };

// Parse impersonation target from either start ("...impersonating creator ...")
// or end ("...impersonation of creator ...") messages.
function parseImpersonation(message) {
  const m = (message || '').match(/impersonat(?:ing|ion of) (creator|client) "([^"]+)" \(([^)]+)\)/i);
  if (!m) return null;
  return { role: m[1], name: m[2], email: m[3] };
}

// ---------------------------------------------------------------------------

export default function AdminLogDetailContent({ log, photoMap }) {
  const meta = getCategoryMeta(log.category);
  const badge = getPerformerBadge(log.performerRole);
  const impersonation = log.category.startsWith('Impersonation') ? parseImpersonation(log.action) : null;

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* ── Event card ── */}
      <Box sx={{ mx: 2, mt: 2, mb: 1 }}>
        <DetailCard icon="solar:clipboard-text-bold" iconColor="#1340FF" headerBg="#EBF0FF" label="Log">
          {/* Action text — hero section */}
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '5px',
                fontSize: 15,
                fontWeight: 500,
                color: '#221F20',
                lineHeight: 1.8,
                mb: 0.5,
              }}
            >
              {renderActionParts(log.formattedSummary, photoMap, 28)}
            </Box>

            <Typography sx={{ fontSize: 12, color: '#8e8e93' }}>
              {formatLogTime(log.createdAt, { detailed: true })}
            </Typography>
          </Box>

          {/* Divider */}
          <Box sx={{ borderTop: '1px solid #F0F0F0', mx: -1.5 }} />

          {/* Performed By row */}
          <Box sx={{ py: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#8e8e93', flexShrink: 0 }}>
              Performed By
            </Typography>
            <Avatar
              src={photoMap?.get(log.performedBy)}
              alt={log.performedBy}
              sx={{ width: 20, height: 20, fontSize: 9, fontWeight: 700, ml: 0.25 }}
            >
              {log.performedBy?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#221F20' }} noWrap>
              {log.performedBy}
            </Typography>
            {badge && (
              <Box
                component="span"
                sx={{
                  px: 0.5,
                  py: '1px',
                  borderRadius: 0.5,
                  bgcolor: badge.bg,
                  color: badge.color,
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  flexShrink: 0,
                }}
              >
                {badge.label}
              </Box>
            )}
          </Box>

          {/* Divider */}
          <Box sx={{ borderTop: '1px solid #F0F0F0', mx: -1.5 }} />

          {/* Action row */}
          <Box sx={{ pt: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#8e8e93', flexShrink: 0 }}>
              Action
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                px: 0.625,
                py: '2px',
                borderRadius: 0.5,
                bgcolor: meta.bg,
                ml: 0.25,
              }}
            >
              <Iconify icon={meta.icon} width={13} sx={{ color: meta.color }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: meta.color }}>
                {log.category}
              </Typography>
            </Box>
          </Box>
        </DetailCard>
      </Box>

      {/* ── Impersonation details ── */}
      {impersonation && (
        <Box sx={{ mx: 2, mb: 2 }}>
          <DetailCard icon={meta.icon} iconColor={meta.color} headerBg={meta.bg} label="Impersonation">
            <DetailRow
              label="Account Type"
              icon="solar:user-id-bold"
              value={impersonation.role.charAt(0).toUpperCase() + impersonation.role.slice(1)}
            />
            <DetailRow label="Name" icon="solar:user-bold" value={impersonation.name} />
            <DetailRow label="Email" icon="solar:letter-bold" value={impersonation.email} />
          </DetailCard>
        </Box>
      )}
    </Box>
  );
}

AdminLogDetailContent.propTypes = {
  log: PropTypes.object.isRequired,
  photoMap: PropTypes.instanceOf(Map),
};
