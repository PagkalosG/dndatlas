/**
 * Mock service layer. Presentation components NEVER import mock data directly for mutations —
 * they call this interface. The backend team replaces `mockAtlasService` with real HTTP/RPC calls
 * implementing the same `AtlasService` interface.
 */
import type {
  AppNotification, ApprovalRequest, AuditEntry, Campaign, CharacterDraft, JournalEntry, MediaItem, Member,
  Membership, Role, SheetCharacter, SystemHealth, User,
} from '@/types';
import {
  approvals, auditLog, campaigns, journal, media, members, memberships, notifications, pendingDraft, sessions,
  sheetCharacters, systemHealth, users,
} from '@/mock/campaignData';
import { emitMockEvent } from './simulation';
import { readLocal, writeLocal } from './localStore';
import { sheetFromDraft } from '@/engine/sheetAdapter';

export type ServiceError = 'offline' | 'server' | 'conflict' | 'not_found' | 'forbidden';
export type Result<T> = { ok: true; data: T } | { ok: false; error: ServiceError; message: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

// All reads/writes wait for IndexedDB hydration. Never report success before persistence.
async function read<T>(fn: () => T): Promise<Result<T>> {
  try { await ready(); return { ok:true, data:clone(fn()) }; }
  catch (e) { return { ok:false, error:'server', message:String(e) }; }
}
async function write<T>(fn: () => T): Promise<Result<T>> {
  try { await ready(); const result=fn(); await writeLocal('state',db); return { ok:true, data:clone(result) }; }
  catch (e) { return { ok:false, error:'server', message:String(e) }; }
}

export interface AtlasService {
  currentUser(): Promise<Result<User>>;
  listMemberships(): Promise<Result<(Membership & { campaign: Campaign })[]>>;
  createCampaign(input: { name: string; description: string; startingLevel: number; contentSources: string[]; approvalPolicy: string }): Promise<Result<Campaign>>;
  joinByCode(code: string): Promise<Result<Campaign>>;
  listMembers(campaignId: string): Promise<Result<Member[]>>;
  changeMemberRole(campaignId: string, userId: string, role: Role): Promise<Result<Member>>;
  removeMember(campaignId: string, userId: string): Promise<Result<true>>;
  listApprovals(campaignId: string): Promise<Result<ApprovalRequest[]>>;
  decideApproval(id: string, decision: 'approve' | 'request_changes' | 'reject', feedback?: string): Promise<Result<ApprovalRequest>>;
  getPendingDraft(id: string): Promise<Result<CharacterDraft>>;
  listCharacters(campaignId?: string): Promise<Result<SheetCharacter[]>>;
  getCharacter(id: string): Promise<Result<SheetCharacter>>;
  saveCharacter(c: SheetCharacter): Promise<Result<SheetCharacter>>;
  getSavedDraft(campaignId: string): Promise<Result<CharacterDraft | null>>;
  saveDraft(d: CharacterDraft): Promise<Result<CharacterDraft>>;
  submitDraft(d: CharacterDraft): Promise<Result<CharacterDraft>>;
  listNotifications(): Promise<Result<AppNotification[]>>;
  markNotificationRead(id: string): Promise<Result<true>>;
  listJournal(campaignId: string): Promise<Result<JournalEntry[]>>;
  listMedia(campaignId: string): Promise<Result<MediaItem[]>>;
  listSessions(): Promise<Result<typeof sessions>>;
  adminOverview(): Promise<Result<{ users: User[]; campaigns: Campaign[]; audit: AuditEntry[]; health: SystemHealth[] }>>;
}

const db = {
  campaigns: clone(campaigns),
  memberships: clone(memberships),
  members: clone(members),
  approvals: clone(approvals),
  notifications: clone(notifications),
  characters: clone(sheetCharacters),
  drafts: [] as CharacterDraft[],
};

let hydration: Promise<void> | null = null;
function ready(): Promise<void> {
  if (!hydration) hydration=(async()=>{
    const saved=await readLocal<typeof db>('state');
    if (!saved) return;
    db.campaigns=saved.campaigns ?? db.campaigns;
    db.memberships=saved.memberships ?? db.memberships;
    db.members=saved.members ?? db.members;
    db.approvals=saved.approvals ?? db.approvals;
    db.notifications=saved.notifications ?? db.notifications;
    db.characters=saved.characters ?? db.characters;
    db.drafts=saved.drafts ?? db.drafts;
  })();
  return hydration;
}

export const mockAtlasService: AtlasService = {
  currentUser: () => read(() => users[0]),

  listMemberships: () =>
    read(() => db.memberships.map((m) => ({ ...m, campaign: db.campaigns.find((c) => c.id === m.campaignId)! }))),

  async createCampaign(input) {
    emitMockEvent({ type: 'campaign.create', payload: input });
    return write(() => {
      const c: Campaign = {
        id: `c${db.campaigns.length + 1}`, name: input.name, description: input.description, system: 'DND5E_2024', dmName: 'George',
        memberCount: 1, pendingCount: 0, accent: 'gold', inviteCode: `NEW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        startingLevel: input.startingLevel, contentSources: input.contentSources,
      };
      db.campaigns.push(c);
      db.memberships.push({ campaignId: c.id, userId: 'u1', role: 'dm' });
      return c;
    });
  },

  async joinByCode(code) {
    emitMockEvent({ type: 'campaign.join', payload: { inviteCode: code } });
    await ready();
    const c = db.campaigns.find((x) => x.inviteCode === code.trim().toUpperCase());
    if (!c) return { ok: false, error: 'not_found', message: 'No campaign matches that code.' };
    return { ok: true, data: clone(c) };
  },

  listMembers: (campaignId) => read(() => db.members[campaignId] ?? db.members.c1),

  async changeMemberRole(campaignId, userId, role) {
    emitMockEvent({ type: 'member.role.change', payload: { campaignId, userId, role } });
    return write(() => {
      const m = (db.members[campaignId] ?? db.members.c1).find((x) => x.userId === userId)!;
      m.role = role;
      return m;
    });
  },

  async removeMember(campaignId, userId) {
    emitMockEvent({ type: 'member.remove', payload: { campaignId, userId } });
    return write(() => {
      const list = db.members[campaignId] ?? db.members.c1;
      const i = list.findIndex((x) => x.userId === userId);
      if (i >= 0) list.splice(i, 1);
      return true as const;
    });
  },

  listApprovals: (campaignId) => read(() => db.approvals.filter(a => db.drafts.some(d => d.id===a.characterId && d.campaignId===campaignId) || a.id.startsWith('ar'))),

  async decideApproval(id, decision, feedback) {
    emitMockEvent({ type: 'character.approval.decide', payload: { requestId: id, decision, feedback } });
    return write(() => {
      const a = db.approvals.find((x) => x.id === id)!;
      if (!a || a.status!=='pending') throw Error('Approval is already resolved');
      a.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'changes_requested';
      const draft=db.drafts.find(d=>d.id===a.characterId);
      if(draft) {
        draft.status=a.status; draft.dmFeedback=feedback; draft.version+=1;
        if(a.status==='approved') {
          const sheet=sheetFromDraft(draft);
          const existing=db.characters.findIndex(c=>c.id===sheet.id);
          if(existing<0)db.characters.push(sheet);else db.characters[existing]=sheet;
        }
      }
      return a;
    });
  },

  getPendingDraft: (id) => read(() => db.drafts.find(d=>d.id===id) ?? pendingDraft),
  listCharacters: (campaignId) => read(() => db.characters.filter((c) => !campaignId || c.campaignId === campaignId)),

  async getCharacter(id) {
    const r = await read(() => db.characters.find((c) => c.id === id));
    if (!r.ok) return r;
    return r.data ? { ok: true, data: r.data } : { ok: false, error: 'not_found', message: 'Character not found.' };
  },

  async saveCharacter(c) {
    emitMockEvent({ type: 'character.sheet.save', payload: { characterId: c.id, fields: ['sheet'] } });
    return write(() => {
      const i = db.characters.findIndex((x) => x.id === c.id);
      if (i >= 0) db.characters[i] = c;
      return c;
    });
  },

  getSavedDraft: (campaignId) => read(() => db.drafts.find(d => d.campaignId === campaignId && d.id.startsWith('local-')) ?? null),

  async saveDraft(d) {
    emitMockEvent({ type:'character.draft.save', payload:{draftId:d.id,version:d.version} });
    return write(() => {
      const next={...d,version:d.version+1,updatedAt:new Date().toISOString()};
      const index=db.drafts.findIndex(x=>x.id===d.id);
      if(index<0)db.drafts.push(next);else db.drafts[index]=next;
      return next;
    });
  },

  async submitDraft(d) {
    emitMockEvent({ type:'character.submit',payload:{draftId:d.id} });
    return write(() => {
      const next:CharacterDraft={...d,status:'pending',version:d.version+1,updatedAt:new Date().toISOString()};
      const idx=db.drafts.findIndex(x=>x.id===d.id);
      if(idx<0)db.drafts.push(next);else db.drafts[idx]=next;
      if(!db.approvals.some(a=>a.characterId===d.id&&a.status==='pending')) {
        db.approvals.push({id:`local-approval-${d.id}`,characterId:d.id,characterName:d.name,playerName:'Demo Player',
          kind:'new_character',summary:{en:'New 2024 character awaiting DM review',el:'Νέος χαρακτήρας 2024 προς έγκριση DM'},
          submittedAt:new Date().toISOString(),status:'pending'});
      }
      return next;
    });
  },

  listNotifications: () => read(() => db.notifications),

  async markNotificationRead(id) {
    emitMockEvent({ type: 'notification.read', payload: { id } });
    return write(() => {
      const n = db.notifications.find((x) => x.id === id);
      if (n) n.read = true;
      return true as const;
    });
  },

  listJournal: () => read(() => journal),
  listMedia: () => read(() => media),
  listSessions: () => read(() => sessions),
  adminOverview: () => read(() => ({ users, campaigns: db.campaigns, audit: auditLog, health: systemHealth })),
};
