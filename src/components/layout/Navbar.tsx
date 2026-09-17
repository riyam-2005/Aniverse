"use client";

import AppTopNav from "@/components/layout/AppTopNav";
import type { Genre } from "@/types/anime";

export default function Navbar({ genres = [] }: { genres?: Genre[] }) {
  return <AppTopNav genres={genres} />;
}
