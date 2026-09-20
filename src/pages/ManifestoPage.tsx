import React from 'react';
import { Terminal } from 'lucide-react';

export const ManifestoPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-4">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400/80">
          <Terminal className="w-3.5 h-3.5" />
          <span>[ THE MANIFESTO ]</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight lowercase">
          own your <span className="text-emerald-400">shit.</span>
        </h1>
      </div>

      {/* Narrative Essay Content */}
      <article className="space-y-8 font-sans text-sm sm:text-base text-zinc-300 leading-relaxed lowercase">
        <section className="space-y-4 border-l border-emerald-400/20 pl-4 sm:pl-6">
          <p className="text-zinc-400 leading-relaxed">
            you are not a metric. you are not a DAU on some VC's dashboard. you're a builder, and you deserve a spot on the internet that is undeniably <span className="text-white font-medium">yours</span>.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            picture this: a corner of the web with your name on it, vibecoded exactly how you want it. a place people can wander into and actually get to know the real you. a spot no feed can bury, and nobody can pull the plug on just because the numbers dipped.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            somewhere to drop your unhinged projects, keep a raw devlog, stash your half-cooked ideas, or just complain about the stack you're using. a room you built yourself, with the door left wide open.
          </p>
          <p className="text-emerald-400 leading-relaxed font-mono">
            [ a sovereign domain is how you break out ]
          </p>
        </section>

        <section className="space-y-4 border-l border-emerald-400/20 pl-4 sm:pl-6">
          <h2 className="text-lg font-mono font-bold text-white tracking-tight lowercase">
            perfection is cooked
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            the point is that it's yours, not that it looks like a polished SaaS landing page.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            make it weird. make it raw. hand-code it in neovim at 3am and never touch a massive framework if you don't want to. as long as the vibes are right and you fuck with it, it did its job.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            "clean" and "professional" are for people getting paid by the hour. this is for the craft. forget what a website is "supposed" to be, and build something that actually sounds like you.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            so stop endlessly tweaking. push that shit live, link it into the ring, and go surf through everyone else's.
          </p>
        </section>

        <section className="space-y-4 pt-6 border-t border-white/[0.08]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-xs font-mono text-emerald-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>[ READY TO LOCK IN? ]</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            if you've got a personal site and you're actually building, pull up. drop into <a href="https://discord.gg/3PCeDNebXG" target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-400 transition-colors underline underline-offset-4 decoration-emerald-400/30">#council-review</a> on our discord. we don't care about your resume, just show us what you're obsessing over.
          </p>
        </section>
      </article>
    </div>
  );
};
