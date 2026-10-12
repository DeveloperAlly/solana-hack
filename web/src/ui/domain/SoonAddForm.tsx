import { Button } from '../primitives/Button';
import { useDisclosure } from '../hooks/useDisclosure';
import { SoonInlineForm, type SoonInlineFormProps } from './SoonInlineForm';

export interface SoonAddFormProps extends Omit<SoonInlineFormProps, 'onCancel'> {
  /** The button that opens the form, e.g. "Add a brand". */
  triggerLabel: string;
}

/** An "Add …" button that opens a SoonInlineForm in place; the form closes on a valid submit or on Cancel. */
export function SoonAddForm({ triggerLabel, onSubmit, ...form }: SoonAddFormProps) {
  const { open, show, hide } = useDisclosure();
  if (!open) return <Button variant="secondary" onClick={show}>{triggerLabel}</Button>;
  return (
    <SoonInlineForm
      {...form}
      onSubmit={(values) => {
        onSubmit(values);
        hide();
      }}
      onCancel={hide}
    />
  );
}
