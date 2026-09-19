// Discord Webhook Dispatcher for The Uncommons & Kavyon Council Review
export interface ApplicationData {
  domain: string;
  proof: string;
  discordHandle: string;
  focus?: string;
}

export interface DispatchResult {
  success: boolean;
  message: string;
  directDiscordUrl: string;
  ticketId: string;
  formattedEmbed?: string;
}

// Target Discord Channels & Server Links
export const DISCORD_LINKS = {
  councilReview: 'https://discord.gg/3PCeDNebXG',
  kavyonServer: 'https://discord.gg/8JmHjMSqJ5',
  serverName: 'Kavyon',
  channelName: '#council-review',
  categoryName: 'the-uncommon-webring',
};

// Generate an application ID (e.g. UNC-7A39)
export const generateTicketId = (): string => {
  const chars = '0123456789ABCDEF';
  let id = 'UNC-';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Clean and normalize domain
export const normalizeDomain = (domain: string): string => {
  return domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
};

// Rate limiter helper (2 minutes cooldown per device)
export const checkCooldown = (): { isAllowed: boolean; remainingSeconds: number } => {
  const lastTime = localStorage.getItem('unc_last_submission_time');
  if (!lastTime) return { isAllowed: true, remainingSeconds: 0 };

  const elapsed = (Date.now() - parseInt(lastTime, 10)) / 1000;
  const cooldownPeriod = 120; // 2 minutes

  if (elapsed < cooldownPeriod) {
    return { isAllowed: false, remainingSeconds: Math.ceil(cooldownPeriod - elapsed) };
  }
  return { isAllowed: true, remainingSeconds: 0 };
};

export const recordSubmission = () => {
  localStorage.setItem('unc_last_submission_time', Date.now().toString());
};

// Format Discord Embed Payload (Council Admission Ticket)
export const createDiscordEmbedPayload = (data: ApplicationData, ticketId: string) => {
  const cleanDomain = normalizeDomain(data.domain);
  const now = new Date();

  return {
    username: 'The Uncommons — Admissions Ticket Desk',
    avatar_url: 'https://raw.githubusercontent.com/carbonthecoder/The-Uncommons-webring/main/public/favicon.svg',
    embeds: [
      {
        title: `🎫 COUNCIL REVIEW TICKET // #${ticketId} — @${data.discordHandle.trim().replace(/^@/, '')}`,
        description: `Candidate admission ticket received for **The Uncommons Sovereign Webring** (Kavyon Community).`,
        color: 0x10b981, // Emerald Green
        fields: [
          {
            name: '📋 Ticket Metadata',
            value: `**Status**: \`PENDING REVIEW\`\n**Target**: \`GENESIS WEBRING\`\n**Review SLA**: \`2-3 hours (Active Hours)\``,
            inline: false,
          },
          {
            name: '🌐 Sovereign Domain',
            value: `[https://${cleanDomain}](https://${cleanDomain})`,
            inline: true,
          },
          {
            name: '👤 Discord Applicant',
            value: `\`@${data.discordHandle.trim().replace(/^@/, '')}\``,
            inline: true,
          },
          {
            name: '🎫 Ticket ID',
            value: `\`${ticketId}\``,
            inline: true,
          },
          {
            name: '🔨 Shipped Build / Proof of Work',
            value: data.proof.trim().startsWith('http') 
              ? `[Inspect Build Evidence](${data.proof.trim()})\n\`${data.proof.trim()}\`` 
              : data.proof.trim(),
            inline: false,
          },
          {
            name: '💡 Obsession & Craft',
            value: data.focus?.trim() || 'Young builder obsessed with upskilling daily.',
            inline: false,
          },
          {
            name: '🛡️ Moderator Instructions',
            value: `Verify domain ownership and proof. If candidate qualifies for the ring, reply in this thread or ping \`@${data.discordHandle.trim().replace(/^@/, '')}\` with their Ring Key (\`UNC-ALPHA-2026\`).`,
            inline: false,
          },
        ],
        footer: {
          text: `Ticket #${ticketId} • One application per applicant enforced • Review time: 2-3 hours on active hours`,
        },
        timestamp: now.toISOString(),
      },
    ],
  };
};

// Dispatch function (Dispatches to webhook if configured, with resilient client-side fallback)
export interface DiscordMemberCheck {
  checked: boolean;
  exists: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

// Check if applicant is member of Kavyon Discord server
export const checkDiscordServerMembership = async (
  username: string
): Promise<DiscordMemberCheck> => {
  const clean = username.trim().replace(/^@/, '');
  if (!clean) return { checked: true, exists: false, message: 'Username is required' };

  const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${botApiUrl}/api/check-member?username=${encodeURIComponent(clean)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return { 
        checked: true, 
        exists: !!data.exists, 
        message: data.error,
        user: data.user,
      };
    }
  } catch {
    // Bot API is offline or client is standalone, proceed with webhook fallback
  }
  return { checked: false, exists: true };
};

// Dispatch function (Dispatches to Bot API for private ticket channel, with resilient webhook fallback)
export const dispatchApplicationToDiscord = async (
  data: ApplicationData
): Promise<DispatchResult> => {
  const ticketId = generateTicketId();
  const cleanDomain = normalizeDomain(data.domain);
  const cleanHandle = data.discordHandle.trim().replace(/^@/, '');

  // Check rate limit
  const cooldown = checkCooldown();
  if (!cooldown.isAllowed) {
    return {
      success: false,
      message: `Anti-spam cooldown active. Please wait ${cooldown.remainingSeconds}s before submitting again.`,
      directDiscordUrl: DISCORD_LINKS.councilReview,
      ticketId,
    };
  }

  // 1. First, check if Bot API is online & verify server membership
  const botApiUrl = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3001';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const botRes = await fetch(`${botApiUrl}/api/create-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: cleanDomain,
        proof: data.proof.trim(),
        discordHandle: cleanHandle,
        focus: data.focus?.trim(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const botData = await botRes.json();
    if (botRes.status === 403) {
      // User is strictly NOT in the server!
      return {
        success: false,
        message: botData.error || `Applicant @${cleanHandle} was not found in Kavyon server. You must join first!`,
        directDiscordUrl: DISCORD_LINKS.kavyonServer,
        ticketId,
      };
    }

    if (botRes.ok && botData.success) {
      recordSubmission();
      return {
        success: true,
        message: `Private ticket channel #${cleanHandle} created on Discord! You and staff can chat directly in the channel.`,
        directDiscordUrl: botData.channelUrl || DISCORD_LINKS.councilReview,
        ticketId: botData.ticketId || ticketId,
      };
    }
  } catch {
    // Bot API is not running, proceed to standard webhook delivery below
  }

  // 2. Webhook Dispatch Fallback
  const webhookUrl =
    import.meta.env.VITE_DISCORD_WEBHOOK_URL ||
    'https://discord.com/api/webhooks/1550549714200432670/615z4ghViOaJw_oKrRPiT2DnK1WJjzZeSTDuLLy66O1QreXn8VfMf0X58MX24AtT5O6a';
  const embedPayload = createDiscordEmbedPayload(data, ticketId);

  // Compile formatted Markdown ticket
  const formattedTicket = `\`\`\`yaml
=== THE UNCOMMONS // COUNCIL ADMISSION APPLICATION ===
ID: "${ticketId}"
DOMAIN: "https://${cleanDomain}"
PROOF_OF_WORK: "${data.proof.trim()}"
DISCORD_HANDLE: "@${cleanHandle}"
OBSESSION: "${data.focus?.trim() || 'Curious builder / upskilling daily'}"
TARGET_CHANNEL: "#council-review (Kavyon Community)"
DATE: "${new Date().toISOString()}"
STATUS: "AWAITING MANUAL COUNCIL VERIFICATION"
======================================================
\`\`\``;

  if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(embedPayload),
      });

      if (response.ok) {
        recordSubmission();
        return {
          success: true,
          message: `Application ticket dispatched to #council-review in Kavyon.`,
          directDiscordUrl: DISCORD_LINKS.councilReview,
          ticketId,
          formattedEmbed: formattedTicket,
        };
      }
    } catch {
      // Fallback below
    }
  }

  recordSubmission();
  return {
    success: true,
    message: `Application compiled for #council-review in Kavyon.`,
    directDiscordUrl: DISCORD_LINKS.councilReview,
    ticketId,
    formattedEmbed: formattedTicket,
  };
};

