// ========================================================================================================
// EnlaceVRC docs — internationalization + UI preferences
// ========================================================================================================
// Lightweight i18n with no dependencies. Spanish is the document's default (the HTML ships in Spanish), so
// switching to ES means "restore the original". Each translatable node carries data-i18n / data-i18n-*; the
// dictionaries below provide EN / PT / FR. Strings may contain inline markup (we author them, so they are
// trusted); those are applied with innerHTML, plain strings with textContent. Choice persists in
// localStorage and defaults to the browser language. Also wires the "effects" toggle (exposed for
// effects.js) and the language picker.
// ========================================================================================================

(function () {
  "use strict";

  // ------------------------------------------------------------------------------------------------------
  // Constants
  // ------------------------------------------------------------------------------------------------------

  const LANGS = ["es", "en", "pt", "fr"];
  const LANG_KEY = "enlacevrc.lang";
  const FX_KEY = "enlacevrc.effects";

  // ------------------------------------------------------------------------------------------------------
  // Dictionaries (es is included so we can switch back to it from another language)
  // ------------------------------------------------------------------------------------------------------

  const ES = {
    "a11y.skip": "Saltar al contenido",
    "a11y.menu": "Abrir menú",
    "nav.tag": "Documentación",
    "nav.verification": "Verificación",
    "nav.commands": "Comandos",
    "ctrl.effects": "Efectos",
    "ctrl.effects_title": "Activa o desactiva animaciones y efectos",
    "ctrl.language": "Idioma",
    "side.search": "Buscar en la guía…",
    "side.empty": "Sin resultados.",
    "side.start": "Empezar",
    "side.what": "Qué es EnlaceVRC",
    "side.how": "Cómo funciona",
    "side.add": "Agregar el bot",
    "side.panel": "Panel de bienvenida",
    "side.verification": "Verificación",
    "side.verify_account": "Verificar tu cuenta",
    "side.verify_18": "Verificación +18",
    "side.verify_global": "Verificación global",
    "side.user_cmds": "Comandos de usuario",
    "side.admin": "Administración del servidor",
    "side.staff": "Staff",
    "side.reference": "Referencia",
    "side.table": "Tabla de comandos",
    "side.privacy": "Privacidad y datos",
    "hero.badge": "Verificación global",
    "hero.sub":
      "Un bot de Discord que vincula y verifica cuentas de VRChat. El usuario demuestra que es dueño de su cuenta colocando un código en su biografía de VRChat — sin contraseñas y sin OAuth de terceros.",
    "hero.cta_verify": "Cómo verificarte",
    "hero.cta_commands": "Ver todos los comandos",
    "how.eyebrow": "Visión general",
    "how.title": "Cómo funciona",
    "how.lead":
      "EnlaceVRC conecta tu identidad de VRChat con tu cuenta de Discord y mantiene roles, apodos y la pertenencia a grupos de VRChat sincronizados desde el servidor.",
    "how.f1.title": "Prueba de propiedad por biografía",
    "how.f1.body":
      "El bot genera un código único, tú lo pegas en tu biografía de VRChat y el bot lo lee para confirmar que la cuenta es tuya. Nunca pide tu contraseña de VRChat.",
    "how.f2.title": "Verificación global",
    "how.f2.body":
      "Una vez verificado, tu vínculo vale en <strong>todos</strong> los servidores que usan el bot. No tienes que repetir el proceso en cada comunidad.",
    "how.f3.title": "Roles y apodo automáticos",
    "how.f3.body":
      "Al verificar, el servidor puede asignarte un rol de verificado y cambiar tu apodo por tu nombre de VRChat, según lo que configure el administrador.",
    "how.f4.title": "Gestión de grupos de VRChat",
    "how.f4.body":
      "Los administradores pueden invitar y expulsar miembros de un grupo de VRChat vinculado directamente desde Discord, sin salir de la app.",
    "how.add.title": "Agregar el bot a tu servidor",
    "how.add.body":
      "Usa el comando <code>/invite</code> dentro de cualquier servidor donde ya esté el bot para obtener el enlace de invitación, o pídele el enlace a quien lo administre. El bot necesita el permiso <strong>Gestionar roles</strong> y que su rol esté por encima del rol de verificado para poder asignarlo.",
    "how.add.note":
      "Si el bot no puede asignar el rol, casi siempre es porque su rol está por debajo del rol de verificado en la lista de roles del servidor. Arrástralo más arriba en <em>Ajustes del servidor → Roles</em>.",
    "how.panel.title": "Panel de bienvenida",
    "how.panel.body":
      "Para que los recién llegados sepan qué hacer, el bot puede publicar un <strong>panel de bienvenida</strong>: un mensaje fijo en un canal con un botón para iniciar la verificación. Configura el canal con <code>/settings set channel</code> y publícalo con <code>/welcomepanel send</code>, eligiendo el idioma del panel (Español o English) en la opción <code>language</code>. Si activas el ping de bienvenida (<code>/settings set toggle</code>), el bot mencionará a cada nuevo miembro en ese canal para llevar su atención al panel, y borrará la mención unos segundos después. Al pulsar <strong>Verificar</strong>, el miembro abre una ventana donde escribe su usuario o URL de VRChat — sin necesidad de escribir nada en el chat, lo que permite a los dueños mantener el canal cerrado.",
    "verify.eyebrow": "Guía paso a paso",
    "verify.title": "Verificar tu cuenta",
    "verify.lead":
      "El flujo de verificación demora un par de minutos. Puedes empezar con la URL de tu perfil, tu nombre de usuario, o sin nada para ver el video tutorial.",
    "verify.s1.title": "Ejecuta <code>/verification</code>",
    "verify.s1.body":
      "Pega la URL de tu perfil en la opción <code>vrchat</code>, o escribe tu nombre en <code>username</code>. Si usas el nombre, el bot te mostrará hasta 3 perfiles candidatos para que confirmes cuál es el tuyo.",
    "verify.s2.title": "Copia el código",
    "verify.s2.body": "El bot responde con un código de verificación de un solo uso. Cópialo tal cual.",
    "verify.s3.title": "Pégalo en tu biografía de VRChat",
    "verify.s3.body":
      "Abre tu perfil en VRChat y pega el código en cualquier parte de tu biografía. Usa el botón <em>Ir a VRChat</em> del mensaje para abrir el sitio directamente.",
    "verify.s4.title": "Presiona «Verificar»",
    "verify.s4.body":
      "El bot lee tu biografía, confirma el código y vincula tu cuenta. El código expira a los <strong>5 minutos</strong>; si se vence, vuelve a ejecutar el comando.",
    "verify.note":
      "¿No te aparece el código en la biografía? Asegúrate de haberlo guardado en VRChat antes de presionar «Verificar», y de que esté escrito exactamente igual.",
    "verify.v18.title": "Verificación +18 automática",
    "verify.v18.body":
      "Si tu edad ya está verificada en VRChat (<em>age verified</em>), el bot te otorga automáticamente la <strong>verificación +18</strong> al vincularte y, si el servidor lo configuró, te asigna el rol +18 correspondiente. No necesitas un trámite aparte.",
    "verify.global.title": "Qué significa «verificación global»",
    "verify.global.body":
      "Tu vínculo entre Discord y VRChat se guarda una sola vez y se reconoce en cualquier servidor que ejecute EnlaceVRC. Si entras a otra comunidad con el bot, ya cuentas como verificado. Para deshacer el vínculo, ejecuta <code>/verification</code> de nuevo y usa el botón <em>Desverificar</em>.",
    "cmds.eyebrow": "Referencia",
    "cmds.title": "Comandos",
    "cmds.lead":
      "Todos los comandos están disponibles en inglés y español (Latinoamérica y España). Los comandos de administración requieren permisos en el servidor.",
    "perm.all": "Todos",
    "perm.manage_server": "Gestionar servidor",
    "perm.admin": "Administrador",
    "perm.staff": "Staff",
    "cmd.verification.desc": "Vincula tu cuenta de Discord con tu perfil de VRChat, o la desvincula si ya estás verificado.",
    "cmd.verification.opt.vrchat": "URL de tu perfil de VRChat. Opcional.",
    "cmd.verification.opt.username": "Tu nombre de usuario de VRChat, como alternativa a la URL. Opcional.",
    "cmd.howtoverify.desc": "Muestra un video tutorial corto explicando cómo verificar tu cuenta de VRChat con Discord.",
    "cmd.profile.desc": "Muestra tu propio perfil de VRChat vinculado.",
    "cmd.viewprofile.desc": "Muestra el perfil de VRChat de otro usuario del servidor.",
    "cmd.viewprofile.opt.user": "El usuario de Discord cuyo perfil quieres ver.",
    "cmd.sync.desc": "Vuelve a aplicar tu rol de verificado y tu apodo a partir de tu perfil de VRChat. Útil si perdiste el rol o cambiaste de nombre.",
    "cmd.worldinfo.desc": "Busca un mundo de VRChat por su ID o URL y muestra su información.",
    "cmd.worldinfo.opt.world": "ID o URL del mundo de VRChat.",
    "cmd.search.desc": "Búsqueda paginada en VRChat. Elige qué tipo de resultado buscar y navega entre páginas con botones.",
    "cmd.search.opt.world": "Buscar mundos por nombre.",
    "cmd.search.opt.avatar": "Buscar avatares por nombre.",
    "cmd.search.opt.user": "Buscar usuarios por nombre.",
    "cmd.invite.desc": "Devuelve un botón con el enlace para invitar el bot a otro servidor de Discord.",
    "cmd.howitworks.desc": "Guía interactiva de 7 páginas que explica el bot paso a paso, con botones para navegar entre páginas.",
    "cmd.settings.desc": "Configura el comportamiento del bot en tu servidor. Requiere el permiso <strong>Gestionar servidor</strong>.",
    "cmd.settings.set_intro": "Los ajustes se cambian con <code>set</code>, agrupado por tipo de valor para conservar los selectores nativos de Discord:",
    "cmd.settings.opt.set_role": "Elige un ajuste de rol (rol de verificado o rol +18) y el rol a asignar.",
    "cmd.settings.opt.set_channel": "Elige un ajuste de canal (canal de log o canal del panel de bienvenida) y el canal.",
    "cmd.settings.opt.set_toggle": "Activa o desactiva un ajuste (apodo automático o ping de bienvenida).",
    "cmd.settings.opt.view": "Muestra la configuración actual del servidor.",
    "cmd.settings.opt.reset": "Restablece un ajuste concreto o todos a la vez.",
    "cmd.welcomepanel.desc": "Publica y administra el panel de bienvenida: un mensaje fijo con un botón para que los recién llegados empiecen a verificarse. Configura primero el canal con <code>/settings set channel</code>. Requiere el permiso <strong>Gestionar servidor</strong>.",
    "cmd.welcomepanel.opt.send": "Publica el panel en el canal configurado y guarda su mensaje. Con <code>language</code> eliges el idioma del panel (Español o English); se guarda para que las actualizaciones usen el mismo.",
    "cmd.welcomepanel.opt.preview": "Te muestra el panel en privado, sin publicarlo en el canal.",
    "cmd.welcomepanel.opt.refresh": "Actualiza el panel ya publicado; si fue borrado, lo vuelve a publicar.",
    "cmd.group.desc": "Gestiona el grupo de VRChat vinculado al servidor. La opción de grupo se autocompleta. Requiere el permiso <strong>Administrador</strong>.",
    "cmd.group.opt.invite": "Invita a un usuario al grupo de VRChat.",
    "cmd.group.opt.kick": "Expulsa a un usuario del grupo de VRChat.",
    "cmd.group.opt.perms": "Muestra qué permisos tiene el bot dentro del grupo.",
    "cmd.linkgroup.desc": "Flujo guiado de varios pasos para vincular un grupo de VRChat con el servidor de Discord. Usa botones para avanzar por cada paso.",
    "cmd.staff.desc": "Acciones reservadas al staff registrado del bot, agrupadas por área. El acceso se controla una sola vez en el enrutador.",
    "cmd.staff.users": "Usuarios",
    "cmd.staff.user.add": "Vincula manualmente un usuario de Discord con un ID de VRChat.",
    "cmd.staff.user.ban": "Banea un perfil por usuario de Discord, con motivo.",
    "cmd.staff.user.banid": "Banea un perfil por su ID de perfil, con motivo.",
    "cmd.staff.user.unban": "Quita el baneo a un perfil.",
    "cmd.staff.user.verify": "Verificación +18 de otro usuario.",
    "cmd.staff.members": "Miembros del staff",
    "cmd.staff.member.add": "Registra un nuevo miembro del staff.",
    "cmd.staff.member.remove": "Elimina a un miembro del staff.",
    "cmd.staff.member.list": "Lista todo el staff registrado.",
    "table.eyebrow": "Resumen",
    "table.title": "Tabla de comandos",
    "table.lead": "Vista rápida de cada comando y quién puede usarlo.",
    "table.h.cmd": "Comando",
    "table.h.use": "Para qué sirve",
    "table.h.access": "Acceso",
    "table.r.verification": "Verificar o desvincular tu cuenta de VRChat",
    "table.r.howtoverify": "Video tutorial de verificación",
    "table.r.profile": "Ver tu perfil de VRChat",
    "table.r.viewprofile": "Ver el perfil de otro usuario",
    "table.r.sync": "Reaplicar rol y apodo desde tu perfil",
    "table.r.worldinfo": "Información de un mundo de VRChat",
    "table.r.search": "Buscar mundos, avatares o usuarios",
    "table.r.invite": "Enlace para invitar el bot",
    "table.r.howitworks": "Guía interactiva de 7 páginas",
    "table.r.settings": "Configurar el bot en el servidor",
    "table.r.welcomepanel": "Publicar el panel de bienvenida",
    "table.r.group": "Invitar, expulsar y ver permisos del grupo",
    "table.r.linkgroup": "Vincular un grupo de VRChat",
    "table.r.staff": "Gestión de usuarios y staff",
    "priv.eyebrow": "Transparencia",
    "priv.title": "Privacidad y datos",
    "priv.body1":
      "EnlaceVRC no te pide tu contraseña de VRChat ni usa OAuth de terceros. La propiedad de la cuenta se prueba con un código temporal en tu biografía, que puedes borrar en cuanto termines de verificar.",
    "priv.body2":
      "El vínculo entre tu ID de Discord y tu ID de VRChat se guarda para hacer válida la verificación global. Puedes eliminar ese vínculo en cualquier momento con el botón <em>Desverificar</em> de <code>/verification</code>.",
    "footer.tagline": "EnlaceVRC · Bot de verificación de VRChat para Discord",
    "footer.source": "Código fuente",
  };

  const EN = {
    "a11y.skip": "Skip to content",
    "a11y.menu": "Open menu",
    "nav.tag": "Documentation",
    "nav.verification": "Verification",
    "nav.commands": "Commands",
    "ctrl.effects": "Effects",
    "ctrl.effects_title": "Toggle animations and effects",
    "ctrl.language": "Language",
    "side.search": "Search the guide…",
    "side.empty": "No results.",
    "side.start": "Get started",
    "side.what": "What is EnlaceVRC",
    "side.how": "How it works",
    "side.add": "Add the bot",
    "side.panel": "Welcome panel",
    "side.verification": "Verification",
    "side.verify_account": "Verify your account",
    "side.verify_18": "18+ verification",
    "side.verify_global": "Global verification",
    "side.user_cmds": "User commands",
    "side.admin": "Server administration",
    "side.staff": "Staff",
    "side.reference": "Reference",
    "side.table": "Command table",
    "side.privacy": "Privacy & data",
    "hero.badge": "Global verification",
    "hero.sub":
      "A Discord bot that links and verifies VRChat accounts. Users prove they own their account by placing a code in their VRChat bio — no passwords, no third-party OAuth.",
    "hero.cta_verify": "How to verify",
    "hero.cta_commands": "See all commands",
    "how.eyebrow": "Overview",
    "how.title": "How it works",
    "how.lead":
      "EnlaceVRC connects your VRChat identity to your Discord account and keeps roles, nicknames and VRChat group membership in sync from the server.",
    "how.f1.title": "Bio-based proof of ownership",
    "how.f1.body":
      "The bot generates a unique code, you paste it into your VRChat bio, and the bot reads it to confirm the account is yours. It never asks for your VRChat password.",
    "how.f2.title": "Global verification",
    "how.f2.body":
      "Once verified, your link counts on <strong>every</strong> server running the bot. You don't have to repeat the process in each community.",
    "how.f3.title": "Automatic roles & nickname",
    "how.f3.body":
      "On verification, the server can assign you a verified role and change your nickname to your VRChat name, depending on the admin's setup.",
    "how.f4.title": "VRChat group management",
    "how.f4.body":
      "Admins can invite and kick members of a linked VRChat group straight from Discord, without leaving the app.",
    "how.add.title": "Add the bot to your server",
    "how.add.body":
      "Use the <code>/invite</code> command inside any server that already has the bot to get the invite link, or ask whoever manages it. The bot needs the <strong>Manage Roles</strong> permission and its role must sit above the verified role to assign it.",
    "how.add.note":
      "If the bot can't assign the role, it's almost always because its role sits below the verified role in the server's role list. Drag it higher in <em>Server Settings → Roles</em>.",
    "how.panel.title": "Welcome panel",
    "how.panel.body":
      "So newcomers know what to do, the bot can post a <strong>welcome panel</strong>: a pinned-style message in a channel with a button to start verification. Set the channel with <code>/settings set channel</code> and publish it with <code>/welcomepanel send</code>, picking the panel's language (Español or English) in the <code>language</code> option. If you enable the welcome ping (<code>/settings set toggle</code>), the bot mentions each new member in that channel to pull their attention to the panel, then deletes the mention a few seconds later. When a member presses <strong>Verify</strong>, a window opens where they type their VRChat username or profile URL — with no need to write anything in chat, which lets owners keep the channel locked down.",
    "verify.eyebrow": "Step-by-step guide",
    "verify.title": "Verify your account",
    "verify.lead":
      "Verification takes a couple of minutes. You can start with your profile URL, your username, or with nothing to see the tutorial video.",
    "verify.s1.title": "Run <code>/verification</code>",
    "verify.s1.body":
      "Paste your profile URL into the <code>vrchat</code> option, or type your name in <code>username</code>. If you use the name, the bot shows up to 3 candidate profiles so you can confirm which one is yours.",
    "verify.s2.title": "Copy the code",
    "verify.s2.body": "The bot replies with a single-use verification code. Copy it exactly as shown.",
    "verify.s3.title": "Paste it into your VRChat bio",
    "verify.s3.body":
      "Open your VRChat profile and paste the code anywhere in your bio. Use the <em>Go to VRChat</em> button on the message to open the site directly.",
    "verify.s4.title": "Press “Verify”",
    "verify.s4.body":
      "The bot reads your bio, confirms the code and links your account. The code expires after <strong>5 minutes</strong>; if it lapses, run the command again.",
    "verify.note":
      "Code not showing in your bio? Make sure you saved it in VRChat before pressing “Verify”, and that it's written exactly the same.",
    "verify.v18.title": "Automatic 18+ verification",
    "verify.v18.body":
      "If your age is already verified on VRChat (<em>age verified</em>), the bot automatically grants you <strong>18+ verification</strong> on linking and, if the server set it up, assigns the matching 18+ role. No separate step needed.",
    "verify.global.title": "What “global verification” means",
    "verify.global.body":
      "Your link between Discord and VRChat is stored once and recognized on any server running EnlaceVRC. Join another community with the bot and you already count as verified. To undo the link, run <code>/verification</code> again and use the <em>Unverify</em> button.",
    "cmds.eyebrow": "Reference",
    "cmds.title": "Commands",
    "cmds.lead":
      "Every command is available in English and Spanish (Latin America and Spain). Admin commands require server permissions.",
    "perm.all": "Everyone",
    "perm.manage_server": "Manage Server",
    "perm.admin": "Administrator",
    "perm.staff": "Staff",
    "cmd.verification.desc": "Links your Discord account to your VRChat profile, or unlinks it if you're already verified.",
    "cmd.verification.opt.vrchat": "Your VRChat profile URL. Optional.",
    "cmd.verification.opt.username": "Your VRChat username, as an alternative to the URL. Optional.",
    "cmd.howtoverify.desc": "Shows a short tutorial video explaining how to verify your VRChat account with Discord.",
    "cmd.profile.desc": "Shows your own linked VRChat profile.",
    "cmd.viewprofile.desc": "Shows another server user's VRChat profile.",
    "cmd.viewprofile.opt.user": "The Discord user whose profile you want to see.",
    "cmd.sync.desc": "Re-applies your verified role and nickname from your VRChat profile. Useful if you lost the role or changed your name.",
    "cmd.worldinfo.desc": "Looks up a VRChat world by its ID or URL and shows its info.",
    "cmd.worldinfo.opt.world": "VRChat world ID or URL.",
    "cmd.search.desc": "Paginated VRChat search. Pick what to look for and navigate pages with buttons.",
    "cmd.search.opt.world": "Search worlds by name.",
    "cmd.search.opt.avatar": "Search avatars by name.",
    "cmd.search.opt.user": "Search users by name.",
    "cmd.invite.desc": "Returns a button with the link to invite the bot to another Discord server.",
    "cmd.howitworks.desc": "Interactive 7-page guide that walks through the bot step by step, with buttons to navigate pages.",
    "cmd.settings.desc": "Configures the bot's behaviour on your server. Requires the <strong>Manage Server</strong> permission.",
    "cmd.settings.set_intro": "Settings are changed with <code>set</code>, grouped by value type so each keeps Discord's native pickers:",
    "cmd.settings.opt.set_role": "Pick a role setting (verified role or 18+ role) and the role to assign.",
    "cmd.settings.opt.set_channel": "Pick a channel setting (log channel or welcome panel channel) and the channel.",
    "cmd.settings.opt.set_toggle": "Enable or disable a setting (auto nickname or welcome ping).",
    "cmd.settings.opt.view": "Shows the server's current configuration.",
    "cmd.settings.opt.reset": "Resets a single setting or all of them at once.",
    "cmd.welcomepanel.desc": "Publishes and manages the welcome panel: a pinned-style message with a button for newcomers to start verifying. Set the channel first with <code>/settings set channel</code>. Requires the <strong>Manage Server</strong> permission.",
    "cmd.welcomepanel.opt.send": "Publishes the panel in the configured channel and records its message. Use <code>language</code> to pick the panel's language (Español or English); it is stored so updates reuse it.",
    "cmd.welcomepanel.opt.preview": "Shows you the panel privately, without posting it to the channel.",
    "cmd.welcomepanel.opt.refresh": "Updates the already-published panel; re-publishes it if it was deleted.",
    "cmd.group.desc": "Manages the VRChat group linked to the server. The group option autocompletes. Requires the <strong>Administrator</strong> permission.",
    "cmd.group.opt.invite": "Invites a user to the VRChat group.",
    "cmd.group.opt.kick": "Kicks a user from the VRChat group.",
    "cmd.group.opt.perms": "Shows which permissions the bot has within the group.",
    "cmd.linkgroup.desc": "Multi-step guided flow to link a VRChat group to the Discord server. Uses buttons to advance each step.",
    "cmd.staff.desc": "Actions reserved for the bot's registered staff, grouped by area. Access is gated once in the router.",
    "cmd.staff.users": "Users",
    "cmd.staff.user.add": "Manually links a Discord user to a VRChat ID.",
    "cmd.staff.user.ban": "Bans a profile by Discord user, with a reason.",
    "cmd.staff.user.banid": "Bans a profile by its profile ID, with a reason.",
    "cmd.staff.user.unban": "Unbans a profile.",
    "cmd.staff.user.verify": "18+ verification of another user.",
    "cmd.staff.members": "Staff members",
    "cmd.staff.member.add": "Registers a new staff member.",
    "cmd.staff.member.remove": "Removes a staff member.",
    "cmd.staff.member.list": "Lists all registered staff.",
    "table.eyebrow": "Summary",
    "table.title": "Command table",
    "table.lead": "A quick view of each command and who can use it.",
    "table.h.cmd": "Command",
    "table.h.use": "What it does",
    "table.h.access": "Access",
    "table.r.verification": "Verify or unlink your VRChat account",
    "table.r.howtoverify": "Verification tutorial video",
    "table.r.profile": "View your VRChat profile",
    "table.r.viewprofile": "View another user's profile",
    "table.r.sync": "Re-apply role and nickname from your profile",
    "table.r.worldinfo": "Info about a VRChat world",
    "table.r.search": "Search worlds, avatars or users",
    "table.r.invite": "Link to invite the bot",
    "table.r.howitworks": "Interactive 7-page guide",
    "table.r.settings": "Configure the bot on the server",
    "table.r.welcomepanel": "Publish the welcome panel",
    "table.r.group": "Invite, kick and view group permissions",
    "table.r.linkgroup": "Link a VRChat group",
    "table.r.staff": "User and staff management",
    "priv.eyebrow": "Transparency",
    "priv.title": "Privacy & data",
    "priv.body1":
      "EnlaceVRC never asks for your VRChat password and uses no third-party OAuth. Account ownership is proven with a temporary code in your bio, which you can delete as soon as you finish verifying.",
    "priv.body2":
      "The link between your Discord ID and your VRChat ID is stored to make global verification work. You can remove that link at any time with the <em>Unverify</em> button in <code>/verification</code>.",
    "footer.tagline": "EnlaceVRC · VRChat verification bot for Discord",
    "footer.source": "Source code",
  };

  const PT = {
    "a11y.skip": "Pular para o conteúdo",
    "a11y.menu": "Abrir menu",
    "nav.tag": "Documentação",
    "nav.verification": "Verificação",
    "nav.commands": "Comandos",
    "ctrl.effects": "Efeitos",
    "ctrl.effects_title": "Ativar ou desativar animações e efeitos",
    "ctrl.language": "Idioma",
    "side.search": "Pesquisar no guia…",
    "side.empty": "Sem resultados.",
    "side.start": "Começar",
    "side.what": "O que é o EnlaceVRC",
    "side.how": "Como funciona",
    "side.add": "Adicionar o bot",
    "side.panel": "Painel de boas-vindas",
    "side.verification": "Verificação",
    "side.verify_account": "Verificar sua conta",
    "side.verify_18": "Verificação +18",
    "side.verify_global": "Verificação global",
    "side.user_cmds": "Comandos de usuário",
    "side.admin": "Administração do servidor",
    "side.staff": "Staff",
    "side.reference": "Referência",
    "side.table": "Tabela de comandos",
    "side.privacy": "Privacidade e dados",
    "hero.badge": "Verificação global",
    "hero.sub":
      "Um bot do Discord que vincula e verifica contas do VRChat. O usuário prova ser dono da conta colocando um código na bio do VRChat — sem senhas e sem OAuth de terceiros.",
    "hero.cta_verify": "Como verificar",
    "hero.cta_commands": "Ver todos os comandos",
    "how.eyebrow": "Visão geral",
    "how.title": "Como funciona",
    "how.lead":
      "O EnlaceVRC conecta sua identidade do VRChat à sua conta do Discord e mantém cargos, apelidos e a participação em grupos do VRChat sincronizados a partir do servidor.",
    "how.f1.title": "Prova de propriedade pela bio",
    "how.f1.body":
      "O bot gera um código único, você o cola na sua bio do VRChat e o bot o lê para confirmar que a conta é sua. Ele nunca pede sua senha do VRChat.",
    "how.f2.title": "Verificação global",
    "how.f2.body":
      "Uma vez verificado, seu vínculo vale em <strong>todos</strong> os servidores que usam o bot. Você não precisa repetir o processo em cada comunidade.",
    "how.f3.title": "Cargos e apelido automáticos",
    "how.f3.body":
      "Ao verificar, o servidor pode atribuir um cargo de verificado e mudar seu apelido para o seu nome do VRChat, conforme a configuração do administrador.",
    "how.f4.title": "Gestão de grupos do VRChat",
    "how.f4.body":
      "Administradores podem convidar e expulsar membros de um grupo do VRChat vinculado diretamente pelo Discord, sem sair do app.",
    "how.add.title": "Adicionar o bot ao seu servidor",
    "how.add.body":
      "Use o comando <code>/invite</code> em qualquer servidor que já tenha o bot para obter o link de convite, ou peça a quem administra. O bot precisa da permissão <strong>Gerenciar cargos</strong> e que o cargo dele esteja acima do cargo de verificado para atribuí-lo.",
    "how.add.note":
      "Se o bot não consegue atribuir o cargo, quase sempre é porque o cargo dele está abaixo do cargo de verificado na lista de cargos do servidor. Arraste-o para cima em <em>Configurações do servidor → Cargos</em>.",
    "how.panel.title": "Painel de boas-vindas",
    "how.panel.body":
      "Para que os recém-chegados saibam o que fazer, o bot pode publicar um <strong>painel de boas-vindas</strong>: uma mensagem fixa em um canal com um botão para iniciar a verificação. Configure o canal com <code>/settings set channel</code> e publique-o com <code>/welcomepanel send</code>, escolhendo o idioma do painel (Español ou English) na opção <code>language</code>. Se você ativar o ping de boas-vindas (<code>/settings set toggle</code>), o bot mencionará cada novo membro nesse canal para chamar a atenção dele para o painel, e apagará a menção alguns segundos depois. Ao pressionar <strong>Verificar</strong>, o membro abre uma janela onde digita seu usuário ou URL do VRChat — sem precisar escrever nada no chat, o que permite aos donos manter o canal fechado.",
    "verify.eyebrow": "Guia passo a passo",
    "verify.title": "Verificar sua conta",
    "verify.lead":
      "A verificação leva alguns minutos. Você pode começar com a URL do seu perfil, seu nome de usuário, ou sem nada para ver o vídeo tutorial.",
    "verify.s1.title": "Execute <code>/verification</code>",
    "verify.s1.body":
      "Cole a URL do seu perfil na opção <code>vrchat</code>, ou digite seu nome em <code>username</code>. Se usar o nome, o bot mostra até 3 perfis candidatos para você confirmar qual é o seu.",
    "verify.s2.title": "Copie o código",
    "verify.s2.body": "O bot responde com um código de verificação de uso único. Copie exatamente como mostrado.",
    "verify.s3.title": "Cole na sua bio do VRChat",
    "verify.s3.body":
      "Abra seu perfil do VRChat e cole o código em qualquer lugar da bio. Use o botão <em>Ir para o VRChat</em> da mensagem para abrir o site direto.",
    "verify.s4.title": "Pressione “Verificar”",
    "verify.s4.body":
      "O bot lê sua bio, confirma o código e vincula sua conta. O código expira em <strong>5 minutos</strong>; se vencer, execute o comando de novo.",
    "verify.note":
      "O código não aparece na sua bio? Verifique se você o salvou no VRChat antes de pressionar “Verificar”, e se está escrito exatamente igual.",
    "verify.v18.title": "Verificação +18 automática",
    "verify.v18.body":
      "Se sua idade já está verificada no VRChat (<em>age verified</em>), o bot concede automaticamente a <strong>verificação +18</strong> ao vincular e, se o servidor configurou, atribui o cargo +18 correspondente. Não é preciso um passo separado.",
    "verify.global.title": "O que significa “verificação global”",
    "verify.global.body":
      "Seu vínculo entre Discord e VRChat é salvo uma única vez e reconhecido em qualquer servidor que execute o EnlaceVRC. Ao entrar em outra comunidade com o bot, você já conta como verificado. Para desfazer o vínculo, execute <code>/verification</code> de novo e use o botão <em>Desverificar</em>.",
    "cmds.eyebrow": "Referência",
    "cmds.title": "Comandos",
    "cmds.lead":
      "Todos os comandos estão disponíveis em inglês e espanhol (América Latina e Espanha). Comandos de administração exigem permissões no servidor.",
    "perm.all": "Todos",
    "perm.manage_server": "Gerenciar servidor",
    "perm.admin": "Administrador",
    "perm.staff": "Staff",
    "cmd.verification.desc": "Vincula sua conta do Discord ao seu perfil do VRChat, ou desvincula se você já estiver verificado.",
    "cmd.verification.opt.vrchat": "URL do seu perfil do VRChat. Opcional.",
    "cmd.verification.opt.username": "Seu nome de usuário do VRChat, como alternativa à URL. Opcional.",
    "cmd.howtoverify.desc": "Mostra um vídeo tutorial curto explicando como verificar sua conta do VRChat com o Discord.",
    "cmd.profile.desc": "Mostra o seu próprio perfil do VRChat vinculado.",
    "cmd.viewprofile.desc": "Mostra o perfil do VRChat de outro usuário do servidor.",
    "cmd.viewprofile.opt.user": "O usuário do Discord cujo perfil você quer ver.",
    "cmd.sync.desc": "Reaplica seu cargo de verificado e seu apelido a partir do seu perfil do VRChat. Útil se você perdeu o cargo ou mudou de nome.",
    "cmd.worldinfo.desc": "Busca um mundo do VRChat pelo ID ou URL e mostra suas informações.",
    "cmd.worldinfo.opt.world": "ID ou URL do mundo do VRChat.",
    "cmd.search.desc": "Busca paginada no VRChat. Escolha o que procurar e navegue pelas páginas com botões.",
    "cmd.search.opt.world": "Buscar mundos por nome.",
    "cmd.search.opt.avatar": "Buscar avatares por nome.",
    "cmd.search.opt.user": "Buscar usuários por nome.",
    "cmd.invite.desc": "Retorna um botão com o link para convidar o bot para outro servidor do Discord.",
    "cmd.howitworks.desc": "Guia interativo de 7 páginas que explica o bot passo a passo, com botões para navegar pelas páginas.",
    "cmd.settings.desc": "Configura o comportamento do bot no seu servidor. Requer a permissão <strong>Gerenciar servidor</strong>.",
    "cmd.settings.set_intro": "As configurações são alteradas com <code>set</code>, agrupado por tipo de valor para manter os seletores nativos do Discord:",
    "cmd.settings.opt.set_role": "Escolha uma configuração de cargo (cargo de verificado ou cargo +18) e o cargo a atribuir.",
    "cmd.settings.opt.set_channel": "Escolha uma configuração de canal (canal de log ou canal do painel de boas-vindas) e o canal.",
    "cmd.settings.opt.set_toggle": "Ativa ou desativa uma configuração (apelido automático ou ping de boas-vindas).",
    "cmd.settings.opt.view": "Mostra a configuração atual do servidor.",
    "cmd.settings.opt.reset": "Redefine uma configuração específica ou todas de uma vez.",
    "cmd.welcomepanel.desc": "Publica e gerencia o painel de boas-vindas: uma mensagem fixa com um botão para os recém-chegados começarem a se verificar. Configure o canal primeiro com <code>/settings set channel</code>. Requer a permissão <strong>Gerenciar servidor</strong>.",
    "cmd.welcomepanel.opt.send": "Publica o painel no canal configurado e registra a mensagem. Com <code>language</code> você escolhe o idioma do painel (Español ou English); ele é salvo para que as atualizações usem o mesmo.",
    "cmd.welcomepanel.opt.preview": "Mostra o painel para você em privado, sem publicá-lo no canal.",
    "cmd.welcomepanel.opt.refresh": "Atualiza o painel já publicado; republica se ele tiver sido apagado.",
    "cmd.group.desc": "Gerencia o grupo do VRChat vinculado ao servidor. A opção de grupo é autocompletada. Requer a permissão <strong>Administrador</strong>.",
    "cmd.group.opt.invite": "Convida um usuário para o grupo do VRChat.",
    "cmd.group.opt.kick": "Expulsa um usuário do grupo do VRChat.",
    "cmd.group.opt.perms": "Mostra quais permissões o bot tem dentro do grupo.",
    "cmd.linkgroup.desc": "Fluxo guiado de várias etapas para vincular um grupo do VRChat ao servidor do Discord. Usa botões para avançar cada etapa.",
    "cmd.staff.desc": "Ações reservadas ao staff registrado do bot, agrupadas por área. O acesso é controlado uma única vez no roteador.",
    "cmd.staff.users": "Usuários",
    "cmd.staff.user.add": "Vincula manualmente um usuário do Discord a um ID do VRChat.",
    "cmd.staff.user.ban": "Bane um perfil por usuário do Discord, com motivo.",
    "cmd.staff.user.banid": "Bane um perfil pelo ID do perfil, com motivo.",
    "cmd.staff.user.unban": "Remove o banimento de um perfil.",
    "cmd.staff.user.verify": "Verificação +18 de outro usuário.",
    "cmd.staff.members": "Membros do staff",
    "cmd.staff.member.add": "Registra um novo membro do staff.",
    "cmd.staff.member.remove": "Remove um membro do staff.",
    "cmd.staff.member.list": "Lista todo o staff registrado.",
    "table.eyebrow": "Resumo",
    "table.title": "Tabela de comandos",
    "table.lead": "Uma visão rápida de cada comando e quem pode usá-lo.",
    "table.h.cmd": "Comando",
    "table.h.use": "Para que serve",
    "table.h.access": "Acesso",
    "table.r.verification": "Verificar ou desvincular sua conta do VRChat",
    "table.r.howtoverify": "Vídeo tutorial de verificação",
    "table.r.profile": "Ver seu perfil do VRChat",
    "table.r.viewprofile": "Ver o perfil de outro usuário",
    "table.r.sync": "Reaplicar cargo e apelido do seu perfil",
    "table.r.worldinfo": "Informações de um mundo do VRChat",
    "table.r.search": "Buscar mundos, avatares ou usuários",
    "table.r.invite": "Link para convidar o bot",
    "table.r.howitworks": "Guia interativo de 7 páginas",
    "table.r.settings": "Configurar o bot no servidor",
    "table.r.welcomepanel": "Publicar o painel de boas-vindas",
    "table.r.group": "Convidar, expulsar e ver permissões do grupo",
    "table.r.linkgroup": "Vincular um grupo do VRChat",
    "table.r.staff": "Gestão de usuários e staff",
    "priv.eyebrow": "Transparência",
    "priv.title": "Privacidade e dados",
    "priv.body1":
      "O EnlaceVRC nunca pede sua senha do VRChat e não usa OAuth de terceiros. A propriedade da conta é provada com um código temporário na sua bio, que você pode apagar assim que terminar de verificar.",
    "priv.body2":
      "O vínculo entre seu ID do Discord e seu ID do VRChat é salvo para que a verificação global funcione. Você pode remover esse vínculo a qualquer momento com o botão <em>Desverificar</em> em <code>/verification</code>.",
    "footer.tagline": "EnlaceVRC · Bot de verificação do VRChat para Discord",
    "footer.source": "Código-fonte",
  };

  const FR = {
    "a11y.skip": "Aller au contenu",
    "a11y.menu": "Ouvrir le menu",
    "nav.tag": "Documentation",
    "nav.verification": "Vérification",
    "nav.commands": "Commandes",
    "ctrl.effects": "Effets",
    "ctrl.effects_title": "Activer ou désactiver les animations et effets",
    "ctrl.language": "Langue",
    "side.search": "Rechercher dans le guide…",
    "side.empty": "Aucun résultat.",
    "side.start": "Commencer",
    "side.what": "Qu'est-ce qu'EnlaceVRC",
    "side.how": "Fonctionnement",
    "side.add": "Ajouter le bot",
    "side.panel": "Panneau de bienvenue",
    "side.verification": "Vérification",
    "side.verify_account": "Vérifier ton compte",
    "side.verify_18": "Vérification +18",
    "side.verify_global": "Vérification globale",
    "side.user_cmds": "Commandes utilisateur",
    "side.admin": "Administration du serveur",
    "side.staff": "Staff",
    "side.reference": "Référence",
    "side.table": "Tableau des commandes",
    "side.privacy": "Confidentialité et données",
    "hero.badge": "Vérification globale",
    "hero.sub":
      "Un bot Discord qui lie et vérifie les comptes VRChat. L'utilisateur prouve qu'il possède son compte en plaçant un code dans sa bio VRChat — sans mot de passe ni OAuth tiers.",
    "hero.cta_verify": "Comment se vérifier",
    "hero.cta_commands": "Voir toutes les commandes",
    "how.eyebrow": "Vue d'ensemble",
    "how.title": "Fonctionnement",
    "how.lead":
      "EnlaceVRC relie ton identité VRChat à ton compte Discord et garde les rôles, surnoms et l'appartenance aux groupes VRChat synchronisés depuis le serveur.",
    "how.f1.title": "Preuve de propriété par la bio",
    "how.f1.body":
      "Le bot génère un code unique, tu le colles dans ta bio VRChat et le bot le lit pour confirmer que le compte est le tien. Il ne demande jamais ton mot de passe VRChat.",
    "how.f2.title": "Vérification globale",
    "how.f2.body":
      "Une fois vérifié, ton lien vaut sur <strong>tous</strong> les serveurs qui utilisent le bot. Pas besoin de recommencer le processus dans chaque communauté.",
    "how.f3.title": "Rôles et surnom automatiques",
    "how.f3.body":
      "À la vérification, le serveur peut t'attribuer un rôle de vérifié et changer ton surnom pour ton nom VRChat, selon la configuration de l'administrateur.",
    "how.f4.title": "Gestion des groupes VRChat",
    "how.f4.body":
      "Les administrateurs peuvent inviter et exclure des membres d'un groupe VRChat lié directement depuis Discord, sans quitter l'application.",
    "how.add.title": "Ajouter le bot à ton serveur",
    "how.add.body":
      "Utilise la commande <code>/invite</code> dans n'importe quel serveur ayant déjà le bot pour obtenir le lien d'invitation, ou demande à la personne qui le gère. Le bot a besoin de la permission <strong>Gérer les rôles</strong> et que son rôle soit au-dessus du rôle de vérifié pour l'attribuer.",
    "how.add.note":
      "Si le bot n'arrive pas à attribuer le rôle, c'est presque toujours parce que son rôle est en dessous du rôle de vérifié dans la liste des rôles du serveur. Remonte-le dans <em>Paramètres du serveur → Rôles</em>.",
    "how.panel.title": "Panneau de bienvenue",
    "how.panel.body":
      "Pour que les nouveaux venus sachent quoi faire, le bot peut publier un <strong>panneau de bienvenue</strong> : un message fixe dans un salon avec un bouton pour lancer la vérification. Configure le salon avec <code>/settings set channel</code> et publie-le avec <code>/welcomepanel send</code>, en choisissant la langue du panneau (Español ou English) dans l'option <code>language</code>. Si tu actives le ping de bienvenue (<code>/settings set toggle</code>), le bot mentionne chaque nouveau membre dans ce salon pour attirer son attention vers le panneau, puis supprime la mention quelques secondes plus tard. En appuyant sur <strong>Vérifier</strong>, le membre ouvre une fenêtre où il saisit son nom d'utilisateur ou l'URL de son profil VRChat — sans avoir à écrire quoi que ce soit dans le salon, ce qui permet aux propriétaires de garder le salon verrouillé.",
    "verify.eyebrow": "Guide pas à pas",
    "verify.title": "Vérifier ton compte",
    "verify.lead":
      "La vérification prend quelques minutes. Tu peux commencer avec l'URL de ton profil, ton nom d'utilisateur, ou rien du tout pour voir la vidéo tutoriel.",
    "verify.s1.title": "Lance <code>/verification</code>",
    "verify.s1.body":
      "Colle l'URL de ton profil dans l'option <code>vrchat</code>, ou tape ton nom dans <code>username</code>. Avec le nom, le bot affiche jusqu'à 3 profils candidats pour que tu confirmes lequel est le tien.",
    "verify.s2.title": "Copie le code",
    "verify.s2.body": "Le bot répond avec un code de vérification à usage unique. Copie-le tel quel.",
    "verify.s3.title": "Colle-le dans ta bio VRChat",
    "verify.s3.body":
      "Ouvre ton profil VRChat et colle le code n'importe où dans ta bio. Utilise le bouton <em>Aller sur VRChat</em> du message pour ouvrir le site directement.",
    "verify.s4.title": "Appuie sur « Vérifier »",
    "verify.s4.body":
      "Le bot lit ta bio, confirme le code et lie ton compte. Le code expire après <strong>5 minutes</strong> ; s'il expire, relance la commande.",
    "verify.note":
      "Le code n'apparaît pas dans ta bio ? Assure-toi de l'avoir enregistré sur VRChat avant d'appuyer sur « Vérifier », et qu'il soit écrit exactement pareil.",
    "verify.v18.title": "Vérification +18 automatique",
    "verify.v18.body":
      "Si ton âge est déjà vérifié sur VRChat (<em>age verified</em>), le bot t'accorde automatiquement la <strong>vérification +18</strong> au moment du lien et, si le serveur l'a configuré, attribue le rôle +18 correspondant. Aucune démarche séparée nécessaire.",
    "verify.global.title": "Ce que signifie « vérification globale »",
    "verify.global.body":
      "Ton lien entre Discord et VRChat est enregistré une seule fois et reconnu sur tout serveur exécutant EnlaceVRC. Rejoins une autre communauté avec le bot et tu comptes déjà comme vérifié. Pour défaire le lien, relance <code>/verification</code> et utilise le bouton <em>Dévérifier</em>.",
    "cmds.eyebrow": "Référence",
    "cmds.title": "Commandes",
    "cmds.lead":
      "Toutes les commandes sont disponibles en anglais et en espagnol (Amérique latine et Espagne). Les commandes d'administration nécessitent des permissions sur le serveur.",
    "perm.all": "Tous",
    "perm.manage_server": "Gérer le serveur",
    "perm.admin": "Administrateur",
    "perm.staff": "Staff",
    "cmd.verification.desc": "Lie ton compte Discord à ton profil VRChat, ou le délie si tu es déjà vérifié.",
    "cmd.verification.opt.vrchat": "L'URL de ton profil VRChat. Facultatif.",
    "cmd.verification.opt.username": "Ton nom d'utilisateur VRChat, en alternative à l'URL. Facultatif.",
    "cmd.howtoverify.desc": "Affiche une courte vidéo tutoriel expliquant comment vérifier ton compte VRChat avec Discord.",
    "cmd.profile.desc": "Affiche ton propre profil VRChat lié.",
    "cmd.viewprofile.desc": "Affiche le profil VRChat d'un autre utilisateur du serveur.",
    "cmd.viewprofile.opt.user": "L'utilisateur Discord dont tu veux voir le profil.",
    "cmd.sync.desc": "Réapplique ton rôle de vérifié et ton surnom à partir de ton profil VRChat. Utile si tu as perdu le rôle ou changé de nom.",
    "cmd.worldinfo.desc": "Recherche un monde VRChat par son ID ou son URL et affiche ses informations.",
    "cmd.worldinfo.opt.world": "ID ou URL du monde VRChat.",
    "cmd.search.desc": "Recherche paginée sur VRChat. Choisis quoi chercher et navigue entre les pages avec des boutons.",
    "cmd.search.opt.world": "Rechercher des mondes par nom.",
    "cmd.search.opt.avatar": "Rechercher des avatars par nom.",
    "cmd.search.opt.user": "Rechercher des utilisateurs par nom.",
    "cmd.invite.desc": "Renvoie un bouton avec le lien pour inviter le bot sur un autre serveur Discord.",
    "cmd.howitworks.desc": "Guide interactif de 7 pages qui présente le bot étape par étape, avec des boutons pour naviguer.",
    "cmd.settings.desc": "Configure le comportement du bot sur ton serveur. Nécessite la permission <strong>Gérer le serveur</strong>.",
    "cmd.settings.set_intro": "Les réglages se changent avec <code>set</code>, regroupé par type de valeur pour conserver les sélecteurs natifs de Discord :",
    "cmd.settings.opt.set_role": "Choisis un réglage de rôle (rôle de vérifié ou rôle +18) et le rôle à attribuer.",
    "cmd.settings.opt.set_channel": "Choisis un réglage de salon (salon de log ou salon du panneau de bienvenue) et le salon.",
    "cmd.settings.opt.set_toggle": "Active ou désactive un réglage (surnom automatique ou ping de bienvenue).",
    "cmd.settings.opt.view": "Affiche la configuration actuelle du serveur.",
    "cmd.settings.opt.reset": "Réinitialise un réglage précis ou tous à la fois.",
    "cmd.welcomepanel.desc": "Publie et gère le panneau de bienvenue : un message fixe avec un bouton pour que les nouveaux venus commencent à se vérifier. Configure d'abord le salon avec <code>/settings set channel</code>. Nécessite la permission <strong>Gérer le serveur</strong>.",
    "cmd.welcomepanel.opt.send": "Publie le panneau dans le salon configuré et enregistre son message. Avec <code>language</code>, tu choisis la langue du panneau (Español ou English) ; elle est enregistrée pour que les mises à jour la réutilisent.",
    "cmd.welcomepanel.opt.preview": "T'affiche le panneau en privé, sans le publier dans le salon.",
    "cmd.welcomepanel.opt.refresh": "Met à jour le panneau déjà publié ; le republie s'il a été supprimé.",
    "cmd.group.desc": "Gère le groupe VRChat lié au serveur. L'option de groupe s'autocomplète. Nécessite la permission <strong>Administrateur</strong>.",
    "cmd.group.opt.invite": "Invite un utilisateur dans le groupe VRChat.",
    "cmd.group.opt.kick": "Exclut un utilisateur du groupe VRChat.",
    "cmd.group.opt.perms": "Affiche les permissions dont dispose le bot dans le groupe.",
    "cmd.linkgroup.desc": "Flux guidé en plusieurs étapes pour lier un groupe VRChat au serveur Discord. Utilise des boutons pour avancer à chaque étape.",
    "cmd.staff.desc": "Actions réservées au staff enregistré du bot, regroupées par domaine. L'accès est contrôlé une seule fois dans le routeur.",
    "cmd.staff.users": "Utilisateurs",
    "cmd.staff.user.add": "Lie manuellement un utilisateur Discord à un ID VRChat.",
    "cmd.staff.user.ban": "Bannit un profil par utilisateur Discord, avec un motif.",
    "cmd.staff.user.banid": "Bannit un profil par son ID de profil, avec un motif.",
    "cmd.staff.user.unban": "Débannit un profil.",
    "cmd.staff.user.verify": "Vérification +18 d'un autre utilisateur.",
    "cmd.staff.members": "Membres du staff",
    "cmd.staff.member.add": "Enregistre un nouveau membre du staff.",
    "cmd.staff.member.remove": "Retire un membre du staff.",
    "cmd.staff.member.list": "Liste tout le staff enregistré.",
    "table.eyebrow": "Résumé",
    "table.title": "Tableau des commandes",
    "table.lead": "Un aperçu rapide de chaque commande et de qui peut l'utiliser.",
    "table.h.cmd": "Commande",
    "table.h.use": "À quoi ça sert",
    "table.h.access": "Accès",
    "table.r.verification": "Vérifier ou délier ton compte VRChat",
    "table.r.howtoverify": "Vidéo tutoriel de vérification",
    "table.r.profile": "Voir ton profil VRChat",
    "table.r.viewprofile": "Voir le profil d'un autre utilisateur",
    "table.r.sync": "Réappliquer rôle et surnom depuis ton profil",
    "table.r.worldinfo": "Infos sur un monde VRChat",
    "table.r.search": "Rechercher mondes, avatars ou utilisateurs",
    "table.r.invite": "Lien pour inviter le bot",
    "table.r.howitworks": "Guide interactif de 7 pages",
    "table.r.settings": "Configurer le bot sur le serveur",
    "table.r.welcomepanel": "Publier le panneau de bienvenue",
    "table.r.group": "Inviter, exclure et voir les permissions du groupe",
    "table.r.linkgroup": "Lier un groupe VRChat",
    "table.r.staff": "Gestion des utilisateurs et du staff",
    "priv.eyebrow": "Transparence",
    "priv.title": "Confidentialité et données",
    "priv.body1":
      "EnlaceVRC ne demande jamais ton mot de passe VRChat et n'utilise aucun OAuth tiers. La propriété du compte est prouvée par un code temporaire dans ta bio, que tu peux supprimer dès que la vérification est terminée.",
    "priv.body2":
      "Le lien entre ton ID Discord et ton ID VRChat est enregistré pour faire fonctionner la vérification globale. Tu peux supprimer ce lien à tout moment avec le bouton <em>Dévérifier</em> de <code>/verification</code>.",
    "footer.tagline": "EnlaceVRC · Bot de vérification VRChat pour Discord",
    "footer.source": "Code source",
  };

  const DICTS = { es: ES, en: EN, pt: PT, fr: FR };

  const LANG_NAMES = { es: "Español", en: "English", pt: "Português", fr: "Français" };

  // ------------------------------------------------------------------------------------------------------
  // Apply a language
  // ------------------------------------------------------------------------------------------------------

  function applyLang(lang) {
    const dict = DICTS[lang] || ES;

    // Text / markup nodes.
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = dict[el.getAttribute("data-i18n")];
      if (value == null) return;
      // Authored strings may carry inline markup (<code>, <strong>, <em>); apply as HTML when present.
      if (value.indexOf("<") !== -1) el.innerHTML = value;
      else el.textContent = value;
    });

    // Attribute translations.
    const attrMap = [
      ["data-i18n-placeholder", "placeholder"],
      ["data-i18n-title", "title"],
      ["data-i18n-aria", "aria-label"],
    ];
    attrMap.forEach(([dataAttr, target]) => {
      document.querySelectorAll("[" + dataAttr + "]").forEach((el) => {
        const value = dict[el.getAttribute(dataAttr)];
        if (value != null) el.setAttribute(target, value);
      });
    });

    document.documentElement.lang = lang;
    const title = { es: "Documentación", en: "Documentation", pt: "Documentação", fr: "Documentation" }[lang];
    document.title = "EnlaceVRC — " + title;

    // Let other scripts (e.g. AOS via effects.js) react to reflowed text.
    window.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang } }));
  }

  // ------------------------------------------------------------------------------------------------------
  // Resolve initial language: saved choice → browser language → Spanish
  // ------------------------------------------------------------------------------------------------------

  function initialLang() {
    let saved = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch {
      saved = null;
    }
    if (saved && LANGS.includes(saved)) return saved;
    const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
    return LANGS.includes(nav) ? nav : "es";
  }

  // ------------------------------------------------------------------------------------------------------
  // Wire up the controls
  // ------------------------------------------------------------------------------------------------------

  function init() {
    const select = document.getElementById("lang-select");
    const lang = initialLang();
    if (select) select.value = lang;
    applyLang(lang);

    if (select) {
      select.addEventListener("change", () => {
        const next = select.value;
        applyLang(next);
        try {
          localStorage.setItem(LANG_KEY, next);
        } catch {
          /* storage unavailable; selection still applies for this session */
        }
      });
    }

    // Effects toggle: persist preference and expose it; effects.js reads window.__effectsEnabled.
    const fx = document.getElementById("fx-toggle");
    let fxEnabled = true;
    try {
      const stored = localStorage.getItem(FX_KEY);
      if (stored === "0") fxEnabled = false;
    } catch {
      fxEnabled = true;
    }
    window.__effectsEnabled = fxEnabled;
    if (fx) {
      fx.checked = fxEnabled;
      fx.addEventListener("change", () => {
        window.__effectsEnabled = fx.checked;
        try {
          localStorage.setItem(FX_KEY, fx.checked ? "1" : "0");
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent("effects:toggled", { detail: { enabled: fx.checked } }));
      });
    }

    // Expose for debugging / other scripts.
    window.__i18n = { applyLang, langNames: LANG_NAMES };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
