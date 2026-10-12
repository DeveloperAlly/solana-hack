// Demo state -> C10 DataTable state, shared by this page's tables (issue #51). Empty is "ready" with no rows.
import type { DataTableState } from '../../ui/composites/DataTable';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';

export const tableState: Record<ScreenState, DataTableState> = { success: 'ready', empty: 'ready', loading: 'loading', error: 'error' };
