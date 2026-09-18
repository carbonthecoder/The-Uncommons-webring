import React from 'react';
import { Link } from 'react-router-dom';
import { sound } from '../utils/audio';
import { Sparkles, Heart, Globe, ArrowRight, Compass } from 'lucide-react';

export const ManifestoPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10 py-4 px-2 sm:px-4">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>A LETTER TO THE CRAFTSPEOPLE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-mono font-bold text-white tracking-tight break-words">
          The Magic of the Sovereign Web
        </h1>
        <p className="text-sm sm:text-base font-sans text-zinc-400 leading-relaxed max-w-2xl">
          A love letter to independent builders, late-night researchers, and the quiet geniuses who still believe the web can be wondrous.
        </p>
      </div>

      {/* Sweet, Inspiring, Heartfelt Narrative */}
      <article className="space-y-8 font-sans text-sm sm:text-base text-zinc-300 leading-relaxed break-words">
        {/* Section 1: The Wonder */}
        <section className="space-y-3 bg-zinc-950/60 border border-white/[0.06] p-6 sm:p-8 rounded-2xl">
          <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Globe className="w-4 h-4" />
            <span>Remember When the Web Was a Garden?</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
            The Joy of Making Something of Your Own
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            Do you remember the first time you created a webpage? The sheer thrill of putting words, code, and ideas onto a blank screen and watching it come alive across the planet.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Back then, the internet was not a machine for endless scrolling or fighting for likes. It was a constellation of handcrafted digital homes, secret personal gardens, and passionate research notes written late at night simply because someone cared so deeply about a subject that they couldn&apos;t sleep until they built it.
          </p>
        </section>

        {/* Section 2: You Are Not Alone */}
        <section className="space-y-3 bg-zinc-950/60 border border-white/[0.06] p-6 sm:p-8 rounded-2xl">
          <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Heart className="w-4 h-4" />
            <span>To the Quietly Obsessed</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
            If You Feel Different, You Are In the Right Place
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            Maybe you spent three months writing a compiler from scratch just to see how the assembly felt. Maybe you spent your weekends proving a mathematical theorem, designing clockless chips, or cataloging obscure philosophy that nobody around you understood.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Society often calls that eccentric. But in truth, that obsession is where all human beauty, invention, and genius comes from. You are not weird; you are the reason the world moves forward.
          </p>
        </section>

        {/* Section 3: Why We Formed The Ring */}
        <section className="space-y-3 bg-zinc-950/60 border border-white/[0.06] p-6 sm:p-8 rounded-2xl">
          <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold uppercase tracking-wider text-sky-400">
            <Compass className="w-4 h-4" />
            <span>The Webring as a Circle of Friends</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight">
            Mutual Gravity Without Algorithms
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            We started <strong className="text-white">The Uncommons</strong> not to create an exclusive barrier, but to create a haven. A gentle circle where true craftspeople can discover one another without algorithms pushing advertisements or noise between us.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            When you embed our quiet little badge on your personal site, you aren&apos;t adding a corporate logo. You are linking hands with eleven other extraordinary human beings who respect your mind, celebrate your obsessions, and share your belief in sovereign digital beauty.
          </p>
        </section>

        {/* The 4 Principles of Respect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-5 bg-black border border-white/10 rounded-xl space-y-1.5">
            <div className="font-mono text-xs text-zinc-500 uppercase">Principle 1</div>
            <div className="font-mono text-sm font-semibold text-white">Your Sovereignty is Sacred</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Your website belongs to you forever. No one can ever ban, throttle, or monetize your mind here.
            </p>
          </div>

          <div className="p-5 bg-black border border-white/10 rounded-xl space-y-1.5">
            <div className="font-mono text-xs text-zinc-500 uppercase">Principle 2</div>
            <div className="font-mono text-sm font-semibold text-white">Genuine Craft Over Status</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              We do not ask where you went to school or who you work for. We only ask: what have you created with love?
            </p>
          </div>

          <div className="p-5 bg-black border border-white/10 rounded-xl space-y-1.5">
            <div className="font-mono text-xs text-zinc-500 uppercase">Principle 3</div>
            <div className="font-mono text-sm font-semibold text-white">Kind, Honest Conversations</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Our review is not an interrogation. It is a genuine chat between peers on Discord who want to hear your story.
            </p>
          </div>

          <div className="p-5 bg-black border border-white/10 rounded-xl space-y-1.5">
            <div className="font-mono text-xs text-zinc-500 uppercase">Principle 4</div>
            <div className="font-mono text-sm font-semibold text-white">A Bond of Mutual Wonder</div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Each member lifts the other up. Every curious visitor who finds your site can wander into the next wonderland.
            </p>
          </div>
        </div>

        {/* Sweet closing quote */}
        <div className="p-6 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-zinc-950 border border-white/15 rounded-2xl text-center space-y-2">
          <p className="font-mono text-base sm:text-lg text-white font-medium italic">
            &ldquo;The web never lost its genius. It just retreated into quiet corners, waiting for us to find each other again.&rdquo;
          </p>
          <div className="text-xs font-mono text-zinc-500">
            &mdash; Ibrahim (Carbon) &amp; The Uncommons Council
          </div>
        </div>

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-zinc-500 text-center sm:text-left">
            Ready to link your sovereign sanctuary with ours?
          </div>
          <Link
            to="/apply"
            onClick={() => sound.playClick()}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-md transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Apply &amp; Join Our Discord Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </article>
    </div>
  );
};
