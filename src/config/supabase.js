import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Current client instance — recreated when firebase UID is set/cleared
let currentClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Set the Firebase UID header on the Supabase client.
 * RLS policies use current_setting('request.headers.x-firebase-uid') to filter rows.
 */
export function setFirebaseUid(uid) {
  currentClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { "x-firebase-uid": uid },
    },
  });
}

/**
 * Clear the Firebase UID header (on sign-out).
 */
export function clearFirebaseUid() {
  currentClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Proxy that always delegates to the current client.
 * Allows existing `import { supabase }` to work without changes
 * even when the underlying client is swapped on login/logout.
 */
export const supabase = new Proxy({}, {
  get(_, prop) {
    const val = currentClient[prop];
    return typeof val === "function" ? val.bind(currentClient) : val;
  },
});
