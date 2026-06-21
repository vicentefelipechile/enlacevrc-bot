# AGENTS.md — EnlaceVRC Bot

Guidance for AI agents and contributors working in this repository. Read this before making changes.

---

## What this project is

EnlaceVRC is a Discord bot that links and verifies VRChat accounts inside Discord servers. A user
proves ownership of a VRChat account by placing a bot-generated code in their VRChat bio; once
verified, that verification is **global** — it carries across every server running the bot. The bot
also manages role/nickname synchronization and VRChat group membership (invite/kick) from Discord.

The backend is a Cloudflare Workers + D1 database, reached over an authenticated HTTP API. The bot
talks to VRChat through the official VRChat SDK.

---

## Tech stack

| Concern | Choice |
|---|---|
| Language | TypeScript, **ESM** (`"type": "module"`), `module`/`moduleResolution` = **NodeNext** |
| Runtime | Node.js (target **ES2023**) |
| Discord | `discord.js` v14, **official command-handling pattern** (plain objects in a `Collection`) |
| VRChat | `vrchat` SDK, session persisted with `keyv-file` |
| Database | Cloudflare D1 via REST (`D1Class`), cached with `node-cache` |
| Dev tooling | `tsx` (run/watch), `tsc` (build/typecheck), ESLint (flat, type-aware), Prettier |

Because resolution is NodeNext + ESM, **all relative imports use a `.js` specifier even when the
source file is `.ts`** (e.g. `import { env } from "../config/env.js"`). This is required, not optional.

---

## Directory layout

```
src/
├── index.ts              # Entry point: build client, register commands, wire events, login, shutdown
├── commands/
│   ├── types.ts          # The Command shape every command file conforms to
│   ├── index.ts          # allCommands — the flat registry of every command
│   └── <command>.ts      # One file per command (a few define more than one)
├── events/
│   ├── ready.ts          # onClientReady: VRChat sign-in + warm the group cache
│   ├── guildCreate.ts    # onGuildCreate: register a new server in D1
│   └── interactionCreate.ts  # onInteractionCreate: the single interaction router
├── services/
│   ├── d1.ts             # D1Class — static client for the Cloudflare D1 worker (cached)
│   └── vrchat.ts         # VRCHAT_CLIENT + signIn() + notification handling
├── config/env.ts         # Validated, typed environment configuration (fail-fast)
├── constants/            # Static configuration (e.g. D1 setting keys)
├── lib/                  # logger, i18n (createLocalizer), cooldown, small helpers
├── ui/                   # Embed / Components V2 builders shared across commands
├── types/                # Shared model types (models.ts) and the BotClient type (client.ts)
└── data/                 # Static JSON data files

scripts/
├── deploy-commands.ts    # Register slash commands with Discord (global + per guild)
├── lib/admin.ts          # Shared helpers for the admin CLI scripts
└── <task>.ts             # One CLI script per admin task

img/                      # Image assets attached to command replies
```

---

## The command pattern (read this carefully)

Commands follow the **official discord.js command-handling pattern**. There is **no abstraction layer
or framework** — the logic, permission checks, localization and cooldowns all live inside each
command using native discord.js APIs.

Every command file exports a plain object conforming to `Command` (`src/commands/types.ts`):

```ts
export interface Command {
  data: CommandData;                                            // SlashCommandBuilder (or *Only variants)
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
  handleButton?(interaction: ButtonInteraction): Promise<void>;
}
```

Most files end with:

```ts
export const command: Command = { data, execute /*, autocomplete, handleButton */ };
```

A file that defines **more than one command** exports an array instead:

```ts
export const commands: Command[] = [verificationCommand, howToVerifyCommand];
```

### Registering a command

`src/commands/index.ts` imports each command explicitly and lists it in the `allCommands` array.
**Commands are registered explicitly — the directory is never scanned at runtime.** When you add a
command:

1. Create `src/commands/<name>.ts` exporting `command` (or `commands`).
2. Import it in `src/commands/index.ts` and add it to `allCommands` (spread the array form).
3. Run `npm run deploy-commands` to push the slash definition to Discord.

