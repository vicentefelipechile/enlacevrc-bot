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
│   ├── guildMemberAdd.ts # onGuildMemberAdd: welcome ping + self-heal the welcome panel
│   └── interactionCreate.ts  # onInteractionCreate: the single interaction router
├── services/
│   ├── d1.ts             # D1Class — static client for the Cloudflare D1 worker (cached)
│   └── vrchat.ts         # VRCHAT_CLIENT + signIn() + notification handling
├── config/env.ts         # Validated, typed environment configuration (fail-fast)
├── constants/            # Static configuration (D1 setting keys + per-setting type metadata)
├── lib/                  # logger, i18n (createLocalizer), cooldown, vrchat-code (bio-code
│                         #   derivation / VRChat id extraction), random-color, small helpers
├── ui/                   # Embed / Components V2 builders shared across commands (container,
│                         #   profile, verify-video, welcome-panel, social-icons, instance-parser)
├── types/                # Shared model types (models.ts) and the BotClient type (client.ts)
└── data/                 # Static JSON data files (permissions.json — VRChat group permission catalog)

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
  handleModal?(interaction: ModalSubmitInteraction): Promise<void>;
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
| Modal submit | `customId` prefix before the first `_` | `command.handleModal` |

**Button and modal custom IDs MUST be prefixed with the owning command's name**, formatted as
`${command}_${component}` (e.g. `verification_verify`, `verification_modal`, `howitworks_page_3`). The
router extracts the segment before the first `_`, looks up that command, and forwards the interaction to
its `handleButton` / `handleModal`. A command without the matching handler is simply ignored.

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
  loads `allCommands` into `client.commands`, creates the `client.vrchatGroups` cache, wires the four
  events with `void`, logs in, and installs a **single guarded `gracefulShutdown`** used by `SIGINT`,
  `SIGTERM` and `uncaughtException` (which exits non-zero so a supervisor can restart);
  `unhandledRejection` is logged but does not shut down.
- **`ready.ts`** signs in to VRChat and populates `client.vrchatGroups` (a
  `Collection<guildId, VRChatGroup[]>`) so the `group` autocomplete is instant. Per-server caching
  failures are logged and skipped.
- **`guildCreate.ts`** finds the inviter via the audit log (`AuditLogEvent.BotAdd`), falling back to
  the bot itself, then registers the server in D1 idempotently.
- **`guildMemberAdd.ts`** runs when a member joins. If the welcome ping is enabled
  (`welcome_ping_enabled`) and a panel channel is set (`welcome_panel_channel`), it self-heals the
  welcome panel (re-publishing it if its recorded message id is gone) and pings the member there to
  pull their attention to it, deleting the ping after ~8s so the channel stays clean. Bots are ignored.
  Post-configuration failures (channel deleted, send permission revoked) are reported to the
  configured `log_channel`, or stdout as a last resort, and never crash the gateway. **This needs the
  Server Members privileged intent enabled in the Developer Portal**, not just the `GuildMembers`
  gateway intent.

The bot extends the discord.js `Client` with two collections via the `BotClient` type
(`src/types/client.ts`): `commands` and `vrchatGroups`. Cast to `BotClient` when you need them.

---

## Commands reference

| Command | Subcommands / options | Notes |
|---|---|---|
| `/invite` | — | Link button to the OAuth2 invite URL. |
| `/howitworks` | — | 7-page paginated guide; `handleButton` (prefix `howitworks`). |
| `/howtoverify` | — | Shows the verification tutorial video. |
| `/verification` | `vrchat` (URL), `username` (both optional) | Verify/unverify flow; also reachable via the welcome panel modal; `handleButton` + `handleModal` (prefix `verification`). |
| `/profile` | — | Show the invoking user's VRChat profile. |
| `/viewprofile` | `user` | Show another user's profile. |
| `/sync` | — | Re-apply roles/nickname from the user's VRChat profile. |
| `/worldinfo` | `world` | Look up a VRChat world by id/URL. |
| `/search` | `world`, `avatar`, `user` | Paginated VRChat search; uses a local component collector. |
| `/settings` | `set role\|channel\|toggle <variable> <value>`, `view`, `reset` | Per-server configuration (see below). |
| `/welcomepanel` | `send [language]`, `preview`, `refresh` | Publishes/operates the static onboarding panel (language: Español/English, stored); `handleButton` (prefix `welcomepanel`). |
| `/group` | `invite`, `kick`, `viewpermissions` | VRChat group management; `group` option uses autocomplete from `client.vrchatGroups`. |
| `/linkgroup` | — | Multi-step state-machine flow to link a VRChat group; `handleButton` (prefix `linkgroup`). |
| `/staff` | `user add\|ban\|banid\|unban\|verify`, `member add\|remove\|list` | Staff-only management (see below). |

