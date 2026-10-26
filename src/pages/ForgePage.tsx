import React from 'react';
import { Server, Lock, ExternalLink, HardDrive, Key, GitBranch, ShieldAlert } from 'lucide-react';

export const ForgePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-16 sm:space-y-20 py-4 animate-in fade-in duration-300">
      {/* Masthead */}
      <header className="space-y-4 text-left border-b border-white/[0.08] pb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1a17] border border-white/[0.08] text-xs font-mono text-amber-400">
          <Server className="w-3.5 h-3.5" />
          <span>SOVEREIGN CODE FORGE &bull; DEBIAN BARE METAL</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-normal tracking-tight text-[#fbf9f5] leading-[1.1]">
          Sovereign Git
        </h1>

        <p className="font-mono text-xs sm:text-sm text-[#9c9387] tracking-wide">
          Private, self-hosted Forgejo instance on Carbon&apos;s server &bull; git.carbon.is-a.dev
        </p>
      </header>

      {/* Section 1: The Setup */}
      <section className="bg-[#181614] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl text-[#fbf9f5]">
              The Instance
            </h2>
            <p className="text-xs font-mono text-[#8c8376] mt-0.5">
              Isolated Git hosting dedicated exclusively to Uncommons members.
            </p>
          </div>
          <a
            href="https://git.carbon.is-a.dev"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-[#25221e] hover:bg-[#302c27] text-xs font-mono text-amber-400 border border-amber-500/20 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Visit git.carbon.is-a.dev</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <HardDrive className="w-4 h-4" />
              <span>Storage &amp; Backup</span>
            </div>
            <p className="text-[#a8a199] leading-relaxed">
              Fast NVMe storage running Debian Linux. Encrypted daily snapshots automated with BorgBackup offsite.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <GitBranch className="w-4 h-4" />
              <span>Forgejo Engine</span>
            </div>
            <p className="text-[#a8a199] leading-relaxed">
              100% free software fork of Gitea. Clean interface, standard Git CLI compatibility, lightweight footprint.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Lock className="w-4 h-4" />
              <span>Zero Surveillance</span>
            </div>
            <p className="text-[#a8a199] leading-relaxed">
              No tracking scripts, no analytics cookies, no AI data harvesting pipelines, and no third-party telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Why We Host Our Own Git */}
      <section className="bg-[#181614] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-white/[0.08] pb-4 space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>EDITORIAL PERSPECTIVE</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#fbf9f5]">
            Why We Host Our Own Git
          </h2>
          <p className="text-xs font-mono text-[#8c8376]">
            Four concrete reasons we chose self-hosted sovereign infrastructure over centralized platforms.
          </p>
        </div>

        <div className="space-y-6">
          {/* Point 1 */}
          <div className="p-5 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2">
            <h3 className="font-serif text-lg text-[#fbf9f5] flex items-center gap-2">
              <span className="text-amber-500 font-mono text-sm">01</span>
              <span>Ethical independence from military compute</span>
            </h3>
            <p className="text-sm text-[#c4bcaf] leading-relaxed font-sans">
              An <a href="https://apnews.com/article/israel-palestinians-ai-technology-737bc17af7b03e98c29cec4e15d0f108" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">Associated Press investigation on commercial AI models deployed in warfare</a> documented how commercial cloud platforms and AI systems were enlisted to process mass surveillance feeds and generate bombing targets in Gaza and Lebanon. When personal software relies on corporate defense contractors, developers lose moral agency over their compute.
            </p>
          </div>

          {/* Point 2 */}
          <div className="p-5 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2">
            <h3 className="font-serif text-lg text-[#fbf9f5] flex items-center gap-2">
              <span className="text-amber-500 font-mono text-sm">02</span>
              <span>Leaked code behind &quot;private&quot; flags</span>
            </h3>
            <p className="text-sm text-[#c4bcaf] leading-relaxed font-sans">
              A security audit reported by TechCrunch revealed that <a href="https://techcrunch.com/2025/02/26/thousands-of-exposed-github-repositories-now-private-can-still-be-accessed-through-copilot/" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">thousands of GitHub repositories made private or deleted remained queryable through Copilot</a>. Because search engines cached public snapshots, internal packages and API tokens stayed accessible to AI prompts long after their owners locked them down.
            </p>
          </div>

          {/* Point 3 */}
          <div className="p-5 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2">
            <h3 className="font-serif text-lg text-[#fbf9f5] flex items-center gap-2">
              <span className="text-amber-500 font-mono text-sm">03</span>
              <span>Default training on developer keystrokes</span>
            </h3>
            <p className="text-sm text-[#c4bcaf] leading-relaxed font-sans">
              Recent <a href="https://github.blog/changelog/2026-03-25-updates-to-our-privacy-statement-and-terms-of-service-how-we-use-your-data/" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">updates to GitHub&apos;s privacy statement and terms of service</a> established that individual code prompts, workspace context, and accepted edits feed corporate model training pipelines by default. Your daily commits quietly double as training data unless you dig through account settings to switch off the toggle.
            </p>
          </div>

          {/* Point 4 */}
          <div className="p-5 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2">
            <h3 className="font-serif text-lg text-[#fbf9f5] flex items-center gap-2">
              <span className="text-amber-500 font-mono text-sm">04</span>
              <span>Unilateral platform lockouts</span>
            </h3>
            <p className="text-sm text-[#c4bcaf] leading-relaxed font-sans">
              Centralized platforms enforce sudden lockouts without notice, as seen when <a href="https://techcrunch.com/2019/07/29/github-ban-sanctioned-countries/" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">TechCrunch documented GitHub blocking developers and locking private repositories</a> overnight based on IP geolocation. Relying on a single tech conglomerate means a unilateral policy shift can sever access to your work with zero recourse.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Ring Member Access */}
      <section className="border border-white/[0.08] rounded-xl p-6 sm:p-8 bg-[#181614] space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500">
            <Key className="w-3.5 h-3.5" />
            <span>CLOSED ACCESS DIRECTIVE</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-[#fbf9f5]">
            Member Access &amp; Invite Tokens
          </h2>
        </div>

        <p className="text-sm text-[#c4bcaf] leading-relaxed font-sans">
          Public registration on our Forgejo instance is disabled to prevent automated bot accounts and repository spam. Accounts are provisioned exclusively through private, single-use invite tokens generated by Carbon.
        </p>

        <div className="p-4 rounded-lg bg-[#121110] border border-white/[0.06] space-y-2 text-xs font-mono text-[#dcd5c9]">
          <div className="text-amber-400 font-semibold">How to get your invite:</div>
          <ol className="list-decimal list-inside space-y-1 text-[#a8a199]">
            <li>Join The Uncommons webring with your personal domain.</li>
            <li>Ping Carbon with your preferred username and SSH public key.</li>
            <li>Receive your single-use registration URL to initialize your sovereign repository space.</li>
          </ol>
        </div>
      </section>
    </div>
  );
};