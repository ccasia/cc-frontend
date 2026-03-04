import React from 'react';
import PropTypes from 'prop-types';
import { Popper } from '@mui/material';
import { useSeries, useItemTooltip, useMouseTracker, useAxisTooltip } from '@mui/x-charts';
import {
  PieTooltip,
  ClientTooltip,
  MatrixTooltip,
  RenewalTooltip,
  TurnaroundTooltip,
} from './client-tooltips';

function generateVirtualElement(mousePosition) {
  return {
    getBoundingClientRect: () => ({
      x: mousePosition.x,
      y: mousePosition.y,
      top: mousePosition.y,
      left: mousePosition.x,
      right: mousePosition.x,
      bottom: mousePosition.y,
      width: 0,
      height: 0,
      toJSON: () => ({}),
    }),
  };
}

function TooltipPopper({ children, mousePosition }) {
  const isMousePointer = mousePosition?.pointerType === 'mouse';
  const yOffset = isMousePointer ? 0 : 40 - mousePosition.height;

  return (
    <Popper
      sx={{ pointerEvents: 'none', zIndex: 1300 }}
      open
      placement={isMousePointer ? 'top-end' : 'top'}
      anchorEl={generateVirtualElement(mousePosition)}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, yOffset],
          },
        },
      ]}
    >
      {children}
    </Popper>
  );
}

TooltipPopper.propTypes = {
  children: PropTypes.node,
  mousePosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    pointerType: PropTypes.string,
    height: PropTypes.number,
  }),
};

function ItemTooltipWrapper({ Content }) {
  const tooltipData = useItemTooltip();
  const mousePosition = useMouseTracker();

  if (!tooltipData || !mousePosition) {
    return null;
  }

  return (
    <TooltipPopper mousePosition={mousePosition}>
      <Content tooltipData={tooltipData} />
    </TooltipPopper>
  );
}

ItemTooltipWrapper.propTypes = {
  Content: PropTypes.elementType.isRequired,
};

function AxisTooltipWrapper({ Content }) {
  const tooltipData = useAxisTooltip();
  const mousePosition = useMouseTracker();

  if (!tooltipData || !mousePosition) {
    return null;
  }

  return (
    <TooltipPopper mousePosition={mousePosition}>
      <Content tooltipData={tooltipData} />
    </TooltipPopper>
  );
}
AxisTooltipWrapper.propTypes = {
  Content: PropTypes.elementType.isRequired,
};

// --- Helper to safely resolve label ---
function resolveLabel(label) {
  if (typeof label === 'function') {
    try {
      return label('tooltip');
    } catch {
      return '';
    }
  }
  if (typeof label === 'object' && label !== null) {
    return label?.text ?? label?.label ?? String(label);
  }
  return label ?? '';
}

// --- Helper to safely resolve value ---
function resolveValue(value) {
  if (typeof value === 'object' && value !== null) {
    return value?.value ?? value?.v ?? 0;
  }
  return value ?? 0;
}

// --- Export ready-to-use slot components ---

export function ClientItemTooltipSlot() {
  return <ItemTooltipWrapper Content={ClientTooltipAdapter} />;
}

export function ClientAxisTooltipSlot() {
  return <AxisTooltipWrapper Content={ClientAxisTooltipAdapter} />;
}

export function MatrixTooltipSlot() {
  return <ItemTooltipWrapper Content={MatrixTooltipAdapter} />;
}

export function RenewalTooltipSlot() {
  // Try axis tooltip first, fall back to item tooltip
  return <RenewalTooltipInner />;
}

export function TurnaroundTooltipSlot() {
  return <ItemTooltipWrapper Content={TurnaroundTooltipAdapter} />;
}

export function PieTooltipSlot() {
  return <ItemTooltipWrapper Content={PieTooltipAdapter} />;
}