(Names above reflect the slash command names; consult each file for the exact option spelling.)

### The `/settings` command

Configuration is structured as `set` / `view` / `reset`. Because a slash option can't change type based
on another option, `set` is split by **input type** into three subcommands so each keeps its native
Discord picker: `set role <variable> <role>`, `set channel <variable> <channel>`,
`set toggle <variable> <enabled>`. The `variable` option is a **closed choice list** scoped to that
type (e.g. `set role` only offers role settings), so invalid combinations can't be expressed.

The single source of truth is `SETTING_METADATA` in `src/constants/discord-settings.ts`: a list of
`{ key, type }` (`type` ∈ `role | channel | toggle`). `set` builds each group's choices from it, `view`
iterates it to render every setting, and `reset` lists it plus an "All" option. **To add a
user-editable setting, add its key to `DISCORD_SERVER_SETTINGS`, append a `SETTING_METADATA` entry, and
add a display label in `settings.ts`'s `SETTING_LABELS` — the three subcommands pick it up
automatically.** Bot-managed bookkeeping (e.g. `welcome_panel_message`, which stores the published
panel's message id) is deliberately left out of `SETTING_METADATA` so it never appears in the menus.

### The welcome panel

A persistent onboarding message a server posts in a text channel, with a Verify button that funnels
new members into verification. Built in `src/ui/welcome-panel.ts`. The panel supports **only** Spanish
(neutral LATAM) and English. Its language is chosen when publishing via `/welcomepanel send language:` and
**stored** in `welcome_panel_language` (`es`/`en`); `resolvePanelLocale(stored, guild)` applies it, falling
back to `guild.preferredLocale` (any Spanish → LATAM, never the SpanishES flavor) when no language was
stored. Storing it means `refresh` and the member-join self-heal re-render the panel in the same language.
Configuration lives in `/settings` (`welcome_panel_channel`, `welcome_ping_enabled`); operation lives in
`/welcomepanel` (`send` publishes, records the message id, and persists the chosen language; `preview`
shows it privately in the stored language; `refresh` edits the live panel or re-publishes if deleted). Both
`welcome_panel_message` and `welcome_panel_language` are deliberately kept out of `SETTING_METADATA` (they
aren't role/channel/toggle pickers). A shared
`resolvePanelChannel` runs the send pre-flight (exists / is text / `ViewChannel` / `SendMessages`) and
turns each failure into a localized, actionable message instead of a raw `50013`. The panel's Verify
button replies ephemerally with the verification video (shared `src/ui/verify-video.ts` builder) plus an
**Enter username/URL** button. That button (built by `buildOpenModalButton`, exported from
`verification.ts`, custom id `verification_openmodal`) opens a modal (`verification_modal`) so a member
can link without typing anything in the channel — which lets owners lock down chat permissions. The modal
submit routes to `verification.handleModal`, which runs the same resolution as the slash command: a
URL/id issues the bio code immediately; a bare username is searched and the user confirms which of up to
three candidates is theirs (or it cancels). `verification.ts` shares this via `resolveInputAndReply` and
`offerUnverifyIfLinked`, used by both `execute` and `handleModal`.

### The `/staff` command

Every staff-only action lives under `/staff`, grouped by area, in `src/commands/staff/`:

| Route | Action |
|---|---|
| `/staff user add` | Link a Discord user to a VRChat id. |
| `/staff user ban` | Ban a profile by Discord user, with a reason. |
| `/staff user banid` | Ban a profile by raw profile id, with a reason. |
| `/staff user unban` | Unban a profile. |
| `/staff user verify` | 18+ verification of another user. |
| `/staff member add` | Register a new staff member in the database. |
| `/staff member remove` | Remove a staff member. |
| `/staff member list` | List all registered staff. |

`src/commands/staff/index.ts` assembles the builder from the per-subcommand modules and routes by
`group:subcommand`. Access is gated **once** in the router (`isStaff` in `staff/permissions.ts`): a
user passes when registered as staff in D1, or when they are the `DISCORD_STAFF_ID` bootstrap identity
— that bootstrap lets the root admin register the first real staff member from Discord. Each
subcommand module exports `build(group)` (adds its subcommand) and `run(interaction)` (assumes the
gate already passed). To add a subcommand, create a module, register it in `staff/index.ts`'s builder
and `ROUTES` map.

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
  - The `IS_COMPONENTS_V2` flag is **immutable per message**: once a message is sent without it you
    **cannot** `editReply` it into a V2 message (and vice versa). A button handler that edits a
    message into a V2 container only works if the original message was **already** sent as V2. So if
    a command's reply has a button whose handler renders a V2 container (e.g. `/profile`'s "Verify"
    button → the verification video), build that **original** reply as V2 too — even the simple
    text+button case — using a `TextDisplayBuilder` instead of the legacy `content` field.
  - The legacy `content` field **cannot coexist** with the V2 flag on the same message; Discord
    rejects it with `50035 MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2`. Put text in a
    `TextDisplayBuilder`, not `content`.
- **Defer early.** Use `interaction.deferReply()` at the start of `execute` and respond with
  `editReply()`. Ephemerality is decided at defer time, not on `editReply`.
- **Permission gating** uses native `setDefaultMemberPermissions()` on the builder and/or explicit
  checks inside `execute` — not an interception layer.
- **Managing roles requires a pre-flight check.** Before any `member.roles.add/remove`, verify the
  bot has `ManageRoles` (`botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)`) **and**
  that the bot's top role sits above the target role
  (`botMember.roles.highest.position > role.position`). Otherwise Discord throws `50013 Missing
  Permissions` at the API call, which surfaces as a generic "unexpected error". Check up front and
  return a localized, actionable message ("move my role above {role}"). See `grantRole` in
  `sync.ts` and the guard in `staff/user-verify.ts` for the canonical pattern. Get the bot member
  with `await guild.members.fetchMe()`.
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

npm run deploy-commands         # Register slash commands per registered server (fast propagation)
npm run deploy-commands:global  # Register commands globally (--global; slower propagation)
npm run clear-global-commands   # Remove all globally-registered commands

# Admin CLI (share scripts/lib/admin.ts; act under DISCORD_STAFF_ID)
npm run login            # Interactive VRChat sign-in (persists the session cookie)
npm run adduser <discord_id> <vrchat_id>
npm run getuser <discord_id | vrchat_id>
npm run deluser <discord_id | vrchat_id>     # asks for confirmation
npm run delgroup <grp_id>                    # unlink a VRChat group; asks for confirmation
```

Staff roster management lives in `/staff member ...` inside Discord, not in CLI scripts.

Run `npm run login` once before first start so the VRChat session cookie exists.

---

## Adding things — quick recipes

**A new command:** create `src/commands/<name>.ts` (header → imports → constants → `localize` →
types → helpers → `data` builder → `execute`/`handleButton` → `export const command`), register it in
`src/commands/index.ts`, then `npm run deploy-commands`. If it has buttons, prefix their custom IDs
with the command name and add `handleButton`.

**A new server setting:** add the key to `DISCORD_SERVER_SETTINGS`, append a `{ key, type }` entry to
`SETTING_METADATA` (both in `src/constants/discord-settings.ts`), and add a display label to
`SETTING_LABELS` in `src/commands/settings.ts`. `/settings set|view|reset` then expose it
automatically — no per-setting subcommand to write.

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
