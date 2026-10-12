import { useId } from 'react';
import { Box, Grid, Stack, Text } from '../../../ui/primitives';
import type { CampaignData } from '../types';

export interface PurposeOptionsProps {
  options: CampaignData['purposes'];
  value: string;
  onChange: (id: string) => void;
}

/** C7 option cards for the campaign purpose (n-c1 1): a radio group where each card has a label and a description. */
export function PurposeOptions({ options, value, onChange }: PurposeOptionsProps) {
  const name = useId();
  return (
    <Box as="fieldset" padding={0} border="none">
      <Text as="legend" variant="label">Purpose</Text>
      <Grid min="sm" gap={3}>
        {options.map((o) => (
          <Box key={o.id} as="label" padding={4} radius="box" border={o.id === value ? 'strong' : 'default'} background={o.id === value ? 'subtle' : 'surface'}>
            <Stack gap={1}>
              <Stack as="span" direction="row" gap={2} align="center">
                <input type="radio" name={name} value={o.id} checked={o.id === value} onChange={() => onChange(o.id)} />
                <Text as="span" variant="label">{o.label}</Text>
              </Stack>
              <Text as="span" variant="small" tone="secondary">{o.description}</Text>
            </Stack>
          </Box>
        ))}
      </Grid>
    </Box>
  );
}
