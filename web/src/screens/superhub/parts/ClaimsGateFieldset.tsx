import { Box, Stack, Text } from '../../../ui/primitives';
import { CheckboxRow } from '../../../ui/composites/CheckboxRow';
import type { ClaimsRule } from '../types';

export interface ClaimsGateFieldsetProps {
  level: string;
  rules: ClaimsRule[];
  checked: string[];
  onToggle: (id: string) => void;
}

/** D20 claims strictness as a gate of rule checkboxes, not a dial (n-ve 2): a draft that breaks a ticked rule is blocked. */
export function ClaimsGateFieldset({ level, rules, checked, onToggle }: ClaimsGateFieldsetProps) {
  return (
    <Box as="fieldset" padding={5} border="default" radius="box" background="surface">
      <Text as="legend" variant="label">Claims gate ({level})</Text>
      <Stack gap={3}>
        <Text variant="small" tone="secondary">A gate, not a dial: a draft that breaks a ticked rule is blocked before you see it.</Text>
        {rules.map((r) => <CheckboxRow key={r.id} label={r.label} checked={checked.includes(r.id)} onChange={() => onToggle(r.id)} />)}
      </Stack>
    </Box>
  );
}
