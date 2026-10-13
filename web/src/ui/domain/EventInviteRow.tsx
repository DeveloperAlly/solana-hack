import { useState } from 'react';
import { ListRow } from '../composites/ListRow';
import { GatedButton } from '../composites/GatedButton';
import { Button, Select } from '../primitives';
import type { SelectOption } from '../primitives/Select';
import styles from './EventInviteRow.module.css';

export interface EventInviteRowProps {
  name: string;
  /** "Thu 16 Oct · Singapore" */
  detail: string;
  /** Role options; accepting asks for one and none is pre-selected. */
  roles: SelectOption[];
  onAccept: (role: string) => void;
  onSkip: () => void;
}

/**
 * D95 EventInviteRow: a new event from the brand's Luma calendar, waiting to be accepted or skipped (canvas v21 Events:
 * "accepting a Luma event asks for your role; role picks the content plan template"). States: waiting, choosing a
 * role (Accept disabled until one is chosen).
 */
export function EventInviteRow({ name, detail, roles, onAccept, onSkip }: EventInviteRowProps) {
  const [choosing, setChoosing] = useState(false);
  const [role, setRole] = useState('');
  const gate = role ? { blocking: false, label: 'The role picks the content plan.' } : { blocking: true, label: 'Choose your role first.' };
  const actions = choosing ? (
    <div className={styles.picker}>
      <Select label={`Your role at ${name}`} options={[{ value: '', label: 'Choose a role' }, ...roles]} value={role} onValueChange={setRole} />
      <div className={styles.buttons}>
        <GatedButton gate={gate} onClick={() => onAccept(role)}>Accept</GatedButton>
        <Button variant="secondary" onClick={() => { setChoosing(false); setRole(''); }}>Cancel</Button>
      </div>
    </div>
  ) : (
    <>
      <Button onClick={() => setChoosing(true)} aria-label={`Accept ${name}`}>Accept</Button>
      <Button variant="secondary" onClick={onSkip} aria-label={`Skip ${name}`}>Skip</Button>
    </>
  );
  return <ListRow title={name} detail={detail} status={{ label: 'New from Luma' }} actions={actions} />;
}
