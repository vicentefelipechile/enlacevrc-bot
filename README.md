# EnlaceVRC Bot

Discord bot that links and verifies VRChat accounts within a Discord server. Users authenticate via VRChat bio verification — no passwords or third-party OAuth required. Built on TypeScript and plain Discord.js with a serverless backend powered by Cloudflare Workers and D1 as edge database.

---

## 📚 Usage Example

### Develop & Build
```bash
# Run in watch mode (no build step, via tsx)
npm run dev

# Type-check, build to dist/ and run the compiled bot
npm run typecheck
npm run build
npm run start
```

### CLI Management Scripts
The project includes several CLI scripts for managing users and staff directly:

```bash
# Login to VRChat
npm run login

# User Management
npm run adduser
npm run getuser
npm run deluser

# Staff Management
npm run liststaff
npm run addstaff
npm run removestaff

# Deploy Slash Commands
npm run deploy-commands
```

---

## 📂 Project Structure

```
src/
├── index.ts            # Main entry point: client, command registry, event wiring
├── commands/           # Slash commands (each exports a { data, execute, ... } object)
│   ├── types.ts        # Shared Command shape
│   └── index.ts        # Flat registry of every command
├── events/             # ready / guildCreate / interactionCreate handlers
├── services/           # d1.ts (Cloudflare D1 client) + vrchat.ts (VRChat API)
├── config/env.ts       # Validated, typed environment configuration
├── constants/          # Static configuration (Discord setting keys)
├── lib/                # logger, i18n, cooldown and small helpers
├── ui/                 # Embed / Components V2 builders
└── types/              # Shared model and client types

scripts/                # CLI management scripts (deploy-commands + user/staff admin)
```

Commands follow the official Discord.js command-handling pattern: each file exports a plain
`{ data, execute, autocomplete?, handleButton? }` object that `index.ts` stores in a `Collection`
and `events/interactionCreate.ts` dispatches by name (and, for buttons, by the `customId` prefix).

---

## 🔑 Required Environment Variables

Create a `.env` file with the following variables:

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord Bot Token |
| `DISCORD_CLIENT_SECRET` | Discord Client Secret |
| `DISCORD_CLIENT_ID` | Discord Client ID |
| `DISCORD_STAFF_ID` | Discord ID used as the identity for CLI admin scripts |
| `D1_PRIVATE_KEY` | Cloudflare D1 API Key |
| `D1_URL` | Cloudflare D1 Database URL |
| `VRCHAT_USERNAME` | VRChat Username |
| `VRCHAT_PASSWORD` | VRChat Password |
| `VRCHAT_EMAIL_CONTACT` | Contact Email for VRChat API |
| `VRCHAT_APPLICATION_NAME` | Application Name for VRChat API |

---

## 📍 Main Commands

The bot includes the following slash commands:

- `/profile`: Manage user profiles.
- `/settings`: Configure bot settings.
- `/sync`: Synchronize Discord and VRChat data.
- `/verification`: Handle user verification processes.
- `/verifyuser`: Verify a specific user.
- `/viewprofile`: View a user's profile.

---

## 🛠 Tech Stack

- **Language:** TypeScript (ESM, NodeNext)
- **Runtime:** Node.js
- **Framework:** Discord.js (plain, official command-handling pattern)
- **Database:** Cloudflare D1 (via REST API)
- **Integration:** VRChat API

---

## 📄 License

MIT © 2025 Vicente
