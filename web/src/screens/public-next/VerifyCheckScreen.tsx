/*
 * Data contract: VerifyCheckScreen, which renders artboards Verify-1-Match, Verify-2-NoMatch, Verify-3-Edited and
 * Verify-5-Retracted (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, page "Verify + ledger" and the
 * Verify-5 board on page "Coming soon"; issue #49). They are one screen: the pasted text decides the result.
 * Backend map: .agentic/what/context/backend_map.md §4, row "Verify-1, Verify-2, Verify-3" (POST /api/verify,
 * POST /api/verify/report; tables registrations, drafts; G-MATCH for "edited"). Shape: VerifyCheckData in ./types.ts.
 *
 * | Field                     | Source                                                                    | Empty when            |
 * |---------------------------|---------------------------------------------------------------------------|-----------------------|
 * | query                     | Client: the visitor's paste, or `?q=` (Ledger "Check it")                 | nothing pasted yet    |
 * | posts[].text              | POST /api/verify matches the normalised text's hash (posts.ts verifyText) | no registered post    |
 * | posts[].brand.*           | registrations.brand_id -> brands (name, domain, domain_verified_at_time)  | never (a post has one)|
 * | posts[].kitVersion        | registrations.kit_version                                                 | never                 |
 * | posts[].approver/approvedAt| registrations.approver_id, registered_at                                 | "[approver]", "[date]"|
 * | posts[].published         | registrations.platform_url and published time                             | not published yet     |
 * | posts[].signature         | registrations tx signature (SAS attestation)                              | "[tx]" while pending  |
 * | posts[].bannedPhrases     | the brand's claims gate (kit voice rules)                                 | no banned phrases     |
 * | posts[].retraction        | proposed retraction record (research 10 §7.1 N4); not in the schema yet   | not retracted         |
 * | intro, note               | Canvas copy for coming-soon boards (Verify-3, Verify-5)                   | hackathon boards      |
 * | errorNote                 | POST /api/verify `note`, or the request failure                           | never shown unless error |
 *
 * States (C28): success = the check result; empty = nothing pasted; loading = checking; error = could not check.
 * Presentational: no network call. The live /verify screen (screens/verify) is unchanged.
 */
import type { RouteTag } from '../../config/routes';
import { VerifyInput } from '../../ui/domain/VerifyInput';
import { VerifyCheckResult } from './components/VerifyCheckResult';
import { VerifyPageFrame } from './components/VerifyPageFrame';
import { VerifyPageHeader } from './components/VerifyPageHeader';
import { VerifySampleLinks } from './components/VerifySampleLinks';
import type { ScreenProps, VerifyCheckData } from './types';
import { useVerifyCheck } from './useVerifyCheck';

export interface VerifyCheckScreenProps extends ScreenProps<VerifyCheckData> {
  /** Canvas tag of the artboard shown (Verify-3 and Verify-5 are coming soon). */
  tag: RouteTag;
}

export function VerifyCheckScreen({ data, state = 'success', tag }: VerifyCheckScreenProps) {
  const flow = useVerifyCheck(data, state);
  return (
    <VerifyPageFrame>
      <VerifyPageHeader title="Is this official?" tag={tag} intro={data.intro} note={data.note} />
      <VerifyInput key={flow.inputKey} defaultValue={flow.query} checking={flow.status === 'checking'} error={flow.inputError} onCheck={flow.check} />
      <VerifyCheckResult status={flow.status} outcome={flow.outcome} errorNote={data.errorNote} onRetry={flow.retry} />
      <VerifySampleLinks />
    </VerifyPageFrame>
  );
}
