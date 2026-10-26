import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useLiveMembers } from './data/members';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ForgePage } from './pages/ForgePage';
import { WidgetPage } from './pages/WidgetPage';
import { MembersJsonPage } from './pages/MembersJsonPage';
import { GoPage } from './pages/GoPage';
import { OwnerOrchestratorModal } from './components/OwnerOrchestratorModal';
import { OwnerPasscodeModal } from './components/OwnerPasscodeModal';
import { sound } from './utils/audio';

export default function App() {
  const liveMembers = useLiveMembers();
  const verifiedCount = liveMembers.filter(
    (m) => m.verified && m.domain && !m.domain.includes('unclaimed') && m.handle !== 'vacant'
  ).length;

  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  // 4-tap trigger on footer key indicator
  const handleFooterHashClick = () => {
    const now = Date.now();
    sound.playClick();
    if (now - lastTapTime > 2500) {
      setTapCount(1);
    } else {
      const nextCount = tapCount + 1;
      if (nextCount >= 4) {
        setTapCount(0);
        setIsPasscodeModalOpen(true);
        sound.playHarmonic();
      } else {
        setTapCount(nextCount);
      }
    }
    setLastTapTime(now);
  };

  // Keyboard "owner" secret sequence listener
  useEffect(() => {
    let keyBuffer: string[] = [];
    const targetSequence = ['o', 'w', 'n', 'e', 'r'];

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      keyBuffer.push(key);
      if (keyBuffer.length > targetSequence.length) {
        keyBuffer.shift();
      }

      if (keyBuffer.join('') === 'owner') {
        keyBuffer = [];
        setIsPasscodeModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const handleOpenModal = () => setIsOwnerModalOpen(true);
    window.addEventListener('unc_open_owner_modal', handleOpenModal);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('unc_open_owner_modal', handleOpenModal);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#121110] text-[#f5f0e8] flex flex-col font-sans selection:bg-[#2b2723] selection:text-[#fbf9f5]">
        {/* Top Navbar */}
        <Navbar nodeCount={verifiedCount} />

        {/* Owner Passcode Verification Modal */}
        <OwnerPasscodeModal
          isOpen={isPasscodeModalOpen}
          onClose={() => setIsPasscodeModalOpen(false)}
          onSuccess={() => {
            setIsPasscodeModalOpen(false);
            setIsOwnerModalOpen(true);
            sound.playOwnerChime();
          }}
        />

        {/* Global Founder Orchestrator Modal */}
        <OwnerOrchestratorModal
          isOpen={isOwnerModalOpen}
          onClose={() => setIsOwnerModalOpen(false)}
        />

        {/* Core Content Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/forge" element={<ForgePage />} />
            <Route path="/widget" element={<WidgetPage />} />
            <Route path="/members" element={<MembersJsonPage />} />
            <Route path="/nodes" element={<HomePage />} />
            <Route path="/next/:handle" element={<GoPage forcedAction="next" />} />
            <Route path="/prev/:handle" element={<GoPage forcedAction="prev" />} />
            <Route path="/rand" element={<GoPage forcedAction="rand" />} />
            <Route path="/go" element={<GoPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        {/* Global Classy Footer */}
        <footer className="w-full border-t border-white/[0.08] bg-[#121110] py-12 mt-20 text-xs font-mono text-[#8c8376]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/[0.06] pb-8">
              <div className="space-y-1">
                <div className="font-serif text-base text-[#fbf9f5] font-normal tracking-wide">
                  The Uncommons
                </div>
                <div className="text-xs text-[#8c8376]">
                  Connecting the web&apos;s rarest minds &amp; personal domains &bull; Est. 2026
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs">
                <Link to="/" className="text-[#a8a199] hover:text-[#fbf9f5] transition-colors">
                  The Ring
                </Link>
                <Link to="/forge" className="text-[#a8a199] hover:text-amber-400 transition-colors">
                  Sovereign Git
                </Link>
                <Link to="/widget" className="text-[#a8a199] hover:text-[#fbf9f5] transition-colors">
                  Widget Guide
                </Link>
                <Link to="/members" className="text-[#a8a199] hover:text-[#fbf9f5] transition-colors">
                  Members JSON
                </Link>
                <a
                  href="https://git.carbon.is-a.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-500/90 hover:text-amber-400 transition-colors"
                >
                  git.carbon.is-a.dev &rarr;
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6d665b]">
              <div>
                Curated by Carbon. Hosted on personal hardware. Zero telemetry, zero tracking cookies, zero surveillance.
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://carbon.is-a.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#a8a199] transition-colors"
                >
                  carbon.is-a.dev
                </a>
                <span>&bull;</span>
                <span
                  onClick={handleFooterHashClick}
                  className="hover:text-amber-400 cursor-pointer select-none transition-colors"
                  title="Founder Access"
                >
                  0x9f7a...3c21
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}