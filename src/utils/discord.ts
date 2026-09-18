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

// Format Discord Embed Payload
export const createDiscordEmbedPayload = (data: ApplicationData, ticketId: string) => {
  const cleanDomain = normalizeDomain(data.domain);
  const now = new Date();

  return {
    username: 'The Uncommons — Admissions Gateway',
    avatar_url: 'https://raw.githubusercontent.com/carbonthecoder/The-Uncommons-webring/main/public/favicon.svg',
    embeds: [
      {
        title: `🌌 NEW COUNCIL ADMISSION APPLICATION [${ticketId}]`,
        description: `A builder from the sovereign web has applied for admission into **The Uncommons Webring** (Kavyon Community).`,
        color: 0x10b981, // Emerald Green
        fields: [
          {
            name: '🌐 Sovereign Domain',
            value: `[https://${cleanDomain}](https://${cleanDomain})`,
            inline: true,
          },
          {
            name: '👤 Discord Applicant',
            value: `\`${data.discordHandle.trim()}\``,
            inline: true,
          },
          {
            name: '🎫 Application ID',
            value: `\`${ticketId}\``,
            inline: true,
          },
          {
            name: '🔨 Proof of Work / Project Build',
            value: data.proof.trim().startsWith('http') 
              ? `[View Proof of Work Link](${data.proof.trim()})\n\`${data.proof.trim()}\`` 
              : data.proof.trim(),
            inline: false,
          },
          {
            name: '💡 Obsession & Craft',
            value: data.focus?.trim() || 'Young builder with curious mindset upskilling daily.',
            inline: false,
          },
          {
            name: '📍 Channel & Ecosystem',
            value: `Category: **${DISCORD_LINKS.categoryName}**\nChannel: **${DISCORD_LINKS.channelName}** in **${DISCORD_LINKS.serverName}**`,
            inline: true,
          },
          {
            name: '⚖️ Action Required',
            value: 'Review domain & proof. If admitted, DM or reply with **Ring Key** (`UNC-ALPHA-2026`).',
            inline: false,
          },
        ],
        footer: {
          text: `The Uncommons × Kavyon • Manual Founder Review Required`,
        },
        timestamp: now.toISOString(),
      },
    ],
  };
};

// Dispatch function (Dispatches to webhook if configured, with resilient client-side fallback)
export const dispatchApplicationToDiscord = async (
  data: ApplicationData
): Promise<DispatchResult> => {
  const ticketId = generateTicketId();
  const cleanDomain = normalizeDomain(data.domain);

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

  // Webhook URL from environment or default official council webhook
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
DISCORD_HANDLE: "${data.discordHandle.trim()}"
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
          message: `Application dispatched directly into #council-review in Kavyon.`,
          directDiscordUrl: DISCORD_LINKS.councilReview,
          ticketId,
          formattedEmbed: formattedTicket,
        };
      }
    } catch {
      // Fallback below if webhook fails (CORS or network error)
    }
  }

  // Resilient fallback (stores cooldown and provides direct channel jump)
  recordSubmission();
  return {
    success: true,
    message: `Application compiled for #council-review in Kavyon.`,
    directDiscordUrl: DISCORD_LINKS.councilReview,
    ticketId,
    formattedEmbed: formattedTicket,
  };
};
