import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useLiveMembers } from './data/members';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { NodesPage } from './pages/NodesPage';
import { SealPage } from './pages/SealPage';
import { ApplyPage } from './pages/ApplyPage';
import { ManifestoPage } from './pages/ManifestoPage';
import { GoPage } from './pages/GoPage';
import { OwnerOrchestratorModal } from './components/OwnerOrchestratorModal';
import { OwnerPasscodeModal } from './components/OwnerPasscodeModal';
import { sound } from './utils/audio';
import confetti from 'canvas-confetti';

export default function App() {
  const liveMembers = useLiveMembers();
  const verifiedCount = liveMembers.filter(m => m.verified).length;
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Global "owner" keyboard trigger listener
  useEffect(() => {
    let keyBuffer: string[] = [];
    const targetSequence = ['o', 'w', 'n', 'e', 'r'];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes when focused in an input, textarea or contenteditable element
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
        // Open Passcode Modal to verify founder passcode 918542
        setIsPasscodeModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Listen for manual trigger events from Navbar
    const handleOpenModal = () => setIsOwnerModalOpen(true);
    window.addEventListener('unc_open_owner_modal', handleOpenModal);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('unc_open_owner_modal', handleOpenModal);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
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
            confetti({
              particleCount: 65,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#ffffff', '#a1a1aa', '#71717a'],
            });
          }}
        />

        {/* Global Founder Orchestrator Modal */}
        <OwnerOrchestratorModal
          isOpen={isOwnerModalOpen}
          onClose={() => setIsOwnerModalOpen(false)}
        />

        {/* Multipage Routing Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/nodes" element={<NodesPage />} />
            <Route path="/members" element={<NodesPage />} />
            <Route path="/seal" element={<SealPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/manifesto" element={<ManifestoPage />} />
            <Route path="/go" element={<GoPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>

        {/* Minimal Vercel Dark Footer */}
        <footer className="w-full border-t border-white/[0.08] bg-black py-10 mt-16 text-xs font-mono text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <div className="text-zinc-200 font-semibold tracking-wider uppercase">
                The Uncommons Webring
              </div>
              <div className="text-zinc-400">
                A private sovereign network for rare intellects &bull; Est. MMXXVI
              </div>
            </div>

            <div className="flex items-center gap-6 text-zinc-400">
              <Link to="/" className="hover:text-white transition-colors">
                The Ring
              </Link>
              <Link to="/nodes" className="hover:text-white transition-colors">
                Nodes
              </Link>
              <Link to="/manifesto" className="hover:text-white transition-colors">
                Manifesto
              </Link>
              <Link to="/seal" className="hover:text-white transition-colors">
                The Seal
              </Link>
              <Link to="/apply" className="hover:text-white transition-colors">
                Apply via Discord
              </Link>
            </div>

            <div className="flex items-center gap-3 text-zinc-400">
              <a
                href="https://github.com/carbonthecoder/The-Uncommons-webring"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </a>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-400">HASH: 0x9f7a...3c21</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
