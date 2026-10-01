/** Map an ApiError's `fields` ({ name: [messages] }) to { name: firstMessage }. */
export function fieldErrors(error) {
  const out = {};
  for (const [key, messages] of Object.entries(error?.fields ?? {})) {
    if (messages?.length) out[key] = messages[0];
  }
  return out;
}

/** Rough 0-4 score; just a nudge, the server enforces the real rules. */
export function passwordScore(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password) && /[^\w\s]/.test(password)) score++;
  else if (/\d|[^\w\s]/.test(password) && password.length >= 14) score++;
  return Math.min(score, 4);
}
