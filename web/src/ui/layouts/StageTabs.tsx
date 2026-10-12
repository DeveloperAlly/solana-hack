import { stageById, type StageId } from '../../config/nav';
import { TabNav } from '../composites/TabNav';
import { useNavHref } from '../hooks/useNavHref';
import styles from './StageTabs.module.css';

export interface StageTabsProps {
  stage: StageId;
  /** The current tab's id (config/nav.ts); it gets aria-current="page". */
  current?: string;
}

/**
 * L3 StageTabs: a stage's section tabs, exactly as the canvas subnav draws them (config/nav.ts), drawn with the
 * link-driven C4 TabNav. Renders nothing for a stage without tabs (Today). The tabs stay on one line and scroll
 * sideways on a narrow screen, so Grow's ten tabs never push the page down.
 */
export function StageTabs({ stage, current }: StageTabsProps) {
  const href = useNavHref();
  const s = stageById(stage);
  if (s.tabs.length === 0) return null;
  return (
    <div className={styles.scroller}>
      <TabNav label={s.label} items={s.tabs.map((t) => ({ id: t.id, label: t.label, href: href(t) }))} value={current ?? ''} />
    </div>
  );
}