// --- Renewal uses a combined approach since axis trigger may not propagate ---
function RenewalTooltipInner() {
  const itemData = useItemTooltip();
  const mousePosition = useMouseTracker();
  const allSeries = useSeries();

  if (!mousePosition || !itemData) return null;

  // itemData gives us the hovered item's identifier
  // We use it to find the dataIndex, then pull values from ALL bar series
  const { identifier } = itemData;
  const dataIndex = identifier?.dataIndex;

  if (dataIndex == null) return null;

  const barSeries = allSeries?.bar;
  if (!barSeries?.series || !barSeries?.seriesOrder) return null;

  const series = barSeries.seriesOrder.map((seriesId) => {
    const s = barSeries.series[seriesId];
    const value = s?.data?.[dataIndex] ?? 0;
    let label = s?.label ?? '';

    if (typeof label === 'function') {
      try {
        label = label('tooltip');
      } catch {
        label = '';
      }
    }
    if (typeof label === 'object' && label !== null) {
      label = label?.text ?? label?.label ?? String(label);
    }

    return {
      color: s?.color ?? '#000',
      label,
      data: [typeof value === 'object' ? (value?.value ?? 0) : value],
    };
  });

  // Get the axis value (month name) from the dataset
  const firstSeriesId = barSeries.seriesOrder[0];
  const firstSeries = barSeries.series[firstSeriesId];
  const dataset = firstSeries?.dataset;
  const axisValue = dataset?.[dataIndex]?.name ?? '';

  return (
    <TooltipPopper mousePosition={mousePosition}>
      <RenewalTooltip series={series} dataIndex={0} axisValue={resolveLabel(axisValue)} />
    </TooltipPopper>
  );
}

// --- Adapters ---

function ClientTooltipAdapter({ tooltipData }) {
  const { identifier, value, label, color } = tooltipData;

  const series = [
    {
      id: identifier?.seriesId,
      color,
      label: resolveLabel(label),
      data: [resolveValue(value)],
      dataset: [],
    },
  ];

  return (
    <ClientTooltip
      itemData={{ seriesId: identifier?.seriesId, dataIndex: 0 }}
      series={series}
      dataIndex={0}
    />
  );
}

ClientTooltipAdapter.propTypes = {
  tooltipData: PropTypes.object,
};

function ClientAxisTooltipAdapter({ tooltipData }) {
  const { axisValue, seriesItems } = tooltipData;

  if (!seriesItems || seriesItems.length === 0) return null;

  const series = seriesItems.map((item) => ({
    id: item.seriesId,
    color: item.color,
    label: resolveLabel(item.label),
    data: [resolveValue(item.value)],
    dataset: [{ name: typeof axisValue === 'object' ? String(axisValue) : axisValue }],
  }));

  return (
    <ClientTooltip
      itemData={{ seriesId: series[0]?.id, dataIndex: 0 }}
      series={series}
      axisValue={typeof axisValue === 'string' ? axisValue : String(axisValue ?? '')}
      dataIndex={0}
    />
  );
}

ClientAxisTooltipAdapter.propTypes = {
  tooltipData: PropTypes.object,
};

function MatrixTooltipAdapter({ tooltipData }) {
  const { identifier, value, color } = tooltipData;

  const series = {
    data: [
      {
        x: typeof value === 'object' ? value?.x : value,
        y: typeof value === 'object' ? value?.y : 0,
        campaignName: value?.campaignName,
        clientName: value?.clientName,
        image: value?.image,
      },
    ],
    color,
  };

  return <MatrixTooltip itemData={{ dataIndex: 0 }} series={series} />;
}

MatrixTooltipAdapter.propTypes = {
  tooltipData: PropTypes.object,
};

function TurnaroundTooltipAdapter({ tooltipData }) {
  const { identifier, value, color } = tooltipData;

  const series = {
    id: identifier?.seriesId,
    color,
    data: [
      {
        x: typeof value === 'object' ? value?.x : value,
        y: typeof value === 'object' ? value?.y : 0,
        payload: value?.payload,
      },
    ],
  };

  return <TurnaroundTooltip itemData={{ dataIndex: 0 }} series={series} />;
}

TurnaroundTooltipAdapter.propTypes = {
  tooltipData: PropTypes.object,
};

function PieTooltipAdapter({ tooltipData }) {
  const safeValue = resolveValue(tooltipData.value);
  const safeLabel = resolveLabel(tooltipData.label);
  const safeColor =
    typeof tooltipData.color === 'object'
      ? (tooltipData.color?.value ?? '#000')
      : (tooltipData.color ?? '#000');

  const series = {
    data: [
      {
        value: safeValue,
        label: safeLabel,
        color: safeColor,
      },
    ],
  };

  return <PieTooltip itemData={{ dataIndex: 0 }} series={series} />;
}

PieTooltipAdapter.propTypes = {
  tooltipData: PropTypes.object,
};
