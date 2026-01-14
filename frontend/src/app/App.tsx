// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { SignIn } from "./components/auth/SignIn";
import { SignUp } from "./components/auth/SignUp";
import { ClientSignIn } from "./components/auth/ClientSignIn";
import { FounderDashboard } from "./components/dashboard/FounderDashboard";
import { ManagerDashboard } from "./components/dashboard/ManagerDashboard";
import { EmptyDashboard } from "./components/dashboard/EmptyDashboard";
import { CommitmentsList } from "./components/commitment/CommitmentsList";
import { CreateCommitmentWizard } from "./components/commitment/CreateCommitmentWizard";
import { CommitmentDetailView } from "./components/commitment/CommitmentDetailView";
import { ClientsList } from "./components/clients/ClientsList";
import { ClientDetail } from "./components/clients/ClientDetail";
import { ReportsLayoutResponsive } from "./components/reports/ReportsLayoutResponsive";
import { RevenueRiskReportEnhanced } from "./components/reports/RevenueRiskReportEnhanced";
import { AgingReport } from "./components/reports/AgingReport";
import { ClientBehaviorReport } from "./components/reports/ClientBehaviorReport";
import { ReportDetailView } from "./components/reports/ReportDetailView";
import { InviteTeam } from "./components/auth/InviteTeam";
import { ApprovalView } from "./components/ApprovalView";
import { ApprovedConfirmation } from "./components/ApprovedConfirmation";
import { ChangeRequest } from "./components/ChangeRequest";
import { ProofView } from "./components/ProofView";
import { ResponsiveAppLayout } from "./components/design-system/ResponsiveAppLayout";
import { SettingsLayout } from "./components/settings/SettingsLayout";
import { ProfilePage } from "./components/profile/ProfilePage";
import { OrganizationSettings } from "./components/settings/OrganizationSettings";
import { RolesAccess } from "./components/settings/RolesAccess";
import { ActivityLog } from "./components/settings/ActivityLog";
import { MastersSettings } from "./components/settings/MastersSettings";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { ClientApprovalView } from "./components/client/ClientApprovalView";
import { ClientAcceptanceView } from "./components/client/ClientAcceptanceView";
import { ClientHistoryView } from "./components/client/ClientHistoryView";
import { Toast } from "./components/shared/Toast";
import { AnimatePresence, PageTransition } from "./components/ui/animations";

import * as authApi from "../api/auth";
import { getToken } from "../api/http";

// Note: public APIs

// Note: public pages
import { AcceptanceView } from "./components/AcceptanceView";

type View =
  | "sign-in"
  | "sign-up"
  | "client-sign-in"
  | "dashboard"
  | "empty-dashboard"
  | "commitments-list"
  | "create-commitment"
  | "commitment-detail"
  | "clients-list"
  | "client-detail"
  | "report-detail"
  | "invite-team"
  | "approved"
  | "change-request"
  | "proof-view"
  | "reports"
  | "profile"
  | "settings"
  | "client-dashboard"
  | "client-approvals"
  | "client-approval-detail"
  | "client-acceptance"
  | "client-acceptance-detail"
  | "client-history";

type UserRole = "founder" | "manager" | "client";

const LS = {
  AUTH: "noolix.auth",
  NAV: "noolix.nav",
} as const;

type PersistedAuth = {
  isAuthenticated: boolean;
  userEmail: string;
  userRole: UserRole;
};

