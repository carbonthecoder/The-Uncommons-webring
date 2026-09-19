# The Uncommons // Discord Council Review Bot

An automated Discord Bot & Ticket Desk for **The Uncommons × Kavyon**.

## Features
- **Server Membership Verification**: Checks if applicant is joined in Kavyon. Blocks submission if not found.
- **Private Channel Creation**: Creates `#ticket-[username]` visible only to the applicant and staff.
- **Role-Based Escalation**: Reviewer chats with applicant and pings Senior Staff via interactive button.
- **Direct DM Delivery**: Senior Staff ratifies candidate, bot DMs Ring Key (`UNC-ALPHA-2026`), and channel automatically deletes after 10 seconds.
- **Configurable Staff Settings**: Zero hardcoded names — configure via role IDs or usernames in `config.json`.

---

## Setup & Running

### 1. Install Dependencies
```bash
cd bot
npm install
```

### 2. Configure Credentials
In `bot/.env`:
```env
DISCORD_BOT_TOKEN=your_bot_token_from_discord_developer_portal
PORT=3001
```

In `bot/config.json`:
- `guildId`: `1372095730696716379` (Kavyon Server)
- `ticketCategoryId`: ID of the Discord Category where tickets should be created (Optional)
- `staffRoleId`: ID of the Staff Role
- `seniorStaffRoleId`: ID of Senior Staff / Council Role
- `seniorStaffUsernames`: Array of usernames authorized as Senior Staff (e.g. `["carbonthecoder"]`)
- `ringKey`: `UNC-ALPHA-2026`

### 3. Required Discord Bot Intents (Developer Portal)
Enable the following in **Discord Developer Portal -> Bot -> Privileged Gateway Intents**:
- ✅ **Server Members Intent** (Required to check membership)
- ✅ **Message Content Intent**

### 4. Start the Bot & API
```bash
node index.js
```
The API listens on `http://localhost:3001` and connects to the website application form!