`src/index.ts` loads `allCommands` into `client.commands` (a `Collection<string, Command>`) keyed by
`command.data.name`.

---

## Interaction routing

`src/events/interactionCreate.ts` is the **single router**. It dispatches by interaction kind:

| Interaction | Looked up by | Calls |
|---|---|---|
| Chat input command | `interaction.commandName` | `command.execute` |
| Autocomplete | `interaction.commandName` | `command.autocomplete` |
| Button | `customId` prefix before the first `_` | `command.handleButton` |

**Button custom IDs MUST be prefixed with the owning command's name**, formatted as
`${command}_${component}` (e.g. `verification_verify`, `howitworks_page_3`). The router extracts the
segment before the first `_`, looks up that command, and forwards the interaction to its
`handleButton`. A command without a matching `handleButton` is simply ignored.

For purely local pagination / short-lived flows, a command may instead use a
`createMessageComponentCollector` on its own reply (see `search.ts`) rather than `handleButton`.
Use the collector approach for ephemeral, self-contained navigation; use `handleButton` for buttons
that must keep working on persistent (non-collected) messages.

---

## Localization (i18n)

Only the **locale-selection logic** is centralized, in `src/lib/i18n.ts` via `createLocalizer`.
Phrases are declared **inline, per command**, as a single object.

```ts
const localize = createLocalizer({
  [Locale.EnglishUS]:    { title: "Invite Bot",  /* ... */ },
  [Locale.SpanishLATAM]: { title: "Invitar Bot", /* ... */ },
  [Locale.SpanishES]:    { title: "Invitar al Bot", /* ... */ },
});

// inside execute/handleButton:
const phrases = localize(interaction.locale);
```

Rules:

- **EnglishUS is required** — it is the fallback. Any locale absent from the map falls back to it.
- `SpanishLATAM` and `SpanishES` are optional per command.
- `T` is inferred from the English table, so you never declare an interface or `Record` for phrases.
- Key naming convention: `category.element` (e.g. `error.not_verified`, `embed.title`).
- Slash-command **descriptions** use the native `setDescription()` (English) +
  `setDescriptionLocalizations({...})`.

### Spanish variants

- `SpanishLATAM`: professional, neutral Spanish.
- `SpanishES`: exaggerated, stereotypically Spanish speech ("¡Tío!", "¡Ostras, chaval!",
  "¡Madre mía!"). This is intentional flavor; keep it when editing those strings.

---

## Services

### `D1Class` (`src/services/d1.ts`)

A **static class** wrapping authenticated HTTP calls to the D1 worker, with a `node-cache` layer.
Call sites use `D1Class.method(...)`. Conventions:

- Reads go through `_getCached` with a TTL chosen by data volatility (profile/staff/discord/group).
- Mutations invalidate the relevant cache key(s).
- The generic `_request<T>` helper sends auth + identity headers; the worker returns a `{ data }`
  envelope (mutations return a `{ success, message }`-style envelope).
- Every D1 call needs a `UserRequestData` (`{ discord_id, discord_name }`) identifying the caller.
  In commands this is the invoking user; in scripts/events it is the configured identity.
- Initialize once at startup with `D1Class.init({ apiKey: env.D1_PRIVATE_KEY })`.

### VRChat (`src/services/vrchat.ts`)

- `VRCHAT_CLIENT` is a `VRChatExtended` instance. The "Extended" part reaches into the SDK's
  protected `_client` to call notification endpoints the generated SDK doesn't expose; those casts go
  through `as unknown` and are commented.
- `signIn()` reuses the persisted session and falls back to an interactive 2FA prompt (`readline`)
  on stdin. The session cookie is stored via `keyv-file` in `data.json`.
- Group invites/kicks use the real SDK methods: `createGroupInvite({ path: { groupId }, body:
  { userId } })` and `kickGroupMember({ path: { groupId, userId } })`.

---

## Events & entry point