type PersistedNav = {
  currentView: View;
  selectedClientId: string | null;
  selectedCommitmentId: string | null;
  activeReport: "revenue-risk" | "aging" | "client-behavior";
  activeSettingsTab: "organization" | "roles" | "activity" | "masters";
};

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Note: Reads /approve/:token and /accept/:token (also supports hash routes) */
function readPublicTokenFromLocation(): { kind: "approve" | "accept"; token: string } | null {
  try {
    const url = new URL(window.location.href);

    const path = url.pathname || "";
    const hash = (url.hash || "").replace(/^#/, "");

    const candidates = [path, hash];

    for (const p of candidates) {
      const m1 = p.match(/^\/approve\/([^/]+)$/);
      if (m1?.[1]) return { kind: "approve", token: m1[1] };

      const m2 = p.match(/^\/accept\/([^/]+)$/);
      if (m2?.[1]) return { kind: "accept", token: m2[1] };
    }

    return null;
  } catch {
    return null;
  }
}

function PublicApprovalApp({ token }: { token: string }) {
  const [done, setDone] = useState<null | "approved" | "change-request">(null);
  const [approvalPayload, setApprovalPayload] = useState<any>(null);

  if (done === "approved")
    return (
      <ApprovedConfirmation
        variant="approved"
        commitment={approvalPayload?.commitment}
        client={approvalPayload?.client}
        approvedAt={approvalPayload?.approvedAt}
        confirmationId={approvalPayload?.confirmationId}
      />
    );
  if (done === "change-request") return <ChangeRequest onBack={() => window.location.reload()} />;

  return (
    <ApprovalView
      token={token}
      onApproved={(payload) => {
        setApprovalPayload(payload);
        setDone("approved");
      }}
      onChangeRequested={() => setDone("change-request")}
    />
  );
}

function PublicAcceptanceApp({ token }: { token: string }) {
  const [done, setDone] = useState<null | "accepted" | "fix-requested">(null);
  const [acceptPayload, setAcceptPayload] = useState<any>(null);

  if (done === "accepted")
    return (
      <ApprovedConfirmation
        variant="accepted"
        commitment={acceptPayload?.commitment}
        client={acceptPayload?.client}
        approvedAt={acceptPayload?.acceptedAt}
        confirmationId={acceptPayload?.confirmationId}
      />
    );
  if (done === "fix-requested") return <ChangeRequest onBack={() => window.location.reload()} />;

  return (
    <AcceptanceView
      token={token}
      onAccepted={(payload) => {
        setAcceptPayload(payload);
        setDone("accepted");
      }}
      onFixRequested={() => setDone("fix-requested")}
    />
  );
}

export default function App() {
  // Note: PUBLIC route override (no auth, no ResponsiveAppLayout)
  const publicRoute = useMemo(() => readPublicTokenFromLocation(), []);
  if (publicRoute?.kind === "approve") return <PublicApprovalApp token={publicRoute.token} />;
  if (publicRoute?.kind === "accept") return <PublicAcceptanceApp token={publicRoute.token} />;

  const [currentView, setCurrentView] = useState<View>("sign-in");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("founder");
  const [hasCommitments] = useState(true);

  const [activeReport, setActiveReport] = useState<"revenue-risk" | "aging" | "client-behavior">("revenue-risk");
  const [activeSettingsTab, setActiveSettingsTab] = useState<"organization" | "roles" | "activity" | "masters">(
    "organization"
  );

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedCommitmentId, setSelectedCommitmentId] = useState<string | null>(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Note: Restore auth/nav immediately (prevents sidebar/user menu disappearing + refresh -> login)
  useEffect(() => {
    const persistedAuth = safeParseJSON<PersistedAuth>(localStorage.getItem(LS.AUTH));
    const persistedNav = safeParseJSON<PersistedNav>(localStorage.getItem(LS.NAV));

    // 1) optimistic restore
    const hasStoredToken = Boolean(localStorage.getItem("token") || localStorage.getItem("accessToken"));
    const hasHttpToken = Boolean(getToken());
    const hasAnyToken = hasStoredToken || hasHttpToken;

    if (persistedAuth?.isAuthenticated || hasAnyToken) {
      setIsAuthenticated(true);

      // IMPORTANT: keep email/role from LS so UserMenu shows immediately
      setUserEmail(persistedAuth?.userEmail || "");
      setUserRole(persistedAuth?.userRole || "founder");

      if (persistedNav) {
        setCurrentView(persistedNav.currentView || "dashboard");
        setSelectedClientId(persistedNav.selectedClientId ?? null);
        setSelectedCommitmentId(persistedNav.selectedCommitmentId ?? null);
        setActiveReport(persistedNav.activeReport || "revenue-risk");
        setActiveSettingsTab(persistedNav.activeSettingsTab || "organization");
      } else {
        setCurrentView(hasCommitments ? "dashboard" : "empty-dashboard");
      }
    } else {
      setIsAuthenticated(false);
      setCurrentView("sign-in");
    }

    setIsBootstrapping(false);

    // 2) background validation (does NOT kick to login unless truly unauthorized)
    (async () => {
      try {
        if (typeof authApi.me !== "function") return;
        const me = await authApi.me();

        const roleRaw = String(me?.user?.role || me?.role || "").toUpperCase();
        const mappedRole: UserRole =
          roleRaw === "CLIENT" ? "client" : roleRaw === "MANAGER" ? "manager" : "founder";

        const email = String(me?.user?.email || me?.email || persistedAuth?.userEmail || "");

        setIsAuthenticated(true);
        setUserRole(mappedRole);
        if (email) setUserEmail(email);
      } catch (e: any) {
        // If API explicitly says unauthorized, then logout.
        const status = e?.status ?? e?.response?.status;
        if (status === 401 || status === 403) {
          try {
            localStorage.removeItem(LS.AUTH);
            localStorage.removeItem(LS.NAV);
          } catch {}
          setIsAuthenticated(false);
          setUserEmail("");
          setUserRole("founder");
          setCurrentView("sign-in");
          setSelectedClientId(null);
          setSelectedCommitmentId(null);
        }
        // otherwise: keep user in app (avoid refresh -> login for transient errors)
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist auth
  useEffect(() => {
    const payload: PersistedAuth = { isAuthenticated, userEmail, userRole };
    try {
      localStorage.setItem(LS.AUTH, JSON.stringify(payload));
    } catch {}
  }, [isAuthenticated, userEmail, userRole]);

  // persist nav
  useEffect(() => {
    const payload: PersistedNav = {
      currentView,
      selectedClientId,
      selectedCommitmentId,
      activeReport,
      activeSettingsTab,
    };
    try {
      localStorage.setItem(LS.NAV, JSON.stringify(payload));
    } catch {}
  }, [currentView, selectedClientId, selectedCommitmentId, activeReport, activeSettingsTab]);

  const handleSignIn = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUserEmail(email);

    const r = (res?.user?.role || "").toUpperCase();
    const mappedRole: UserRole = r === "MANAGER" ? "manager" : "founder";
    setUserRole(mappedRole);

    setIsAuthenticated(true);
    setCurrentView(hasCommitments ? "dashboard" : "empty-dashboard");
  };

  const handleClientSignIn = (email: string, accessCode: string) => {
    setUserEmail(email);
    setUserRole("client");
    setIsAuthenticated(true);
    setCurrentView("client-dashboard");
  };

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUserEmail("");
    setUserRole("founder");
    setCurrentView("sign-in");
    setSelectedClientId(null);
    setSelectedCommitmentId(null);
    try {
      localStorage.removeItem(LS.AUTH);
      localStorage.removeItem(LS.NAV);
    } catch {}
  };

  const handleSignUp = (companyName: string, email: string, password: string) => {
    console.log("Sign up:", companyName, email, password);
    setUserEmail(email);
    setUserRole("founder");
    setIsAuthenticated(true);
    setCurrentView("empty-dashboard");
  };

  const handleNavigate = (view: string) => {
    switch (view) {
      case "dashboard":
        setCurrentView(userRole === "client" ? "client-dashboard" : hasCommitments ? "dashboard" : "empty-dashboard");
        break;
      case "client-dashboard":
        setCurrentView("client-dashboard");
        break;
      case "client-approvals":
        setCurrentView("client-approvals");
        break;
      case "client-acceptance":
        setCurrentView("client-acceptance");
        break;
      case "client-history":
        setCurrentView("client-history");
        break;
      case "commitments":
        setCurrentView(hasCommitments ? "commitments-list" : "empty-dashboard");
        break;
      case "clients":
        setSelectedClientId(null);
        setCurrentView("clients-list");
        break;
      case "reports":
        setCurrentView("reports");
        setActiveReport("revenue-risk");
        break;
      case "profile":
        setCurrentView("profile");
        break;
      case "settings":
        setCurrentView("settings");
        setActiveSettingsTab(userRole === "founder" ? "organization" : "activity");
        break;
      default:
        setCurrentView(userRole === "client" ? "client-dashboard" : "dashboard");
    }
  };

  const effectiveAuthenticated = useMemo(() => isAuthenticated, [isAuthenticated]);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-slate-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Unauthenticated
  if (!effectiveAuthenticated) {
    if (currentView === "sign-up") return <SignUp onSignUp={handleSignUp} onNavigateToSignIn={() => setCurrentView("sign-in")} />;
    if (currentView === "client-sign-in") return <ClientSignIn onSignIn={handleClientSignIn} onNavigateToSignIn={() => setCurrentView("sign-in")} />;
    return <SignIn onSignIn={handleSignIn} onNavigateToSignUp={() => setCurrentView("sign-up")} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return userRole === "founder" ? (
          <FounderDashboard
            onCreateNew={() => setCurrentView("create-commitment")}
            onViewCommitment={(id) => {
              setSelectedCommitmentId(id);
              setCurrentView("commitment-detail");
            }}
            onViewAllCommitments={() => setCurrentView("commitments-list")}
            onViewReports={() => setCurrentView("reports")}
          />
        ) : (
          <ManagerDashboard
            onCreateNew={() => setCurrentView("create-commitment")}
            onViewCommitment={(id) => {
              setSelectedCommitmentId(id);
              setCurrentView("commitment-detail");
            }}
            onViewAllCommitments={() => setCurrentView("commitments-list")}
          />
        );

      case "commitments-list":
        return (
          <CommitmentsList
            onCreateNew={() => setCurrentView("create-commitment")}
            onViewCommitment={(id) => {
              setSelectedCommitmentId(id);
              setCurrentView("commitment-detail");
            }}
            userRole={userRole}
          />
        );

      case "empty-dashboard":
        return <EmptyDashboard onCreateNew={() => setCurrentView("create-commitment")} />;

      case "create-commitment":
        return <CreateCommitmentWizard onBack={() => setCurrentView("commitments-list")} onComplete={() => setCurrentView("commitments-list")} />;

      case "commitment-detail":
        return <CommitmentDetailView onBack={() => setCurrentView("commitments-list")} userRole={userRole} commitmentId={selectedCommitmentId ?? undefined} />;

      case "invite-team":
        return <InviteTeam onBack={() => setCurrentView("settings")} onInvite={() => setCurrentView("settings")} />;

      case "approved":
        return <ApprovedConfirmation />;

      case "change-request":
        return <ChangeRequest onBack={() => setCurrentView("commitments-list")} />;

      case "proof-view":
        return <ProofView onBack={() => setCurrentView("commitments-list")} />;

      case "reports":
        return (
          <ReportsLayoutResponsive activeReport={activeReport} onReportChange={setActiveReport} userRole={userRole}>
            {activeReport === "revenue-risk" && <RevenueRiskReportEnhanced userRole={userRole} />}
            {activeReport === "aging" && <AgingReport userRole={userRole} />}
            {activeReport === "client-behavior" && <ClientBehaviorReport />}
          </ReportsLayoutResponsive>
        );

      case "report-detail":
        return (
          <ReportDetailView
            reportType="revenue-risk"
            onBack={() => setCurrentView("reports")}
            onViewCommitment={(id) => {
              setSelectedCommitmentId(id);
              setCurrentView("commitment-detail");
            }}
            userRole={userRole}
          />
        );

      case "clients-list":
        return (
          <ClientsList
            onViewClient={(id) => {
              setSelectedClientId(id);
              setCurrentView("client-detail");
            }}
            onCreateClient={() => console.log("Create client")}
            userRole={userRole}
          />
        );

      case "client-detail":
        return (
          <ClientDetail
            onBack={() => setCurrentView("clients-list")}
            onViewCommitment={(id) => {
              setSelectedCommitmentId(id);
              setCurrentView("commitment-detail");
            }}
            userRole={userRole}
            clientId={selectedClientId ?? undefined}
          />
        );

      case "profile":
        return <ProfilePage userEmail={userEmail} userRole={userRole} onLogout={handleLogout} onBack={() => setCurrentView("dashboard")} />;

      case "settings":
        return (
          <SettingsLayout activeTab={activeSettingsTab} onTabChange={setActiveSettingsTab} userRole={userRole}>
            {activeSettingsTab === "organization" && <OrganizationSettings />}
            {activeSettingsTab === "roles" && <RolesAccess />}
            {activeSettingsTab === "activity" && <ActivityLog />}
            {activeSettingsTab === "masters" && <MastersSettings userRole={userRole} />}
          </SettingsLayout>
        );

      case "client-dashboard":
        return (
          <ClientDashboard
            onViewApproval={() => setCurrentView("client-approval-detail")}
            onViewAcceptance={() => setCurrentView("client-acceptance-detail")}
            onViewHistory={() => setCurrentView("client-history")}
          />
        );

      case "client-approvals":
      case "client-approval-detail":
        return (
          <ClientApprovalView
            onBack={() => setCurrentView("client-dashboard")}
            onApprove={() => setCurrentView("client-dashboard")}
            onRequestChange={() => setCurrentView("client-dashboard")}
          />
        );

      case "client-acceptance":
      case "client-acceptance-detail":
        return (
          <ClientAcceptanceView
            onBack={() => setCurrentView("client-dashboard")}
            onAccept={() => setCurrentView("client-dashboard")}
            onRequestFix={() => setCurrentView("client-dashboard")}
          />
        );

      case "client-history":
        return <ClientHistoryView onBack={() => setCurrentView("client-dashboard")} onViewDetail={() => setCurrentView("client-approval-detail")} />;

      default:
        return (
          <CommitmentsList
            onCreateNew={() => setCurrentView("create-commitment")}
            onViewCommitment={(id) => {
              setSelectedCommitmentId(id);
              setCurrentView("commitment-detail");
            }}
            userRole={userRole}
          />
        );
    }
  };

  return (
    <ResponsiveAppLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      userEmail={userEmail}      // Note: ensures sidebar shows user area
      userRole={userRole}
      onLogout={handleLogout}    // Note: ensures profile/logout show
    >
      <Toast />
      <AnimatePresence>
        <PageTransition>{renderContent()}</PageTransition>
      </AnimatePresence>
    </ResponsiveAppLayout>
  );
}
