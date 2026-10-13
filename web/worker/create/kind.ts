// The draft_post run kind (issue #93), registered in engine/kinds.ts: the brief and channel, and the registered kit
// version the post is written to, fixed at the start so every step and the saved post name the same kit. Refused
// before any row is written when there is no registered kit with a voice section, as the single-call drafter refused.
import { HttpError } from '../env';
import { registerKind } from '../engine/kinds';
import { registeredKit } from './ops';

registerKind('draft_post', async (env, brand, body) => {
  const brief = typeof body.brief === 'string' ? body.brief.trim().slice(0, 1000) : '';
  if (!brief) throw new HttpError(400, 'say what the post is about');
  const channel = typeof body.channel === 'string' ? body.channel.trim().slice(0, 40) : '';
  const kit = await registeredKit({ env }, brand.id);
  return { brief, channel, kitVersion: kit.version };
});
