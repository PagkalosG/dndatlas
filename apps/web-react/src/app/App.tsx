import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import CampaignSelector from '@/features/campaigns/CampaignSelector';
import CampaignWizard from '@/features/campaigns/CampaignWizard';
import JoinFlow from '@/features/campaigns/JoinFlow';
import CampaignHome from '@/features/campaigns/CampaignHome';
import Party from '@/features/campaigns/Party';
import CharacterBuilder from '@/features/builder/CharacterBuilder';
import CharacterSheet from '@/features/sheet/CharacterSheet';
import { JournalPanel, GalleryPanel } from '@/features/sheet/panels';
import Approvals from '@/features/dm/Approvals';
import Notifications from '@/features/dm/Notifications';
import SuperadminDashboard from '@/features/dm/SuperadminDashboard';
import { useParams } from 'react-router-dom';
import Catalog from '@/features/misc/Catalog';
import { Future, Profile } from '@/features/misc/FutureAndProfile';

const Journal = () => <JournalPanel campaignId={useParams().campaignId ?? 'c1'} />;
const Gallery = () => <GalleryPanel campaignId={useParams().campaignId ?? 'c1'} />;

/** Route map — mirrored in UI-INTEGRATION-CONTRACT.md. */
export function App() {
  // Demo mode: no authentication or account barrier.
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/campaigns" replace />} />
      <Route path="/join/:code?" element={<AppShell />}>
        <Route index element={<JoinFlow />} />
      </Route>
      <Route element={<AppShell />}>
        <Route path="/campaigns" element={<CampaignSelector />} />
        <Route path="/campaigns/new" element={<CampaignWizard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/admin" element={<SuperadminDashboard />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/future" element={<Future />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/c/:campaignId" element={<CampaignHome />} />
        <Route path="/c/:campaignId/party" element={<Party />} />
        <Route path="/c/:campaignId/approvals" element={<Approvals />} />
        <Route path="/c/:campaignId/journal" element={<Journal />} />
        <Route path="/c/:campaignId/gallery" element={<Gallery />} />
        <Route path="/c/:campaignId/characters/new" element={<CharacterBuilder />} />
        <Route path="/c/:campaignId/characters/:characterId" element={<CharacterSheet />} />
      </Route>
      <Route path="*" element={<Navigate to="/campaigns" replace />} />
    </Routes>
  );
}
