"use client";

import { AuthProvider } from "@/context/AuthContext";
import SmoothScroll from "@/components/interactions/SmoothScroll";
import CustomCursor from "@/components/interactions/CustomCursor";
import { ApplyModalProvider } from "@/context/ApplyModalContext";
import ApplyModal from "@/components/modal/ApplyModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ApplyModalProvider>
        <SmoothScroll>
          <CustomCursor />
          {children}
          <ApplyModal />
        </SmoothScroll>
      </ApplyModalProvider>
    </AuthProvider>
  );
}


