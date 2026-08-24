"use client";

import SmoothScroll from "@/components/interactions/SmoothScroll";
import CustomCursor from "@/components/interactions/CustomCursor";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <CustomCursor />
      {children}
    </SmoothScroll>
  );
}
