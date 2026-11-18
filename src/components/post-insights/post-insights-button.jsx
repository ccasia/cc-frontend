import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';

import { postPlatform, toDisplayFields } from './utils';
import PostInsightsDialog from './post-insights-dialog';

const BLUE = '#1340FF';

function IconTrigger({ hasInsights, onClick }) {
  const title = hasInsights ? 'View insight screenshots' : 'Add insight screenshots (optional)';

  return (
    <Tooltip title={title} placement="left">
      <span>
        <IconButton
          type="button"
          aria-label={title}
          onClick={onClick}
          disableRipple
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            border: '1px solid',
            borderBottomWidth: 3,
            borderColor: hasInsights ? '#C7D2FE' : '#E7E7E7',
            bgcolor: hasInsights ? '#EEF2FF' : '#FFFFFF',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: hasInsights ? BLUE : '#B4B8C2',
              bgcolor: hasInsights ? '#EEF2FF' : '#F5F5F5',
            },
          }}
        >
          <Iconify
            icon={hasInsights ? 'solar:chart-square-bold' : 'solar:chart-square-linear'}
            width={18}
            color={hasInsights ? BLUE : '#221f20'}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}

IconTrigger.propTypes = { hasInsights: PropTypes.bool, onClick: PropTypes.func };

function RowTrigger({ insights, postUrl, onClick }) {
  const platform = postPlatform(postUrl);
  const views = toDisplayFields(insights).find((f) => f.key === 'views');
  const count = insights?.screenshots?.length ?? 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ p: 1.5, borderRadius: 1, border: '1px dashed #D1D1D1', bgcolor: '#FFFFFF' }}
    >
      <Iconify
        icon={insights ? 'solar:chart-square-bold' : 'solar:chart-square-linear'}
        width={22}
        sx={{ color: insights ? BLUE : '#8E8E93', flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#231F20' }}>
          {platform && (
            <Iconify icon={platform.icon} width={14} sx={{ mr: 0.5, verticalAlign: '-2px' }} />
          )}
          {platform ? `${platform.name} insights` : 'Insight screenshots'}{' '}
          {!insights && (
            <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: '#8E8E93' }}>
              · Optional
            </Typography>
          )}
        </Typography>
        <Typography noWrap sx={{ fontSize: 12, color: '#636366' }}>
          {insights
            ? `${count} screenshot${count === 1 ? '' : 's'}${views ? ` · ${views.value} views` : ''}`
            : 'Share your post insights with the team.'}
        </Typography>
      </Box>
      <Button
        size="small"
        variant="outlined"
        onClick={onClick}
        sx={{ flexShrink: 0, textTransform: 'none' }}
      >
        {insights ? 'View' : 'Add'}
      </Button>
    </Stack>
  );
}

RowTrigger.propTypes = {
  insights: PropTypes.object,
  postUrl: PropTypes.string,
  onClick: PropTypes.func,
};

export default function PostInsightsButton({
  campaignId,
  submissionId,
  postUrl,
  insights,
  canEdit = false,
  canManage = false,
  variant = 'icon',
}) {
  const dialog = useBoolean();

  if (!campaignId || !submissionId || !postUrl || (!insights && !canEdit)) return null;

  return (
    <>
      {variant === 'icon' ? (
        <IconTrigger hasInsights={!!insights} onClick={dialog.onTrue} />
      ) : (
        <RowTrigger insights={insights} postUrl={postUrl} onClick={dialog.onTrue} />
      )}

      <PostInsightsDialog
        open={dialog.value}
        onClose={dialog.onFalse}
        campaignId={campaignId}
        submissionId={submissionId}
        postUrl={postUrl}
        insights={insights}
        canEdit={canEdit}
        canManage={canManage}
      />
    </>
  );
}

PostInsightsButton.propTypes = {
  campaignId: PropTypes.string,
  submissionId: PropTypes.string,
  postUrl: PropTypes.string,
  insights: PropTypes.object,
  canEdit: PropTypes.bool,
  canManage: PropTypes.bool,
  variant: PropTypes.oneOf(['icon', 'row']),
};
