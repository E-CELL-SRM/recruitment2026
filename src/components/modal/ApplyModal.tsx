"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApplyModal, ApplicationData } from "@/context/ApplyModalContext";
import { useAuth } from "@/context/AuthContext";
import { getApplicationsByEmail } from "@/lib/firestore";
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  User,
  Briefcase,
  Layers,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Lock,
  LogIn,
} from "lucide-react";

import styles from "./ApplyModal.module.css";

const DOMAIN_OPTIONS = [
  {
    id: "technical",
    title: "Technical",
    desc: "Web Dev, AI/ML, UI/UX Design, Hardware & Systems",
    subTracks: [
      "Web Development",
      "AI / Machine Learning",
      "UI / UX Design",
      "Hardware & Embedded Systems",
    ],
  },
  {
    id: "creative",
    title: "Creative",
    desc: "Visual Brand, Video Motion Graphics, Copy & 3D VFX",
    subTracks: [
      "Graphic Design & Branding",
      "Video Editing & Motion Graphics",
      "Content & Copywriting",
      "3D Modeling / VFX",
    ],
  },
  {
    id: "corporate",
    title: "Corporate",
    desc: "Sponsorships, Public Relations, Operations & Growth",
    subTracks: [
      "Corporate Relations & Sponsorships",
      "Event Operations & Logistics",
      "Public Relations & Media",
      "Marketing & Growth",
    ],
  },
  {
    id: "legal",
    title: "Legal & Finance",
    desc: "IP, Policy, Compliance & Venture Finance",
    subTracks: ["Legal & Compliance", "Venture Policy & IP", "Finance & Budget Management"],
  },
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year / Postgrad"];

function getDomainPortfolioConfig(domainId: string, subTrackName: string) {
  if (domainId === "technical") {
    if (subTrackName === "UI / UX Design") {
      return {
        portfolioLabel: "Figma Community / Behance / UX Case Study Link",
        portfolioPlaceholder: "https://figma.com/@username or behance.net/...",
        portfolioHint: "Share Figma file links, interactive design systems, UX user journeys, or wireframes.",
        skillsLabel: "UI/UX & Product Design Tools",
        skillsPlaceholder: "e.g. Figma, FigJam, Framer, Adobe XD, Design Systems, Prototyping",
      };
    }
    if (subTrackName === "AI / Machine Learning") {
      return {
        portfolioLabel: "GitHub / Kaggle / Colab / HuggingFace Model Links",
        portfolioPlaceholder: "https://github.com/username or kaggle.com/...",
        portfolioHint: "Link to your machine learning models, Kaggle submissions, Colab notebooks, or AI projects.",
        skillsLabel: "Primary AI/ML Frameworks & Languages",
        skillsPlaceholder: "e.g. PyTorch, TensorFlow, Scikit-learn, LangChain, Python, OpenCV",
      };
    }
    if (subTrackName === "Hardware & Embedded Systems") {
      return {
        portfolioLabel: "Hardware Repo / Circuit Schematics / Project Drive Link",
        portfolioPlaceholder: "https://github.com/username, TinkerCAD, or Google Drive link",
        portfolioHint: "Share circuit schematics, Arduino/ESP32/Raspberry Pi projects, IoT repositories, or demo videos.",
        skillsLabel: "Hardware Platforms, Microcontrollers & Protocols",
        skillsPlaceholder: "e.g. Arduino, ESP32, STM32, Raspberry Pi, PCB Design, I2C, SPI, C/C++",
      };
    }
    return {
      portfolioLabel: "GitHub Profile / Live Project / Web App URLs",
      portfolioPlaceholder: "https://github.com/username or https://myproject.vercel.app",
      portfolioHint: "Share your GitHub profile, hosted portfolio, or links to web applications you've built.",
      skillsLabel: "Primary Web Tech Stack & Frameworks",
      skillsPlaceholder: "e.g. React, Next.js, TypeScript, Node.js, Tailwind CSS, PostgreSQL",
    };
  }

  if (domainId === "creative") {
    if (subTrackName === "Video Editing & Motion Graphics") {
      return {
        portfolioLabel: "Video Showreel / YouTube / Google Drive Reel Link",
        portfolioPlaceholder: "https://youtube.com/watch?v=... or Google Drive video link",
        portfolioHint: "Link to your video editing showreel, After Effects motion graphics, or cinematic cuts.",
        skillsLabel: "Editing & Motion Software",
        skillsPlaceholder: "e.g. Premiere Pro, After Effects, DaVinci Resolve, CapCut, Blender",
      };
    }
    if (subTrackName === "Content & Copywriting") {
      return {
        portfolioLabel: "Medium / Substack / Articles / Google Docs Portfolio",
        portfolioPlaceholder: "https://medium.com/@username or Drive document link",
        portfolioHint: "Share published articles, blog posts, advertising copy samples, video scripts, or newsletters.",
        skillsLabel: "Writing Niches & Communication Formats",
        skillsPlaceholder: "e.g. Technical Writing, Startup Journalism, Ad Copy, SEO, Ghostwriting",
      };
    }
    if (subTrackName === "3D Modeling / VFX") {
      return {
        portfolioLabel: "ArtStation / Sketchfab / Blender Renders Link",
        portfolioPlaceholder: "https://artstation.com/username or Drive folder",
        portfolioHint: "Share 3D models, Blender scenes, lighting renders, or VFX clips.",
        skillsLabel: "3D & VFX Tools",
        skillsPlaceholder: "e.g. Blender, Maya, Unreal Engine, Cinema4D, Substance Painter",
      };
    }
    return {
      portfolioLabel: "Behance / Dribbble / Design Portfolio Drive Link",
      portfolioPlaceholder: "https://behance.net/username or Google Drive folder",
      portfolioHint: "Link to your poster designs, brand identity guides, social media graphics, or illustrations.",
      skillsLabel: "Graphic Design Software & Suite",
      skillsPlaceholder: "e.g. Adobe Illustrator, Photoshop, InDesign, Canva Pro, Lightroom",
    };
  }

  if (domainId === "corporate") {
    if (subTrackName === "Corporate Relations & Sponsorships") {
      return {
        portfolioLabel: "LinkedIn Profile / Sponsorship Proposal Deck (Drive Link)",
        portfolioPlaceholder: "https://linkedin.com/in/username or Google Drive link",
        portfolioHint: "Share corporate outreach pitches, sponsorship decks, or brand partnership track records.",
        skillsLabel: "Key Strengths & Corporate Tools",
        skillsPlaceholder: "e.g. Cold Outreach, Negotiation, B2B Pitching, CRM Tools, Proposal Drafting",
      };
    }
    if (subTrackName === "Event Operations & Logistics") {
      return {
        portfolioLabel: "LinkedIn Profile / Past Event Portfolio (Drive Link)",
        portfolioPlaceholder: "https://linkedin.com/in/username or Google Drive link",
        portfolioHint: "Detail major fest/event coordination experience, crowd management, or club operations.",
        skillsLabel: "Operations & Management Strengths",
        skillsPlaceholder: "e.g. Vendor Management, Event Scheduling, Budget Allocation, Team Coordination",
      };
    }
    if (subTrackName === "Public Relations & Media") {
      return {
        portfolioLabel: "LinkedIn / Press Releases / Media Campaigns Link",
        portfolioPlaceholder: "https://linkedin.com/in/username or Google Drive link",
        portfolioHint: "Press releases, influencer collaborations, media handling, or official communication samples.",
        skillsLabel: "PR & Communication Competencies",
        skillsPlaceholder: "e.g. Media Relations, Crisis Communication, Press Releases, Influencer Outreach",
      };
    }
    return {
      portfolioLabel: "LinkedIn / Marketing Campaigns / Analytics Case Study (Drive link)",
      portfolioPlaceholder: "https://linkedin.com/in/username or Google Drive link",
      portfolioHint: "Share campaign metrics, social media growth experiments, or marketing collateral.",
      skillsLabel: "Growth & Marketing Channels",
      skillsPlaceholder: "e.g. Performance Marketing, Social Media Strategy, Meta Ads, SEO, Community Building",
    };
  }

  // Legal & Finance
  if (subTrackName === "Finance & Budget Management") {
    return {
      portfolioLabel: "LinkedIn / Financial Model / Valuation Sheet (Drive link)",
      portfolioPlaceholder: "https://linkedin.com/in/username or Google Drive link",
      portfolioHint: "Share financial projections, startup valuation models, budget breakdowns, or spreadsheets.",
      skillsLabel: "Financial Modeling Tools & Focus Areas",
      skillsPlaceholder: "e.g. Advanced Excel/Sheets, DCF Valuation, Budgeting, Financial Modeling, Python for Finance",
    };
  }
  return {
    portfolioLabel: "LinkedIn / Moot Court / Policy Draft / Legal Research Link",
    portfolioPlaceholder: "https://linkedin.com/in/username or Google Drive document",
    portfolioHint: "Share moot court memorials, policy briefs, contract templates, IP research, or legal writing.",
    skillsLabel: "Relevant Legal Coursework & Focus Areas",
    skillsPlaceholder: "e.g. Corporate Law, Intellectual Property (IPR), Contract Drafting, Venture Governance",
  };
}

export default function ApplyModal() {
  const { isOpen, closeApplyModal, selectedDomain, saveApplication, updateApplication } = useApplyModal();
  const { user, userProfile, signInWithGoogle, signInWithEmailOnly } = useAuth();
  const activeCandidate = userProfile || (user ? {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  } : null);

  const [regNumber, setRegNumber] = useState("");
  const [domain, setDomain] = useState("technical");
  const [subTrack, setSubTrack] = useState("Web Development");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("1st Year");
  const [skillsOrExperience, setSkillsOrExperience] = useState("");
  const [reason, setReason] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [submittedApp, setSubmittedApp] = useState<ApplicationData | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Duplicate-application guard: once we know the signed-in candidate's
  // email, we check Firestore for an application already on file for it.
  // If one exists, we show a "you've already applied" panel instead of a
  // blank form, with the option to edit that same application in place
  // rather than ever submitting a second one.
  const [existingApp, setExistingApp] = useState<ApplicationData | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualAuthError, setManualAuthError] = useState<string | null>(null);
  const [isManualSigningIn, setIsManualSigningIn] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync selectedDomain & user when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedDomain) {
        const targetDomain = selectedDomain.toLowerCase();
        setDomain(targetDomain);
        const dObj = DOMAIN_OPTIONS.find((d) => d.id === targetDomain);
        if (dObj && dObj.subTracks.length > 0) {
          setSubTrack(dObj.subTracks[0]);
        }
      }
      setSubmittedApp(null);
      setErrors({});
      setExistingApp(null);
      setIsEditingExisting(false);
    }
    // `activeCandidate` is intentionally excluded: it's a new object every
    // render (see its derivation above), and it isn't used in this effect.
    // Including it caused an update loop — this effect set state, which
    // re-rendered the component, which produced a new `activeCandidate`
    // reference, which re-triggered this effect indefinitely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDomain]);

  // Duplicate guard: as soon as we know who's signed in (whether they were
  // already logged in from a previous visit, or just signed in inside this
  // form), check whether this email already has an application on file.
  useEffect(() => {
    const email = activeCandidate?.email;
    if (!isOpen || !email) {
      setExistingApp(null);
      setCheckingExisting(false);
      return;
    }

    let cancelled = false;
    setCheckingExisting(true);
    getApplicationsByEmail(email)
      .then((apps) => {
        if (!cancelled) setExistingApp(apps[0] || null);
      })
      .catch(() => {
        if (!cancelled) setExistingApp(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeCandidate?.email]);

  // Pre-fill the form with the candidate's existing application and drop
  // into edit mode, so resubmitting updates that same doc instead of
  // creating a second one.
  const startEditingExisting = () => {
    if (!existingApp) return;
    setRegNumber(existingApp.regNumber || "");
    setDomain(existingApp.domain || "technical");
    setSubTrack(existingApp.subDomain || "");
    setPhone(existingApp.phone || "");
    setYear(existingApp.year || "1st Year");
    setSkillsOrExperience(existingApp.skillsOrExperience || "");
    setReason(existingApp.reason || "");
    setPortfolioUrl(existingApp.portfolioUrl || "");
    setIsEditingExisting(true);
  };

  // Update default sub-track when domain changes
  const handleDomainChange = (dId: string) => {
    setDomain(dId);
    const dObj = DOMAIN_OPTIONS.find((d) => d.id === dId);
    if (dObj && dObj.subTracks.length > 0) {
      setSubTrack(dObj.subTracks[0]);
    } else {
      setSubTrack("");
    }
  };

  // Keyboard handler for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeApplyModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeApplyModal]);

  const handleModalGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleModalManualSignIn = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    setManualAuthError(null);

    const trimmedName = manualName.trim();
    const trimmedEmail = manualEmail.trim();

    if (!trimmedName) {
      setManualAuthError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setManualAuthError("Please enter a valid email address.");
      return;
    }

    setIsManualSigningIn(true);
    try {
      await signInWithEmailOnly(trimmedEmail, trimmedName);
      setShowManualForm(false);
    } catch {
      setManualAuthError("Something went wrong signing you in. Please try again.");
    } finally {
      setIsManualSigningIn(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!activeCandidate?.email || !activeCandidate?.displayName) {
      newErrors.auth = "Please sign in with Google or enter your name & email to continue";
    }

    if (!regNumber.trim()) {
      newErrors.regNumber = "Registration number is required";
    } else if (!/^[A-Z0-9]{8,18}$/i.test(regNumber.trim().replace(/\s+/g, ""))) {
      newErrors.regNumber = "Enter a valid SRM Reg No (e.g. RA2311003010xxx)";
    }

    if (!domain) {
      newErrors.domain = "Please select a domain";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone/WhatsApp number is required";
    } else if (!/^\+?[0-9]{10,13}$/.test(phone.trim().replace(/[\s-]/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit mobile number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const applicantEmail = (activeCandidate?.email || "").toLowerCase();
    const applicantName = activeCandidate?.displayName || "";

    setIsSubmitting(true);

    const payload = {
      userId: activeCandidate?.uid || "",
      applicantEmail,
      fullName: applicantName,
      regNumber: regNumber.trim().toUpperCase(),
      domain,
      subDomain: subTrack,
      phone: phone.trim(),
      year,
      skillsOrExperience: skillsOrExperience.trim(),
      reason: reason.trim(),
      portfolioUrl: portfolioUrl.trim(),
    };

    try {
      const app =
        isEditingExisting && existingApp
          ? await updateApplication(existingApp.id, payload)
          : await saveApplication(payload);

      setSubmittedApp(app);
    } catch (err) {
      console.error("Failed to save application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingId = () => {
    if (!submittedApp) return;
    navigator.clipboard.writeText(submittedApp.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const resetForNewApp = () => {
    setSubmittedApp(null);
    setRegNumber("");
    setPhone("");
    setSkillsOrExperience("");
    setReason("");
    setPortfolioUrl("");
    setErrors({});
    setIsEditingExisting(false);
  };

  if (!isOpen) return null;

  const currentDomainObj = DOMAIN_OPTIONS.find((d) => d.id === domain);
  const domainConfig = getDomainPortfolioConfig(domain, subTrack);
  const showAlreadyApplied = !submittedApp && !isEditingExisting && !!existingApp;

  return (
    <div
      className={styles.backdrop}
      data-lenis-prevent="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeApplyModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={styles.modal}
        ref={modalRef}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 id="modal-title" className={styles.headerTitle}>
              {submittedApp ? (
                isEditingExisting ? "APPLICATION UPDATED" : "APPLICATION CONFIRMED"
              ) : showAlreadyApplied ? (
                "APPLICATION ALREADY RECEIVED"
              ) : (
                <>
                  JOIN THE <span className={styles.headerAccent}>BUILD.</span>
                </>
              )}
            </h2>
            <p className={styles.headerSub}>
              {submittedApp || showAlreadyApplied
                ? "E-Cell SRMIST Recruitment 2026 Portal"
                : "07 / RECRUITMENT APPLICATION FORM"}
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={closeApplyModal}
              aria-label="Close application form"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        {showAlreadyApplied && existingApp ? (
          <div className={styles.body}>
            <div className={styles.successWrap}>
              <div className={styles.successIconWrap}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className={styles.successTitle}>
                You&apos;ve Already <span className={styles.headerAccent}>Applied.</span>
              </h3>
              <p className={styles.successSub}>
                We found an application already on file for{" "}
                <strong>{activeCandidate?.email}</strong> — tracking ID{" "}
                <strong>{existingApp.id}</strong>, submitted for the{" "}
                <strong>{existingApp.domain}</strong> domain. No need to apply again.
              </p>

              <div className={styles.followSection}>
                <div className={styles.timelineHeading}>Don&apos;t Miss Your Recruitment Tasks</div>
                <p className={styles.followText}>
                  Task drops, deadlines and round updates go out on our Instagram first.
                  Follow @ecell_srmist so you don&apos;t miss yours.
                </p>
                <a
                  href="https://www.instagram.com/ecell_srmist?igsi=cWUwamRkNzl3YnEy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.followLink}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  Follow @ecell_srmist on Instagram
                  <ChevronRight size={12} />
                </a>
              </div>

              <div className={styles.successActions}>
                <button type="button" onClick={startEditingExisting} className="btn-primary">
                  Edit My Application <ChevronRight size={14} />
                </button>
                <button type="button" onClick={closeApplyModal} className={styles.resetBtn}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : checkingExisting ? (
          <div className={styles.body}>
            <p className={styles.followText}>Checking your application status…</p>
          </div>
        ) : !submittedApp ? (
          <form
            onSubmit={handleSubmit}
            className={styles.formWrap}
            noValidate
            data-lenis-prevent="true"
          >
            <div
              className={styles.body}
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
            >
              {/* Google Account Identity Section */}
              <div className={styles.googleAuthCard}>
                {activeCandidate?.email ? (
                  <>
                    <div className={styles.googleAuthLogged}>
                      {activeCandidate.photoURL ? (
                        <img
                          src={activeCandidate.photoURL}
                          alt={activeCandidate.displayName || "Avatar"}
                          className={styles.googleAvatarImg}
                        />
                      ) : (
                        <div className={styles.googleAvatarFallback}>
                          {activeCandidate.displayName
                            ? activeCandidate.displayName.charAt(0).toUpperCase()
                            : "G"}
                        </div>
                      )}
                      <div className={styles.googleAuthInfo}>
                        <div className={styles.googleAuthName}>{activeCandidate.displayName || "Candidate"}</div>
                        <div className={styles.googleAuthEmail}>
                          <Lock size={10} /> {activeCandidate.email}
                        </div>
                      </div>
                    </div>
                    <div className={styles.googleVerifiedBadge}>
                      <ShieldCheck size={11} /> {user ? "Verified Google" : "Signed In"}
                    </div>
                  </>
                ) : !showManualForm ? (
                  <>
                    <div className={styles.googlePromptContent}>
                      <span className={styles.googlePromptTitle}>Google Email Authentication</span>
                      <span className={styles.googlePromptSub}>
                        Sign in with Google — we use your verified name and email, so you don&apos;t need to type them
                      </span>
                    </div>
                    <div className={styles.authBtnStack}>
                      <button
                        type="button"
                        className={styles.modalGoogleBtn}
                        onClick={handleModalGoogleSignIn}
                        disabled={isLoggingIn}
                      >
                        <LogIn size={13} />
                        {isLoggingIn ? "Signing In..." : "Google Sign In"}
                      </button>
                      <button
                        type="button"
                        className={styles.manualToggleBtn}
                        onClick={() => setShowManualForm(true)}
                      >
                        Or enter name & email manually
                      </button>
                    </div>
                  </>
                ) : (
                  // Not a <form>: this sits inside the main application
                  // <form>, and HTML doesn't allow nested forms — the
                  // browser silently restructures the DOM if it is one,
                  // breaking React's hydration. Enter-to-submit is
                  // preserved via onKeyDown on the inputs instead.
                  <div className={styles.manualAuthForm}>
                    <div className={styles.googlePromptContent}>
                      <span className={styles.googlePromptTitle}>Enter Your Details</span>
                      <span className={styles.googlePromptSub}>
                        No Google account? Type your name and email instead.
                      </span>
                    </div>
                    <div className={styles.manualAuthFields}>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleModalManualSignIn(e)}
                        className={styles.manualAuthInput}
                        autoComplete="name"
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleModalManualSignIn(e)}
                        className={styles.manualAuthInput}
                        autoComplete="email"
                      />
                    </div>
                    {manualAuthError && <p className={styles.errorText}>{manualAuthError}</p>}
                    <div className={styles.authBtnStack}>
                      <button
                        type="button"
                        className={styles.modalGoogleBtn}
                        onClick={handleModalManualSignIn}
                        disabled={isManualSigningIn}
                      >
                        {isManualSigningIn ? "Signing In..." : "Continue"}
                      </button>
                      <button
                        type="button"
                        className={styles.manualToggleBtn}
                        onClick={() => {
                          setShowManualForm(false);
                          setManualAuthError(null);
                        }}
                      >
                        Back to Google sign-in
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.auth && <p className={styles.errorText}>{errors.auth}</p>}

              {/* Section 1: Candidate Identity */}
              <div className={styles.formSection}>
                <div className={styles.sectionLabel}>
                  <User size={13} />
                  <span>01 / Candidate Details</span>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="student-regno">
                      <span>
                        Registration No. <span className={styles.required}>*</span>
                      </span>
                    </label>
                    <input
                      id="student-regno"
                      type="text"
                      className={`${styles.input} ${styles.inputMono}`}
                      placeholder="e.g. RA2311003010482"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      required
                    />
                    {errors.regNumber && <p className={styles.errorText}>{errors.regNumber}</p>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="student-phone">
                      <span>
                        WhatsApp / Mobile <span className={styles.required}>*</span>
                      </span>
                    </label>
                    <input
                      id="student-phone"
                      type="tel"
                      className={`${styles.input} ${styles.inputMono}`}
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
                  </div>
                </div>

                <div className={styles.field} style={{ marginTop: 12 }}>
                  <label className={styles.label} htmlFor="student-year">
                    <span>
                      Year of Study <span className={styles.required}>*</span>
                    </span>
                  </label>
                  <select
                    id="student-year"
                    className={styles.select}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2: Domain Choice */}
              <div className={styles.formSection}>
                <div className={styles.sectionLabel}>
                  <Briefcase size={13} />
                  <span>02 / Interested Domain</span>
                </div>

                <div className={styles.domainGrid}>
                  {DOMAIN_OPTIONS.map((d) => {
                    const isSel = domain === d.id;
                    return (
                      <div
                        key={d.id}
                        className={`${styles.domainCard} ${isSel ? styles.domainCardSelected : ""}`}
                        onClick={() => handleDomainChange(d.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") handleDomainChange(d.id);
                        }}
                      >
                        <span className={styles.domainCardTitle}>{d.title}</span>
                        <span className={styles.domainCardDesc}>{d.desc}</span>
                      </div>
                    );
                  })}
                </div>
                {errors.domain && <p className={styles.errorText}>{errors.domain}</p>}

                {/* Sub-track selector */}
                {currentDomainObj && currentDomainObj.subTracks.length > 0 && (
                  <div className={styles.subTrackWrap}>
                    <span className={styles.subTrackLabel}>
                      Select Primary Focus Area ({currentDomainObj.title}):
                    </span>
                    <div className={styles.subTrackChips}>
                      {currentDomainObj.subTracks.map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={`${styles.subChip} ${subTrack === st ? styles.subChipActive : ""}`}
                          onClick={() => setSubTrack(st)}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Domain-Specific Portfolio & Motivation */}
              <div className={styles.formSection}>
                <div className={styles.sectionLabel}>
                  <Layers size={13} />
                  <span>03 / Domain Portfolio & Motivation</span>
                </div>

                {/* Dynamic Domain Guidance Box */}
                <div className={styles.domainHintBox}>
                  <div className={styles.domainHintHeader}>
                    <Sparkles size={13} />
                    <span>Deliverables Guide · {currentDomainObj?.title} ({subTrack})</span>
                  </div>
                  <p className={styles.domainHintText}>{domainConfig.portfolioHint}</p>
                </div>

                {/* Domain Portfolio Link Input */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-portfolio">
                    <span>{domainConfig.portfolioLabel}</span>
                    <span className={styles.optional}>recommended</span>
                  </label>
                  <input
                    id="student-portfolio"
                    type="url"
                    className={styles.input}
                    placeholder={domainConfig.portfolioPlaceholder}
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                  />
                  <span className={styles.helperText}>
                    Provide public links (GitHub, Figma, Behance, LinkedIn, or Google Drive)
                  </span>
                </div>

                {/* Domain Skills / Tools / Experience */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-skills">
                    <span>{domainConfig.skillsLabel}</span>
                    <span className={styles.optional}>optional</span>
                  </label>
                  <input
                    id="student-skills"
                    type="text"
                    className={styles.input}
                    placeholder={domainConfig.skillsPlaceholder}
                    value={skillsOrExperience}
                    onChange={(e) => setSkillsOrExperience(e.target.value)}
                  />
                </div>

                {/* Reason / Motivation */}
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="student-reason">
                    <span>Why do you want to join E-Cell SRMIST?</span>
                    <span className={styles.optional}>optional</span>
                  </label>
                  <textarea
                    id="student-reason"
                    className={styles.textarea}
                    rows={3}
                    placeholder="Tell us about what you want to build, learn, or lead with E-Cell in 2026..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={styles.footer}>
              <div className={styles.securityNote}>
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Cloud Storage Synced · Recruitment 2026</span>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || isLoggingIn || !activeCandidate?.email}
                data-cursor="SUBMIT"
              >
                {isSubmitting ? (
                  <span>RECORDING TO DATABASE...</span>
                ) : isLoggingIn ? (
                  <span>AUTHENTICATING GOOGLE...</span>
                ) : !activeCandidate?.email ? (
                  <span>SIGN IN TO CONTINUE</span>
                ) : (
                  <>
                    <span>SUBMIT APPLICATION</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* SUCCESS CONFIRMATION VIEW */
          <div
            className={styles.body}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className={styles.successWrap}>
              <div className={styles.successIconWrap}>
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 className={styles.successTitle}>
                  YOU&apos;RE IN THE <span className={styles.headerAccent}>SYSTEM.</span>
                </h3>
                <p className={styles.successSub}>
                  Your application for <strong>E-Cell SRMIST Recruitment 2026</strong> has been stored in the persistent database.
                  Save your Tracking ID below for interview call-outs and status updates.
                </p>
              </div>

              {/* Ticket Card */}
              <div className={styles.ticketCard}>
                <div className={styles.ticketTop}>
                  <div>
                    <div className={styles.ticketIdLabel}>Application Tracking ID</div>
                    <div className={styles.ticketIdVal}>
                      <span>{submittedApp.id}</span>
                      <button
                        type="button"
                        onClick={copyTrackingId}
                        className={styles.copyBtn}
                        title="Copy Tracking ID"
                      >
                        {copied ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Check size={12} /> Copied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy size={12} /> Copy
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={styles.ticketBadge}>{submittedApp.domain}</div>
                </div>

                <div className={styles.ticketDetails}>
                  <div className={styles.ticketRow}>
                    <span className={styles.ticketKey}>Candidate</span>
                    <span className={styles.ticketVal}>{submittedApp.fullName}</span>
                  </div>
                  <div className={styles.ticketRow}>
                    <span className={styles.ticketKey}>Reg Number</span>
                    <span className={styles.ticketVal}>{submittedApp.regNumber}</span>
                  </div>
                  <div className={styles.ticketRow}>
                    <span className={styles.ticketKey}>Track</span>
                    <span className={styles.ticketVal}>{submittedApp.subDomain || "General"}</span>
                  </div>
                  <div className={styles.ticketRow}>
                    <span className={styles.ticketKey}>Year of Study</span>
                    <span className={styles.ticketVal}>{submittedApp.year}</span>
                  </div>
                  <div className={styles.ticketRow}>
                    <span className={styles.ticketKey}>Verified Google ID</span>
                    <span className={styles.ticketVal}>{submittedApp.applicantEmail}</span>
                  </div>
                  <div className={styles.ticketRow}>
                    <span className={styles.ticketKey}>Submitted At</span>
                    <span className={styles.ticketVal}>
                      {new Date(submittedApp.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Follow Us */}
              <div className={styles.followSection}>
                <div className={styles.timelineHeading}>Don&apos;t Miss Your Recruitment Tasks</div>
                <p className={styles.followText}>
                  Task drops, deadlines and round updates go out on our Instagram first.
                  Follow @ecell_srmist so you don&apos;t miss yours.
                </p>
                <a
                  href="https://www.instagram.com/ecell_srmist?igsi=cWUwamRkNzl3YnEy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.followLink}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  Follow @ecell_srmist on Instagram
                  <ChevronRight size={12} />
                </a>
              </div>

              {/* Actions */}
              <div className={styles.successActions}>
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="btn-primary"
                >
                  RETURN TO HOME <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={resetForNewApp}
                  className={styles.resetBtn}
                >
                  <RotateCcw size={12} /> Submit Another Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
