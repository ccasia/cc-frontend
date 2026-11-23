import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import ScopeSwitch from './scope-switch';
import PanelSummary from './panel-summary';
import { FieldRow, FieldTile } from './field-row';
import { useInsightOcrStore } from '../store/use-insight-ocr-store';
import { BORDER, groupFields, combineFields } from '../constants';

function EmptyText({ children }) {
  return (
    <Typography variant="body2" sx={{ p: 2, color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}

EmptyText.propTypes = { children: PropTypes.node };

function LoadingFields() {
  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={72} />
        ))}
      </Box>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={36} />
      ))}
    </Stack>
  );
}

function FieldGroups({ fields }) {
  const selectedId = useInsightOcrStore((s) => s.selectedId);
  const hovered = useInsightOcrStore((s) => s.hovered);
  const selected = useInsightOcrStore((s) => s.selected);
  const { setHovered, toggleSelected } = useInsightOcrStore.getState();

  const activeKey = hovered ?? selected;

  const bind = (field) => ({
    field,
    active: field.key === activeKey,
    onHover: (on) => setHovered(on ? field.key : null),
    onClick: () => {
      const onCurrent = field.sources.some((source) => source.itemId === selectedId);
      toggleSelected(field.key, onCurrent ? undefined : field.sources[0].itemId);
    },
  });

  return (
    <Stack spacing={2.5}>
      {groupFields(fields).map((group) => (
        <Box key={group.label}>
          <Typography
            variant="overline"
            sx={{ display: 'block', px: 1.5, mb: 0.75, color: 'text.secondary', letterSpacing: 0.8 }}
          >
            {group.label}
          </Typography>

          {group.variant === 'tile' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, px: 0.5 }}>
              {group.fields.map((field) => (
                <FieldTile key={field.key} {...bind(field)} />
              ))}
            </Box>
          ) : (
            group.fields.map((field) => <FieldRow key={field.key} {...bind(field)} variant={group.variant} />)
          )}
        </Box>
      ))}
    </Stack>
  );
}

FieldGroups.propTypes = {
  fields: PropTypes.array.isRequired,
};

export default function FieldPanel({ resultsById }) {
  const [scope, setScope] = useState('screenshot');

  const items = useInsightOcrStore((s) => s.items);
  const selectedId = useInsightOcrStore((s) => s.selectedId);

  const current = resultsById[selectedId];
  const currentItem = items.find((item) => item.id === selectedId);
  const currentFields = currentItem ? combineFields([currentItem], resultsById) : [];
  const allFields = combineFields(items, resultsById);

  const multiple = items.length > 1;
  const tab = multiple ? scope : 'screenshot';
  const fields = tab === 'screenshot' ? currentFields : allFields;

  const renderBody = () => {
    if (tab === 'screenshot' && current?.isPending) return <LoadingFields />;
    if (tab === 'screenshot' && current?.isError) return <EmptyText>No data for this screenshot. Retry it on the left.</EmptyText>;
    if (!fields.length) {
      return (
        <EmptyText>
          {tab === 'screenshot' ? 'No metrics found on this screenshot.' : 'Data shows here when the screenshots are read.'}
        </EmptyText>
      );
    }

    return <FieldGroups fields={fields} />;
  };

  return (
    <Box sx={{ border: BORDER, borderRadius: 1.5, bgcolor: 'background.paper', overflow: 'hidden' }}>
      <Box sx={{ p: 1, borderBottom: BORDER }}>
        {multiple ? (
          <Stack spacing={1}>
            <ScopeSwitch
              value={tab}
              onChange={setScope}
              options={[
                { value: 'screenshot', label: 'This screenshot', count: currentFields.length || null },
                { value: 'all', label: 'All screenshots', count: allFields.length || null },
              ]}
            />
            <PanelSummary fields={fields} />
          </Stack>
        ) : (
          <PanelSummary title="Extracted values" fields={fields} />
        )}
      </Box>

      <Box sx={{ p: 1, maxHeight: { lg: 'calc(100vh - 268px)' }, overflow: 'auto' }}>{renderBody()}</Box>
    </Box>
  );
}

FieldPanel.propTypes = {
  resultsById: PropTypes.object.isRequired,
};
