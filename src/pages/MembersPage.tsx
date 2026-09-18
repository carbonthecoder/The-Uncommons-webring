import React, { useState } from 'react';
import { MEMBERS } from '../data/members';
import type { Member } from '../data/members';
import { DossierDirectory } from '../components/DossierDirectory';
import { MemberDossierModal } from '../components/MemberDossierModal';

export const MembersPage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  return (
    <div className="space-y-6">
      <DossierDirectory
        members={MEMBERS}
        onSelectMember={setSelectedMember}
      />

      <MemberDossierModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onNavigate={(newMember) => setSelectedMember(newMember)}
      />
    </div>
  );
};
