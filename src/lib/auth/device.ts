// A stable ID for this browser, sent as `device_id` on dashboard login.
// The backend trusts a device after its emailed code is confirmed once, so the
// ID must survive reloads. It identifies the browser, not the person, and is
// not a secret: the session cookie is what proves who is signed in.

const KEY = "if360.deviceId";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

let memoryId: string | null = null;

export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
    const id = newId();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Storage blocked (private mode): the device is re-verified each session.
    memoryId ??= newId();
    return memoryId;
  }
}
