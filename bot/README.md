# The Uncommons // Discord Council Review Bot

Automated Admissions Bot, Ticket Desk & Sovereign Node Vault for **The Uncommons × Kavyon**.

## Features
- **Server Membership Verification**: Real-time debounce check verifying applicant membership in Kavyon. Blocks non-members with direct server invite link.
- **Private Channel Intake**: Creates `#ticket-[username]` visible only to the applicant and configured Council Reviewers.
- **Username-Based Reviewer Registry**: No Discord roles required! Simply list usernames in `config.json`.
- **Multi-Staff Failover & Takeover**: If the assigned lead is busy or AFK, any other configured reviewer can click `[ ⚡ Take Over Review ]` or `[ 🟢 Ratify & Forge Key ]` to continue without delay.
- **Dynamic Unique Ring Keys**: Every ratified candidate receives a cryptographically unique key (`UNC-KEY-XXXX-2026`).
- **Staff-Only Key Ledger**: Every issued key is permanently logged into private `#webring-key-ledger` (hidden from `@everyone`).
- **Discord Role Automation**: Auto-awards `🌐・The Uncommons` role upon council ratification.
- **Cyberpunk Sovereign Slang**: High-agency terminal aesthetic, sleek embeds, and hacker slang for all communications.

---

## Configuration (`bot/config.json`)

```json
{
  "guildId": "1372095730696716379",
  "ticketCategoryId": "1550541993250267166",
  "reviewerUsernames": ["carbonthecoder", "another_reviewer"],
  "seniorStaffUsernames": ["carbonthecoder"],
  "staffRoleId": "1534750546400116789",
  "seniorStaffRoleId": "1534750849006567484",
  "keyLedgerChannelId": "1551036698757038181",
  "webringRoleId": "1551036702766796800",
  "port": 3001
}
```

### Adding Reviewers (No Roles Needed):
Just add their Discord usernames or user IDs to `"reviewerUsernames"`:
```json
"reviewerUsernames": [
  "carbonthecoder",
  "your_friend_username",
  "third_staff_handle"
]
```
Anyone listed here:
1. Is automatically added to all new ticket channels with full read/write/embed permissions.
2. Can claim lead control via `[ ⚡ Take Over Review ]`.
3. Can ratify applicants and forge Ring Keys via `[ 🟢 Ratify & Forge Key ]`.
4. Can broadcast to all reviewers via `[ 📢 Signal Council ]`.

---

## Running the Bot

```bash
cd bot
node index.js
```
The Admissions API listens on `http://localhost:3001` and connects the web application (`/apply`, `/seal`) directly to Discord!