// Dispatch function for Node Activation Event (When a member enters their key)
export const dispatchNodeActivationToDiscord = async (nodeId: string, domain: string, name: string, field: string): Promise<boolean> => {
  const webhookUrl =
    import.meta.env.VITE_DISCORD_WEBHOOK_URL ||
    'https://discord.com/api/webhooks/1550549714200432670/615z4ghViOaJw_oKrRPiT2DnK1WJjzZeSTDuLLy66O1QreXn8VfMf0X58MX24AtT5O6a';

  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) return false;

  const payload = {
    username: 'The Uncommons — Node Activation Service',
    avatar_url: 'https://raw.githubusercontent.com/carbonthecoder/The-Uncommons-webring/main/public/favicon.svg',
    embeds: [
      {
        title: `🟢 GENESIS NODE RATIFIED & ACTIVATED: ${nodeId}`,
        description: `Candidate **${name}** has successfully redeemed their activation key and claimed slot **${nodeId}** on the sovereign ledger!`,
        color: 0x10b981,
        fields: [
          { name: '🌐 Sovereign Domain', value: `\`https://${normalizeDomain(domain)}\``, inline: true },
          { name: '🔑 Node Slot ID', value: `\`${nodeId}\``, inline: true },
          { name: '⚡ Focus Field', value: field, inline: false },
          { name: '📜 Webring Seal', value: 'Webring widget embed code generated and issued.', inline: false }
        ],
        footer: { text: `The Uncommons × Kavyon Ecosystem` },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
};

// Dispatch function for Council issuing an Activation Key
export const dispatchKeyIssuanceToDiscord = async (key: string, slotId: string, candidateHandle: string): Promise<boolean> => {
  const webhookUrl =
    import.meta.env.VITE_DISCORD_WEBHOOK_URL ||
    'https://discord.com/api/webhooks/1550549714200432670/615z4ghViOaJw_oKrRPiT2DnK1WJjzZeSTDuLLy66O1QreXn8VfMf0X58MX24AtT5O6a';

  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) return false;

  const payload = {
    username: 'The Uncommons — Council Key Authority',
    avatar_url: 'https://raw.githubusercontent.com/carbonthecoder/The-Uncommons-webring/main/public/favicon.svg',
    embeds: [
      {
        title: `🔑 SOVEREIGN ACTIVATION KEY ISSUED // ${slotId}`,
        description: `Council has ratified candidate **${candidateHandle}** and granted an official Genesis Activation Key for slot **${slotId}**.`,
        color: 0x10b981,
        fields: [
          { name: '🎫 Allocated Slot', value: `\`${slotId}\``, inline: true },
          { name: '👤 Candidate', value: `\`${candidateHandle}\``, inline: true },
          { name: '🔐 Activation Key', value: `\`${key}\``, inline: false },
          { name: '🚀 Next Step', value: 'Candidate can navigate to [the-uncommons.vercel.app/nodes](https://the-uncommons.vercel.app/nodes), click **Claim Slot**, and enter their key.', inline: false }
        ],
        footer: { text: `The Uncommons × Kavyon Council Key Registry` },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch {
    return false;
  }
};