- **`src/index.ts`** initializes `D1Class`, builds the `Client` (intents: `GuildMembers`, `Guilds`),
  loads `allCommands` into `client.commands`, creates the `client.vrchatGroups` cache, wires the three
  events with `void`, logs in, and installs a **single guarded `gracefulShutdown`** used by `SIGINT`,
  `SIGTERM` and `uncaughtException`.
- **`ready.ts`** signs in to VRChat and populates `client.vrchatGroups` (a
  `Collection<guildId, VRChatGroup[]>`) so the `group` autocomplete is instant. Per-server caching
  failures are logged and skipped.
- **`guildCreate.ts`** finds the inviter via the audit log (`AuditLogEvent.BotAdd`), falling back to
  the bot itself, then registers the server in D1 idempotently.

The bot extends the discord.js `Client` with two collections via the `BotClient` type
(`src/types/client.ts`): `commands` and `vrchatGroups`. Cast to `BotClient` when you need them.

---

## Commands reference

| Command | Subcommands / options | Notes |
|---|---|---|
| `/invite` | — | Link button to the OAuth2 invite URL. |
| `/howitworks` | — | 7-page paginated guide; `handleButton` (prefix `howitworks`). |
| `/howtoverify` | — | Shows the verification tutorial video. |
| `/verification` | `vrchat` (URL, optional) | Verify/unverify flow; `handleButton` (prefix `verification`). |
| `/verifyuser` | `user` | Staff-only 18+ verification of another user. |
| `/profile` | — | Show the invoking user's VRChat profile. |
| `/viewprofile` | `user` | Show another user's profile. |
| `/sync` | — | Re-apply roles/nickname from the user's VRChat profile. |
| `/adduser` | `user`, `vrchat_id` | Link a Discord user to a VRChat id. |
| `/ban` | `user`, `id` | Ban a profile (by user or by id), with a reason. |
| `/unban` | `user` | Unban a profile. |
| `/worldinfo` | `world` | Look up a VRChat world by id/URL. |
| `/search` | `world`, `avatar`, `user` | Paginated VRChat search; uses a local component collector. |
| `/settings` | `verification-role`, `verification-plus-role`, `auto-nickname`, `log-channel`, `view`, `reset` | Per-server configuration. |
| `/group` | `invite`, `kick`, `viewpermissions` | VRChat group management; `group` option uses autocomplete from `client.vrchatGroups`. |
| `/linkgroup` | — | Multi-step state-machine flow to link a VRChat group; `handleButton` (prefix `linkgroup`). |

(Names above reflect the slash command names; consult each file for the exact option spelling.)

---

## Code style & conventions

These apply to **every** source file. Match the surrounding code.

1. **File order, top to bottom:** header block → imports → constants → types → helpers → main logic →
   exports. Never interleave.
2. **Section separators:** a full-width comment **105 characters wide** using `//` and `=`. The
   header block is a separator, the section name, another separator, then a short description of the
   file's purpose (the *why*).
3. **Import grouping:** Node built-ins → external packages → project-local modules, with a blank line
   between groups. Named imports preferred. No unused imports.
4. **Language:** all code artifacts (identifiers, comments, logs, error messages) are in **English**.
   Only user-facing localized phrases may be in other languages.
5. **Naming:** `camelCase` for variables/functions, `PascalCase` for types/classes,
   `UPPER_SNAKE_CASE` for constants. Group related constants in `as const` objects. Files are
   kebab-case (commands keep their slash name).
6. **Constants over magic values:** extract magic strings/numbers to named constants.
7. **Comments explain *why*, not *what*.** Single-line, placed above the relevant line, never to the
   right of code.
8. **Errors:** wrap fallible async work in `try/catch`; never silently swallow (log at minimum).
   Return early on errors. Show localized, user-friendly messages while logging the detail.

### TypeScript strictness

`tsconfig.json` enables `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noPropertyAccessFromIndexSignature`, `noImplicitOverride`, and `noFallthroughCasesInSwitch`.
Practical consequences you will hit:

