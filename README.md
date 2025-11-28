# EnlaceVRC Bot

Main Discord bot for managing commands and events, including VRChat integration and modular command handling.

---

## 📚 Usage Example

### Start the Bot
```bash
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
├── commands/        # Discord slash commands
├── events/          # Event handlers
├── vrchat/          # VRChat integration logic
├── d1class.js       # Cloudflare D1 database wrapper
├── env.js           # Environment variables configuration
└── bot.js           # Main entry point

cmds/                # CLI management scripts
```

---

## 🔑 Required Environment Variables

Create a `.env` file with the following variables:

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Discord Bot Token |
| `DISCORD_CLIENT_SECRET` | Discord Client Secret |
| `DISCORD_CLIENT_ID` | Discord Client ID |
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

- **Runtime:** Node.js
- **Framework:** Discord.js
- **Database:** Cloudflare D1 (via REST API)
- **Integration:** VRChat API
- **Command Handler:** js-discord-modularcommand

---

## 📄 License

MIT © 2025 Vicente
