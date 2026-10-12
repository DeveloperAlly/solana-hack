import { Stack } from '../../../ui/primitives';
import { VerifyInput } from '../../../ui/domain/VerifyInput';
import type { LookupKind } from '../types';
import type { LookupCheck } from '../useVerifyLookup';
import { VerifyLookupResult } from './VerifyLookupResult';
import { VerifyStatusView } from './VerifyStatusView';

const fieldLabel: Record<LookupKind, string> = { account: 'Account handle or link', kit: 'Kit hash', claim: 'Claim text' };

export interface VerifyLookupPanelProps {
  kind: LookupKind;
  query: string;
  check: LookupCheck;
  onCheck: (kind: LookupKind, text: string) => void;
  errorNote: string;
}

/** One Verify-4 tab: the field for an account, kit hash or claim, and what the registry says about it. */
export function VerifyLookupPanel({ kind, query, check, onCheck, errorNote }: VerifyLookupPanelProps) {
  return (
    <Stack gap={5}>
      <VerifyInput label={fieldLabel[kind]} defaultValue={query} checking={check.status === 'checking'} error={check.inputError} onCheck={(text) => onCheck(kind, text)} />
      <VerifyStatusView
        status={check.status}
        idle={null}
        done={<VerifyLookupResult kind={kind} record={check.record} />}
        errorNote={errorNote}
        onRetry={() => onCheck(kind, query)}
      />
    </Stack>
  );
}
