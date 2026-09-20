import React from 'react';
import { Terminal } from 'lucide-react';

export const ManifestoPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-4">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>The Manifesto</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
          A Return to Sovereign Space.
        </h1>
        <p className="text-sm font-mono text-zinc-400">
          On algorithmic decay, deep work, and the resurrection of the webring.
        </p>
      </div>

      {/* Narrative Essay Content */}
      <article className="space-y-10 font-sans text-sm sm:text-base text-zinc-300 leading-relaxed">
        
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-display font-semibold text-white tracking-tight">
            I. The Great Flattening
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            The early web was an infinite frontier. A decentralized collection of sovereign outposts where people published their life's work, weird obsessions, and unfiltered thoughts. Today, it has been flattened into a handful of algorithmic feeds optimized for engagement, rage, and endless scrolling. 
          </p>
          <p className="text-zinc-400 leading-relaxed">
            When you publish on a platform, you are renting space in someone else's casino. You do not own your audience, your format, or your data. Your most complex ideas are pulverized into metrics.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-display font-semibold text-white tracking-tight">
            II. Sovereign Real Estate
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            The true counter-culture to the algorithmic feed is the personal domain. A quiet space where you control the pixels, the typography, and the logic. It is a rebellion against the homogenization of thought.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            We believe that the most interesting people on the internet do not spend their time optimizing threads. They are deep in the trenches, building their own sovereign real estate and working on problems that actually matter.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-display font-semibold text-white tracking-tight">
            III. The Uncommons
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            The Uncommons is a closed-loop webring designed to connect these isolated outposts. It is an invite-only network of rare minds, crack engineers, and obsessive creators. 
          </p>
          <p className="text-zinc-400 leading-relaxed">
            There are no metrics here. No follower counts, no likes, and no algorithmic discovery. Just a continuous loop of high-signal, human-curated domains passing the torch to one another.
          </p>
        </section>

        <section className="space-y-4 pt-6 border-t border-white/[0.08]">
          <h2 className="text-lg sm:text-xl font-display font-semibold text-white tracking-tight">
            Join the Ring
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            We are looking for individuals who care deeply about their craft. You don't need a polished portfolio or a massive following. You just need a sovereign domain and a quiet obsession.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            To apply, join the <a href="https://discord.gg/3PCeDNebXG" target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:underline underline-offset-4">#council-review</a> channel on our Discord. Speak directly with the founders and show us what you're building.
          </p>
        </section>

      </article>
    </div>
  );
};
