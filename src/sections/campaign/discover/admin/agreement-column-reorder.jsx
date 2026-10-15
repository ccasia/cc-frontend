import PropTypes from 'prop-types';
import { CSS } from '@dnd-kit/utilities';
import { useRef, useState, useEffect, useContext, useCallback, createContext } from 'react';
import {
  useSensor,
  DndContext,
  useSensors,
  closestCenter,
  PointerSensor,
  useDndContext,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import { GlobalStyles } from '@mui/material';

// Experimental: admins drag Agreements column headers to reorder the columns. Checkbox, index and
// the actions column aren't in this list, so they stay where they are.
export const REORDERABLE_COLUMNS = [
  'creator',
  'tier',
  'outreach',
  'status',
  'budget',
  'price',
  'receipt',
];

const STORAGE_KEY = 'campaign-agreements:column-order';

// Put this attribute on the table, and data-column="<id>" on each reorderable body cell, so the
// dragged column can be faded with one style rule instead of re-rendering every row.
export const REORDER_TABLE_ATTR = 'data-column-reorder';

// The saved order, keeping only known columns and appending any added since it was saved.
const readSavedOrder = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return REORDERABLE_COLUMNS;

    const known = saved.filter((id) => REORDERABLE_COLUMNS.includes(id));
    return [...known, ...REORDERABLE_COLUMNS.filter((id) => !known.includes(id))];
  } catch (error) {
    return REORDERABLE_COLUMNS;
  }
};

// Column order, remembered per browser so it survives a refresh.
export const useColumnOrder = () => {
  const [columnOrder, setColumnOrder] = useState(readSavedOrder);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnOrder));
  }, [columnOrder]);

  const moveColumn = useCallback((activeId, overId) => {
    setColumnOrder((prev) => arrayMove(prev, prev.indexOf(activeId), prev.indexOf(overId)));
  }, []);

  return { columnOrder, moveColumn };
};

// Headers only slide sideways.
const horizontalOnly = ({ transform }) => ({ ...transform, y: 0 });

// Releasing a drag over the header it started on also fires a click, which would sort the Status
// column. The provider raises this flag on drop; headers swallow the one click that follows.
const JustDroppedContext = createContext({ current: false });

// Fades the dragged column's body cells. Only this tiny component re-renders as the drag state
// changes, not the table.
function DraggedColumnFade() {
  const { active } = useDndContext();
  if (!active) return null;

  return (
    <GlobalStyles
      styles={{
        [`[${REORDER_TABLE_ATTR}] td[data-column="${active.id}"]`]: { opacity: 0.35 },
      }}
    />
  );
}

// Wraps the table. `columns` are the visible reorderable column ids, in their current order.
export function ColumnReorderProvider({ columns, onMove, children }) {
  const justDroppedRef = useRef(false);

  const sensors = useSensors(
    // A few pixels of movement before a drag starts, so a plain click still sorts the Status column.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[horizontalOnly]}
      onDragEnd={({ active, over }) => {
        justDroppedRef.current = true;
        // The click (if any) fires right after the drop; clear the flag once it has had its turn.
        setTimeout(() => {
          justDroppedRef.current = false;
        }, 0);
        if (over && active.id !== over.id) onMove(active.id, over.id);
      }}
    >
      <JustDroppedContext.Provider value={justDroppedRef}>
        <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
          {children}
        </SortableContext>
      </JustDroppedContext.Provider>
      <DraggedColumnFade />
    </DndContext>
  );
}

ColumnReorderProvider.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  onMove: PropTypes.func.isRequired,
  children: PropTypes.node,
};

// Makes one header cell draggable. `children` is a render function that receives the props to
// spread onto the cell (ref, drag listeners, transform style).
export function DraggableColumnHeader({ id, children }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
  });
  const justDroppedRef = useContext(JustDroppedContext);

  return children({
    ref: setNodeRef,
    ...listeners,
    tabIndex: attributes.tabIndex,
    'aria-roledescription': attributes['aria-roledescription'],
    'aria-describedby': attributes['aria-describedby'],
    onClickCapture: (e) => {
      if (!justDroppedRef.current) return;
      justDroppedRef.current = false;
      e.stopPropagation();
    },
    style: {
      transform: CSS.Translate.toString(transform),
      transition,
      position: 'relative',
      zIndex: isDragging ? 3 : undefined,
      cursor: isDragging ? 'grabbing' : 'grab',
      boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.12)' : undefined,
      userSelect: 'none',
    },
  });
}

DraggableColumnHeader.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
};
