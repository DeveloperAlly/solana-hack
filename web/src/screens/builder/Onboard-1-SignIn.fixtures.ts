// Sample data for Onboard-1-SignIn. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Onboard-1-SignIn
// (note n-ob1); issue #50; backend map §4, row "Onboard-1-SignIn". Bracketed values stay bracketed, as on the canvas.
import type { SignInData } from './types';

export const signInData: SignInData = {
  email: '[you]@jamjam.tech',
  resendNote: "Didn't get it? Resend in 0:24",
  codeError: 'That code is wrong or has expired. Check the latest email, or send a new code.',
};
