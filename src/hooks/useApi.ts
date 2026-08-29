/**
 * API singleton hook. The underlying Supabase client is a browser singleton;
 * tests inject doubles at the PrepApi boundary.
 */

import { useMemo } from "react";
import { createPrepApi, type PrepApi } from "../lib/api";
import { getSupabaseClient } from "../lib/supabaseClient";

let singleton: PrepApi | null = null;

export function getApi(): PrepApi {
  if (!singleton) {
    singleton = createPrepApi(getSupabaseClient());
  }
  return singleton;
}

export function useApi(): PrepApi {
  return useMemo(() => getApi(), []);
}
