import "@testing-library/jest-dom/vitest";
import React from "react";

globalThis.React = React;

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-anon-key-00000000000000000000";
process.env.SUPABASE_SERVICE_ROLE_KEY = "mock-service-role-key-0000000000000000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