- Index-signature access requires bracket notation: `settings["auto_nickname"]`, not `.auto_nickname`.
- Array/record indexing yields `T | undefined`; narrow or provide a fallback.
- Optional object properties cannot be set to `undefined`; build the object conditionally instead of
  `{ iconURL: undefined }`.

---

## Discord-specific notes

- **Components V2** (`ContainerBuilder`, `SectionBuilder`, `TextDisplayBuilder`, `ThumbnailBuilder`,
  `MediaGalleryBuilder`, `SeparatorBuilder`) require `flags: MessageFlags.IsComponentsV2` alongside
  the `components` array on the reply.
- **Defer early.** Use `interaction.deferReply()` at the start of `execute` and respond with
  `editReply()`. Ephemerality is decided at defer time, not on `editReply`.
- **Permission gating** uses native `setDefaultMemberPermissions()` on the builder and/or explicit
  checks inside `execute` — not an interception layer.
- **Cooldowns:** call `checkCooldown(commandName, userId, seconds)` from `src/lib/cooldown.ts`
  yourself when a command needs rate-limiting, and act on the returned `CooldownState`. Nothing
  intercepts interactions on your behalf.

---

## Environment configuration

`src/config/env.ts` loads `.env` (dotenv), validates required keys **fail-fast** (a missing required
variable aborts startup), and exports a typed `env` object. Required variables:

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `DISCORD_CLIENT_ID` | Application/client id |
| `DISCORD_STAFF_ID` | Identity used by the CLI admin scripts |
| `D1_PRIVATE_KEY` | D1 worker API key |
| `D1_URL` | D1 worker base URL |
| `VRCHAT_USERNAME` / `VRCHAT_PASSWORD` | VRChat credentials |
| `VRCHAT_EMAIL_CONTACT` | Contact email sent in the VRChat API user-agent |
| `VRCHAT_APPLICATION_NAME` | Application name for the VRChat API |

`DISCORD_CLIENT_SECRET` is optional. See `.env.example` for the full template.

---

## Scripts (npm)

```bash
npm run dev              # Run with tsx in watch mode (no build step)
npm run build            # Compile to dist/ with tsc
npm run start            # Run the compiled bot (node dist/src/index.js)
npm run typecheck        # tsc --noEmit
npm run lint             # eslint .
npm run format           # prettier --write .

npm run deploy-commands  # Register slash commands (global + per registered server)

# Admin CLI (share scripts/lib/admin.ts; act under DISCORD_STAFF_ID)
npm run login            # Interactive VRChat sign-in (persists the session cookie)
npm run adduser <discord_id> <vrchat_id>
npm run getuser <discord_id | vrchat_id>
npm run deluser <discord_id | vrchat_id>     # asks for confirmation
npm run liststaff
npm run addstaff <discord_id> <discord_name>
npm run removestaff <discord_id>
```

Run `npm run login` once before first start so the VRChat session cookie exists.

---

## Adding things — quick recipes

**A new command:** create `src/commands/<name>.ts` (header → imports → constants → `localize` →
types → helpers → `data` builder → `execute`/`handleButton` → `export const command`), register it in
`src/commands/index.ts`, then `npm run deploy-commands`. If it has buttons, prefix their custom IDs
with the command name and add `handleButton`.

**A new D1 endpoint:** add a static method to `D1Class` following the existing pattern (use
`_request<T>`, read through `_getCached` with an appropriate TTL, invalidate on mutation), and add
the response/input types to `src/types/models.ts`.

**A new admin script:** create `scripts/<task>.ts`, reuse `scripts/lib/admin.ts` for validation and
identity, parse `process.argv`, exit `0`/`1`, and add an npm script entry.

---

## Do not commit

`.gitignore` already excludes these — never add them to a commit:

- `.env` and its variants
- `data.json` (VRChat session cookie) and `grp_*.json` (cached group dumps) — both regenerated at
  runtime
- `dist/` (build output)
- `node_modules/`

---

## Before you finish a change

Run the verification trio and make sure all are clean:

```bash
npm run typecheck && npm run lint && npm run build
```

Then clean up `dist/` if you only built to verify. Do not commit or push unless explicitly asked.
