import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Campaign, Membership, Role, User } from '@/types';
import { users } from '@/mock/campaignData';
import { mockAtlasService } from '@/services/atlasService';
import { emitMockEvent } from '@/services/simulation';

interface AppStateValue {
  user?: User;
  loggedIn: boolean;
  login: (provider: 'google' | 'email', email?: string) => Promise<void>;
  logout: () => void;
  memberships: (Membership & { campaign: Campaign })[];
  refreshMemberships: () => Promise<void>;
  /** Effective role in a campaign (honours the prototype role-preview override). */
  roleIn: (campaignId?: string) => Role | undefined;
  rolePreview?: Role;
  setRolePreview: (r?: Role) => void;
  isSuperadmin: boolean;
}

const Ctx = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => users[0]);
  const [loggedIn] = useState(true); // No authentication until the prototype is finalized.
  const [memberships, setMemberships] = useState<(Membership & { campaign: Campaign })[]>([]);
  const [rolePreview, setRolePreview] = useState<Role>(() => {try {return sessionStorage.getItem('atlas.demo.role') === 'dm' ? 'dm' : 'player';} catch {return 'player';} });

  const refreshMemberships = useCallback(async () => {
    const r = await mockAtlasService.listMemberships();
    if (r.ok) setMemberships(r.data);
  }, []);

  useEffect(() => {
    mockAtlasService.currentUser().then((r) => r.ok && setUser(r.data));
    refreshMemberships();
  }, [loggedIn, refreshMemberships]);

  // These are intentionally inert while the app runs in local Player/DM demo mode.
  const login = useCallback(async (_provider: 'google' | 'email', _email?: string) => {}, []);
  const logout = useCallback(() => {}, []);
  const changeRole = useCallback((role?: Role) => {
    const next = role === 'dm' ? 'dm' : 'player';
    try { sessionStorage.setItem('atlas.demo.role', next); } catch { /* unavailable */ }
    setRolePreview(next);
  }, []);

  const roleIn = useCallback((campaignId?: string): Role | undefined => {
    if (!campaignId) return undefined;
    if (rolePreview) return rolePreview;
    return memberships.find((m) => m.campaignId === campaignId)?.role;
  }, [memberships, rolePreview]);

  const value = useMemo(() => ({ user, loggedIn, login, logout, memberships, refreshMemberships, roleIn, rolePreview, setRolePreview: changeRole, isSuperadmin: false }), [user, loggedIn, login, logout, memberships, refreshMemberships, roleIn, rolePreview, changeRole]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppStateValue {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside <AppStateProvider>');
  return c;
}

/** Permission helpers — UI gating only; the backend must enforce the same rules. */
export const can = {
  manageCampaign: (r?: Role) => r === 'dm' || r === 'co_dm' || r === 'superadmin',
  approveCharacters: (r?: Role) => r === 'dm' || r === 'co_dm' || r === 'superadmin',
  changeRoles: (r?: Role) => r === 'dm' || r === 'superadmin',
  editOwnCharacter: (r?: Role) => r === 'player' || r === 'dm' || r === 'co_dm' || r === 'superadmin',
  participate: (r?: Role) => !!r && r !== 'pending',
};
