import { Helmet } from 'react-helmet-async';

import { useResponsive } from 'src/hooks/use-responsive';

import { TaskView, KanbanView } from 'src/sections/kanban/view';

// ----------------------------------------------------------------------

export default function KanbanPage() {
  const smDown = useResponsive('down', 'sm');
  return (
    <>
      <Helmet>
        <title> Dashboard: Tasks</title>
      </Helmet>

      {smDown ? <TaskView /> : <KanbanView />}
    </>
  );
}
