import { supabase } from '../lib/supabase';

export async function sendOtpToEmail(targetEmail: string, otpCode: string, systemName = 'Bank & MNC Recovery System'): Promise<{ success: boolean; channel?: string }> {
  let sent = false;

  // Channel 1: Supabase Native Auth OTP
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: false
      }
    });
    if (!error) {
      console.log('OTP dispatched via Supabase Auth Mailer');
      sent = true;
    }
  } catch (err) {
    console.warn('Supabase Auth OTP dispatch note:', err);
  }

  // Channel 2: FormSubmit Direct Transactional Mailer (Sends formatted OTP straight to recipient Gmail)
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: `🔐 Your Login Verification Code: ${otpCode} - ${systemName}`,
        _template: 'table',
        _captcha: 'false',
        System: systemName,
        Recipient: targetEmail,
        Security_Code: otpCode,
        Valid_For: '10 Minutes',
        Message: `Use the 6-digit code above to complete your login verification. If you did not request this, please secure your account immediately.`
      })
    });
    if (res.ok) {
      console.log('OTP dispatched via Transactional Mailer');
      sent = true;
    }
  } catch (err) {
    console.warn('Direct Mailer note:', err);
  }

  return { success: sent, channel: sent ? 'email' : 'pending' };
}