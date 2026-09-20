import React from 'react';
import { Terminal } from 'lucide-react';

export const ManifestoPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 py-4">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>MANIFESTO // THE UNCOMMONS</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight lowercase">
          manifesto
        </h1>
      </div>

      {/* Narrative Essay Content */}
      <article className="space-y-8 font-sans text-sm sm:text-base text-zinc-300 leading-relaxed lowercase">
        <section className="space-y-4">
          <p className="text-zinc-400 leading-relaxed">
            you are not a user. you are not a number in somebody's dashboard. you are a person, and you deserve a spot on the internet that is actually yours.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            picture it. a page with your name on it, that looks exactly the way you want it to. somewhere people can wander into and actually get to know you. a place no feed can bury, and nobody can quietly switch off because the numbers dipped this quarter.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            somewhere to post your projects, complain about your day, keep a guestbook, dump the songs and films and half-finished ideas you love. a room you built yourself, with the door left open.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            a personal website is how you get one.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            it's the first small step to a place online that answers to you and no one else. if that idea does anything for you at all, keep reading.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-mono font-bold text-white tracking-tight lowercase">
            perfect is not the point
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            the point is that it's yours, not that it's polished.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            make it ugly. make it weird. make it slow. hand-code it in notepad at 3am and never touch a framework in your life. as long as it's yours and you like it even a little, it did its job.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            “clean” and “professional” are for people getting paid. this one is for fun. forget what you think a website is supposed to be, and build one that just sounds like you.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            so stop tweaking it. make a website you think is cool, link it into the ring, and go wander through everyone else's.
          </p>
        </section>

        <section className="space-y-4 pt-6 border-t border-white/[0.08]">
          <p className="text-zinc-400 leading-relaxed">
            want in? message <a href="https://discord.com/users/1352866897900732446" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">arshnah on Discord</a> and ask, or drop into the <a href="https://discord.gg/z5dbFD2tf2" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">discord server</a> — either way works. in this slanf our motive is diff but here is the slang and how to make it
          </p>
        </section>
      </article>
    </div>
  );
};
