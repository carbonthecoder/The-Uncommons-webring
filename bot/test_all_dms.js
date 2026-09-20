import dotenv from 'dotenv';
import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';

dotenv.config();

const TARGET_USERNAME = 'carbonthecoder';
const TARGET_ID = '954250474763198494';

async function runDMTestSuite() {
  console.log('🤖 Initializing Discord Client for DM Test Suite...');
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);
  console.log(`✅ Logged in as ${client.user.tag}`);

  console.log(`🔍 Fetching target user: @${TARGET_USERNAME} (${TARGET_ID})...`);
  const targetUser = await client.users.fetch(TARGET_ID);
  if (!targetUser) {
    throw new Error(`Target user ${TARGET_ID} could not be found.`);
  }
  console.log(`🎯 Target resolved: ${targetUser.tag} (ID: ${targetUser.id})`);

  // --- MESSAGE 1: ADMISSIONS DOCKET CREATED (INTAKE NOTIFICATION) ---
  console.log('📨 [1/4] Sending Admissions Docket Created DM...');
  const ticketId = 'UNC-TEST-8492';
  const sampleChannelId = '1550541993250267166';
  const guildId = '1372095730696716379';

  const docketButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('📝 Enter Admissions Docket')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${guildId}/${sampleChannelId}`)
  );

  const docketEmbed = new EmbedBuilder()
    .setTitle(`The Uncommons — Admissions Docket [${ticketId}]`)
    .setDescription(
      `👋 Greetings <@${targetUser.id}>,\n\n` +
      `Your private admissions review channel has been opened on Discord:\n` +
      `👉 **<#${sampleChannelId}>**\n\n` +
      `**Next Step:** Please enter your docket channel and click **[ 📝 Open Application Dialog ]** to submit your 5 intake questions. An admissions auditor will review your dossier.`
    )
    .setColor(0x10b981)
    .setFooter({ text: 'The Uncommons • Admissions Reception' })
    .setTimestamp();

  await targetUser.send({
    content: '🧪 **[TEST 1/4] Candidate Docket Opened Notification:**',
    embeds: [docketEmbed],
    components: [docketButton],
  });
  console.log('✅ [1/4] Admissions Docket Created DM delivered.');

  // Small delay to ensure clean ordering in Discord client
  await new Promise((r) => setTimeout(r, 1500));

  // --- MESSAGE 2: SOVEREIGN ADMISSION APPROVED (RATIFIED & FORGED KEY) ---
  console.log('📨 [2/4] Sending Sovereign Admission Approved DM...');
  const testKey = 'UNC-KEY-8A3F-2026';
  const testPin = '918542';

  const approvalButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🔑 Enter Sovereign Node Studio')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://the-uncommons.vercel.app/seal?key=${testKey}&pin=${testPin}`)
  );

  const approvalEmbed = new EmbedBuilder()
    .setTitle('The Uncommons — Sovereign Admission Approved')
    .setDescription(
      `Congratulations <@${targetUser.id}>! Your application has been ratified and approved for **The Uncommons Webring**.\n\n` +
      `**Your Sovereign Credentials:**\n` +
      `• **Ring Key:** \`${testKey}\`\n` +
      `• **Secret PIN:** \`${testPin}\` *(Keep this confidential)*\n\n` +
      `🛡️ **Role Awarded:** You have been assigned <@&1551036702766796800> in the server!\n\n` +
      `**1-Click Vault Access:**\n` +
      `✨ [Click here to enter your Node Studio](https://the-uncommons.vercel.app/seal?key=${testKey}&pin=${testPin})\n\n` +
      `Or enter manually at [the-uncommons.vercel.app/seal](https://the-uncommons.vercel.app/seal) with your key & PIN.`
    )
    .setColor(0x10b981)
    .setFooter({ text: 'The Uncommons • Sealed by Inspector Bartholomew' })
    .setTimestamp();

  await targetUser.send({
    content: '🧪 **[TEST 2/4] Sovereign Admission Approved & 2-Step Key Ratification:**',
    embeds: [approvalEmbed],
    components: [approvalButton],
  });
  console.log('✅ [2/4] Sovereign Admission Approved DM delivered.');

  await new Promise((r) => setTimeout(r, 1500));

  // --- MESSAGE 3: COHORT VERDICT / REJECTION (ENCOURAGEMENT) ---
  console.log('📨 [3/4] Sending Admission Cohort Verdict (Encouragement) DM...');
  const rejectionEmbed = new EmbedBuilder()
    .setTitle('🛑 The Uncommons — Admission Cohort Verdict')
    .setDescription(
      `Hello <@${targetUser.id}>,\n\n` +
      `Thank you for taking the time to submit your application for **The Uncommons Webring** (Docket \`${ticketId}\`).\n\n` +
      `**You were not admitted in this cohort.**\n\n` +
      `*Stay active in the server, level up, build and learn new things! We actively monitor everyone in the server—even small contributions, discussions, and side projects—and may add you to the webring in the future.*`
    )
    .setColor(0xef4444)
    .setFooter({ text: 'The Uncommons • Inspector Bartholomew (Chief Admissions Auditor)' })
    .setTimestamp();

  await targetUser.send({
    content: '🧪 **[TEST 3/4] Admission Cohort Verdict / Encouraging Non-Admission Notice:**',
    embeds: [rejectionEmbed],
  });
  console.log('✅ [3/4] Cohort Verdict DM delivered.');

  await new Promise((r) => setTimeout(r, 1500));

  // --- MESSAGE 4: REVIEWER HANDOFF / DOCKET ASSIGNMENT ALERT ---
  console.log('📨 [4/4] Sending Reviewer Handoff / Docket Assignment DM...');
  const jumpButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🔍 Jump to Assigned Docket')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${guildId}/${sampleChannelId}`)
  );

  const handoffEmbed = new EmbedBuilder()
    .setTitle(`The Uncommons — Docket Assigned // ${ticketId}`)
    .setDescription(
      `Reviewer <@${client.user.id}> is AFK/busy and passed active evaluation of docket **\`${ticketId}\`** (Candidate: <@${targetUser.id}>) to you.\n\n` +
      `Please navigate to the review channel to evaluate the candidate's dossier answers and audit signals.`
    )
    .setColor(0x06b6d4)
    .setFooter({ text: 'Inspector Bartholomew • Review Hand-Off' })
    .setTimestamp();

  await targetUser.send({
    content: '🧪 **[TEST 4/4] Reviewer Hand-Off / Docket Assignment Alert:**',
    embeds: [handoffEmbed],
    components: [jumpButton],
  });
  console.log('✅ [4/4] Reviewer Handoff DM delivered.');

  await new Promise((r) => setTimeout(r, 1000));

  // Final confirmation message
  await targetUser.send({
    content: '🏁 **DM TEST SUITE COMPLETE:** All 4 bot DM notification flows were dispatched and verified successfully. Zero errors encountered.',
  });

  console.log('🎉 All DM tests dispatched and verified successfully!');
  process.exit(0);
}

runDMTestSuite().catch((err) => {
  console.error('❌ DM Test Suite Error:', err);
  process.exit(1);
});
