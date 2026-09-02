"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  createApplication,
  updateApplication as updateApplicationDoc,
  getApplicationsByEmail,
  ApplicationData,
} from "@/lib/firestore";

export type { ApplicationData };

interface ApplyModalContextType {
  isOpen: boolean;
  selectedDomain: string;
  openApplyModal: (domain?: string) => void;
  closeApplyModal: () => void;
  applications: ApplicationData[];
  saveApplication: (app: Omit<ApplicationData, "id" | "submittedAt">) => Promise<ApplicationData>;
  updateApplication: (
    id: string,
    app: Omit<ApplicationData, "id" | "submittedAt">
  ) => Promise<ApplicationData>;
  latestApplication: ApplicationData | null;
  fetchUserApplications: (email: string) => Promise<void>;
}

const ApplyModalContext = createContext<ApplyModalContextType | undefined>(undefined);

const STORAGE_KEY = "ecell_recruitment_2026_apps";

export function ApplyModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState("technical");
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [latestApplication, setLatestApplication] = useState<ApplicationData | null>(null);

  // Load past applications if any from localStorage on boot
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ApplicationData[];
        setApplications(parsed);
        if (parsed.length > 0) {
          setLatestApplication(parsed[0]);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const openApplyModal = useCallback((domain?: string) => {
    if (domain) {
      setSelectedDomain(domain.toLowerCase());
    }
    setIsOpen(true);
    document.body.style.overflow = "hidden";
    if (typeof window !== "undefined" && window.__lenis) {
      window.__lenis.stop();
    }
  }, []);

  const closeApplyModal = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
    if (typeof window !== "undefined" && window.__lenis) {
      window.__lenis.start();
    }
  }, []);

  const fetchUserApplications = useCallback(async (email: string) => {
    if (!email) return;
    try {
      const fetched = await getApplicationsByEmail(email);
      if (fetched.length > 0) {
        setApplications((prev) => {
          const merged = [...fetched, ...prev.filter((p) => !fetched.some((f) => f.id === p.id))];
          return merged;
        });
        setLatestApplication(fetched[0]);
      }
    } catch (e) {
      console.warn("Could not query user applications from Firestore:", e);
    }
  }, []);

  const saveApplication = useCallback(
    async (appData: Omit<ApplicationData, "id" | "submittedAt">): Promise<ApplicationData> => {
      let newApp: ApplicationData;

      try {
        // applicantEmail/userId here already came straight from the signed-in
        // Firebase Auth profile (see ApplyModal.tsx) — Firestore just persists
        // it under the tracking ID, no re-collection happens.
        newApp = await createApplication(appData);
      } catch (err) {
        console.error("Failed to save application to Firestore:", err);
        // Fall back to a locally-generated record so the candidate still gets
        // a tracking ID even if the write failed.
        const domainCode = (appData.domain || "GEN").toUpperCase().slice(0, 4);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        newApp = {
          ...appData,
          id: `EC26-${domainCode}-${randomNum}`,
          submittedAt: new Date().toISOString(),
        };
      }

      const updated = [newApp, ...applications.filter((a) => a.id !== newApp.id)];
      setApplications(updated);
      setLatestApplication(newApp);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return newApp;
    },
    [applications]
  );

  const updateApplication = useCallback(
    async (
      id: string,
      appData: Omit<ApplicationData, "id" | "submittedAt">
    ): Promise<ApplicationData> => {
      const submittedAt = new Date().toISOString();
      let updatedApp: ApplicationData;

      try {
        updatedApp = await updateApplicationDoc(id, { ...appData, submittedAt });
      } catch (err) {
        console.error("Failed to update application in Firestore:", err);
        // Fall back to a locally-updated record so the edit still reflects
        // in this session even if the Firestore write failed.
        updatedApp = { ...appData, id, submittedAt };
      }

      const updated = [updatedApp, ...applications.filter((a) => a.id !== updatedApp.id)];
      setApplications(updated);
      setLatestApplication(updatedApp);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updatedApp;
    },
    [applications]
  );

  return (
    <ApplyModalContext.Provider
      value={{
        isOpen,
        selectedDomain,
        openApplyModal,
        closeApplyModal,
        applications,
        saveApplication,
        updateApplication,
        latestApplication,
        fetchUserApplications,
      }}
    >
      {children}
    </ApplyModalContext.Provider>
  );
}

export function useApplyModal() {
  const context = useContext(ApplyModalContext);
  if (!context) {
    throw new Error("useApplyModal must be used within an ApplyModalProvider");
  }
  return context;
}
