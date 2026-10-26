/* =========================================================
   Compose Client — логика визитки в стиле Discord.
   Ванильный JavaScript, без сборки и зависимостей.
   ========================================================= */

(() => {
  'use strict';

  const STORAGE = {
    messages: 'compose-client-messages',
    channel: 'compose-client-channel',
    theme: 'compose-client-theme',
    activity: 'compose-client-activity',
    status: 'compose-client-status',
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    channel: localStorage.getItem(STORAGE.channel) || 'visitka',
    activity: localStorage.getItem(STORAGE.activity) || 'none',
    status: localStorage.getItem(STORAGE.status) || 'online',
    theme: localStorage.getItem(STORAGE.theme) || 'theme-darker',
    extra: JSON.parse(localStorage.getItem(STORAGE.messages) || '{}'),
  };

  /* ---------------------------------------------------------
     Разбор текста: **жирный**, `код`, ссылки, @упоминания
     --------------------------------------------------------- */

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[ch]);

  const renderText = (raw) => {
    const blocks = [];

    // Блоки кода вырезаем заранее, чтобы не трогать их содержимое.
    const stash = raw.replace(/```([\s\S]*?)```/g, (_, code) => {
      blocks.push(`<span class="pre">${escapeHtml(code.replace(/^\n|\n$/g, ''))}</span>`);
      return `${blocks.length - 1}`;
    });

    let html = escapeHtml(stash);

    html = html.replace(/`([^`\n]+)`/g, '<span class="code">$1</span>');
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="link" href="$2" target="_blank" rel="noreferrer">$1</a>');
    html = html.replace(/(^|\s)(@[A-Za-z0-9_]+)/g, '$1<span class="mention">$2</span>');
    html = html.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a class="link" href="$2" target="_blank" rel="noreferrer">$2</a>');

    html = html.replace(/(\d+)/g, (_, index) => blocks[Number(index)]);

    return html;
  };

  /* ---------------------------------------------------------
     Рельс серверов
     --------------------------------------------------------- */

  const renderGuilds = () => {
    $('#guilds').innerHTML = GUILDS.map((guild, index) => {
      const divider = guild.add ? '<div class="guild guild--divider"></div>' : '';

      if (guild.add) {
        return `${divider}<button class="guild guild--add" title="${guild.name}" aria-label="${guild.name}">${guild.icon}</button>`;
      }

      const classes = ['guild'];
      if (guild.home) classes.push('guild--home');
      if (guild.active) classes.push('is-active');

      return `${divider}<button class="${classes.join(' ')}" style="background:${guild.active ? guild.color : ''}"
        title="${guild.name}" aria-label="${guild.name}" data-guild="${guild.id}">${guild.icon}</button>`;
    }).join('');
  };

  /* ---------------------------------------------------------
     Сайдбар каналов
     --------------------------------------------------------- */

  const renderSidebar = (filter = '') => {
    const text = CHANNELS.filter((c) => c.type === 'text');
    const voice = CHANNELS.filter((c) => c.type === 'voice');
    const match = (name) => name.toLowerCase().includes(filter.toLowerCase());

    const textItems = text
      .filter((c) => match(c.name))
      .map(
        (channel) => `
        <li>
          <button class="channel ${channel.id === state.channel ? 'is-active' : ''}" data-channel="${channel.id}">
            <span class="channel__hash">#</span>
            <span class="channel__name">${escapeHtml(channel.name)}</span>
          </button>
        </li>`
      )
      .join('');

    const voiceItems = voice
      .filter((c) => match(c.name))
      .map(
        (channel) => `
        <li>
          <button class="channel" data-voice="${channel.id}">
            <span class="channel__hash">🔊</span>
            <span class="channel__name">${escapeHtml(channel.name)}</span>
            ${channel.members.length ? `<span class="channel__voice">${channel.members.length}</span>` : ''}
          </button>
          ${
            channel.members.length
              ? `<ul class="voice-members">${channel.members
                  .map((name) => {
                    const user = USERS[name];
                    return `<li class="voice-member">
                      <span class="member__avatar" style="width:20px;height:20px;font-size:10px;background:${user.color}">${user.name[0]}</span>
                      ${escapeHtml(user.name)}
                    </li>`;
                  })
                  .join('')}</ul>`
              : ''
          }
        </li>`
      )
      .join('');

    $('#sidebar-body').innerHTML = `
      <section class="sidebar__section">
        <h3 class="sidebar__section-title">Текстовые каналы</h3>
        <ul>${textItems || '<li class="channel">— ничего не найдено —</li>'}</ul>
      </section>
      <section class="sidebar__section">
        <h3 class="sidebar__section-title">Голосовые каналы</h3>
        <ul>${voiceItems || '<li class="channel">— ничего не найдено —</li>'}</ul>
      </section>`;
  };

  /* ---------------------------------------------------------
     Сообщения
     --------------------------------------------------------- */

  const channelMessages = (channelId) => {
    const base = (MESSAGES[channelId] || []).map((message) => ({ ...message, mine: false }));
    const extra = (state.extra[channelId] || []).map((message) => ({ ...message, mine: true }));
    return base.concat(extra);
  };

  const renderMessages = () => {
    const list = channelMessages(state.channel);

    const html = list
      .map((message, index) => {
        const user = USERS[message.author] || { name: message.author, color: '#5865F2', status: 'offline' };
        const previous = list[index - 1];
        const grouped = previous && previous.author === message.author;

        const stamp = message.time || new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        const reactions = (message.reactions || [])
          .map(
            (reaction, reactionIndex) => `
            <button class="reaction ${reaction.mine ? 'is-mine' : ''}" data-react="${reactionIndex}">
              <span>${reaction.emoji}</span><span class="reaction__count">${reaction.count}</span>
            </button>`
          )
          .join('');

        const cards = (message.cards || [])
          .map(
            (card) => `
            <a class="project-card" href="${card.href}" target="_blank" rel="noreferrer">
              <span class="project-card__icon">${card.icon}</span>
              <span class="project-card__body">
                <span class="project-card__name">${escapeHtml(card.name)}</span>
                <span class="project-card__desc">${escapeHtml(card.desc)}</span>
              </span>
            </a>`
          )
          .join('');

        const links = (message.links || [])
          .map(
            (link) => `
            <a class="popout__link" href="${link.href}" target="_blank" rel="noreferrer">
              <span>${link.icon}</span><span>${escapeHtml(link.label)}</span>
            </a>`
          )
          .join('');

        const head = grouped
          ? ''
          : `<div class="message__head">
               <span class="message__author" data-user="${escapeHtml(user.name)}">${escapeHtml(user.name)}</span>
               ${user.tag ? `<span class="message__badge">${escapeHtml(user.tag)}</span>` : ''}
               <span class="message__time">${stamp}</span>
             </div>`;

        const avatar = grouped
          ? '<span class="message__avatar"></span>'
          : `<span class="message__avatar" style="background:${user.color}" data-user="${escapeHtml(user.name)}">${escapeHtml(user.name[0])}</span>`;

        return `
          <div class="message ${grouped ? '' : 'message--first'}">
            ${avatar}
            <div class="message__body">
              ${head}
              <div class="message__text">${renderText(message.text)}</div>
              ${cards}
              ${links}
              ${reactions ? `<div class="message__reactions">${reactions}</div>` : ''}
            </div>
            <div class="message__actions">
              <button title="Добавить реакцию" aria-label="Добавить реакцию">😊</button>
              <button title="Ответить" aria-label="Ответить">↩</button>
              <button title="Ещё" aria-label="Ещё">⋯</button>
            </div>
          </div>`;
      })
      .join('');

    const today = `<div class="chat__divider-date">Сегодня</div>`;

    $('#messages').innerHTML = today + html;
    $('#messages').scrollTop = $('#messages').scrollHeight;
  };

  /* ---------------------------------------------------------
     Список участников
     --------------------------------------------------------- */

  const renderMembers = () => {
    const online = Object.values(USERS).filter((user) => user.status === 'online' || user.status === 'idle' || user.status === 'dnd');
    const offline = Object.values(USERS).filter((user) => user.status === 'offline');

    const row = (user) => `
      <button class="member ${user.status === 'offline' ? 'is-offline' : ''}" data-user="${escapeHtml(user.name)}">
        <span class="member__avatar" style="background:${user.color}">
          ${escapeHtml(user.name[0])}
          <span class="member__status member__status--${user.status}"></span>
        </span>
        <span class="member__name">${escapeHtml(user.name)}</span>
        ${user.tag ? `<span class="member__tag">${escapeHtml(user.tag)}</span>` : ''}
      </button>`;

    $('#members').innerHTML = `
      <div class="members__section">
        <div class="members__title">В сети — ${online.length}</div>
        ${online.map(row).join('')}
      </div>
      ${
        offline.length
          ? `<div class="members__section">
               <div class="members__title">Оффлайн — ${offline.length}</div>
               ${offline.map(row).join('')}
             </div>`
          : ''
      }`;
  };

  /* ---------------------------------------------------------
     Переключение канала
     --------------------------------------------------------- */

  const openChannel = (channelId) => {
    const channel = CHANNELS.find((item) => item.id === channelId);
    if (!channel) {
      return;
    }

    state.channel = channelId;
    localStorage.setItem(STORAGE.channel, channelId);

    $('#chat-title').textContent = channel.name;
    $('#chat-topic').textContent = channel.topic || '';
    $('#chat-icon').textContent = channel.type === 'voice' ? '🔊' : '#';
    $('#composer').placeholder = `Написать сообщение в #${channel.name}`;

    renderSidebar($('#channel-search').value);
    renderMessages();
  };

  /* ---------------------------------------------------------
     Отправка сообщения
     --------------------------------------------------------- */

  const sendMessage = () => {
    const input = $('#composer');
    const text = input.value.trim();
    if (!text) {
      return;
    }

    const bucket = state.extra[state.channel] || (state.extra[state.channel] = []);
    bucket.push({
      author: ME,
      text,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    });

    localStorage.setItem(STORAGE.messages, JSON.stringify(state.extra));

    input.value = '';
    input.style.height = 'auto';
    renderMessages();
  };

  /* ---------------------------------------------------------
     Тема
     --------------------------------------------------------- */

  const THEME_IDS = THEMES.map((theme) => theme.id);

  // Текущую тему держим в состоянии, а не вычитываем из className:
  // регулярка принимала «theme-darker» за «theme-dark», и кнопка залипала.
  const applyTheme = (theme) => {
    const next = THEME_IDS.includes(theme) ? theme : 'theme-darker';
    const root = document.documentElement;

    root.classList.remove(...THEME_IDS);
    root.classList.add(next);

    state.theme = next;
    localStorage.setItem(STORAGE.theme, next);

    updateThemeSwitch();
  };

  const nextTheme = () => {
    const index = THEME_IDS.indexOf(state.theme);
    applyTheme(THEME_IDS[(index + 1) % THEME_IDS.length]);
  };

  const updateThemeSwitch = () => {
    $$('.theme-switch__dot').forEach((dot) => {
      dot.classList.toggle('is-active', dot.dataset.theme === state.theme);
    });

    const button = $('.theme-switch');
    const theme = THEMES.find((item) => item.id === state.theme);
    if (button && theme) {
      button.title = `Смена темы · сейчас: ${theme.label}`;
    }
  };

  const renderThemeSwitch = () => {
    const slot = $('#theme-slot');

    // Переключатель создаём один раз, дальше только обновляем активную точку.
    if (!slot || $('.theme-switch', slot)) {
      updateThemeSwitch();
      return;
    }

    const block = document.createElement('button');
    block.type = 'button';
    block.className = 'theme-switch';
    block.innerHTML = `
      <span class="theme-switch__dots">
        ${THEMES.map(
          (theme) => `<span class="theme-switch__dot" data-theme="${theme.id}" style="background:${theme.dot}" title="${theme.label}"></span>`
        ).join('')}
      </span>
      <span>Смена темы</span>`;

    block.addEventListener('click', nextTheme);

    slot.appendChild(block);
    updateThemeSwitch();
  };

  /* ---------------------------------------------------------
     Rich Presence
     --------------------------------------------------------- */

  const STATUS_LABELS = {
    online: 'В сети',
    idle: 'Неактивен',
    dnd: 'Не беспокоить',
    invisible: 'Невидимый',
  };

  // Подпись в панели клиента: кружок статуса + текст или название активности.
  const renderRpcState = () => {
    const activity = ACTIVITIES.find((item) => item.id === state.activity);
    const dot = `<span class="rpc__dot rpc__dot--${state.status}"></span>`;

    let text;
    if (state.status === 'invisible') {
      text = STATUS_LABELS.invisible;
    } else if (activity && activity.id !== 'none') {
      text = `<strong>${escapeHtml(activity.label)}</strong> — ${escapeHtml(activity.detail)}`;
    } else {
      text = STATUS_LABELS[state.status] || STATUS_LABELS.online;
    }

    $('#rpc-state').innerHTML = `${dot}<span class="rpc__text">${text}</span>`;
  };

  const applyActivity = (id) => {
    const activity = ACTIVITIES.find((item) => item.id === id) || ACTIVITIES[0];

    state.activity = activity.id;
    localStorage.setItem(STORAGE.activity, activity.id);

    $('#rpc-avatar').style.background = USERS[ME].color;
    renderRpcState();
    renderRpcOptions();
  };

  const renderRpcOptions = () => {
    $('#rpc-options').innerHTML = ACTIVITIES.map(
      (activity) => `
      <button class="rpc__option ${activity.id === state.activity ? 'is-active' : ''}" data-activity="${activity.id}">
        <span class="rpc__option-icon">${activity.icon}</span>
        <span>${escapeHtml(activity.label)}<small>${escapeHtml(activity.detail)}</small></span>
      </button>`
    ).join('');
  };

  /* ---------------------------------------------------------
     Статус
     --------------------------------------------------------- */

  const applyStatus = (status) => {
    state.status = status;
    localStorage.setItem(STORAGE.status, status);

    USERS[ME].status = status;
    renderMembers();
    renderRpcState();
  };

  /* ---------------------------------------------------------
     Всплывающая карточка участника
     --------------------------------------------------------- */

  let popoutTimer = null;
  let popoutAnchor = null;

  // Ставим карточку рядом с участником и не даём ей уехать за край экрана.
  const positionPopout = (anchor) => {
    const popout = $('#popout');
    const rect = anchor.getBoundingClientRect();
    const width = popout.offsetWidth;
    const height = popout.offsetHeight;
    const margin = 8;

    let left = rect.left - width - margin;
    if (left < margin) {
      left = rect.right + margin;
    }
    left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);

    const top = Math.min(Math.max(rect.top - 16, margin), window.innerHeight - height - margin);

    popout.style.left = `${left}px`;
    popout.style.top = `${top}px`;
  };

  const showPopout = (userName, anchor) => {
    const user = USERS[userName];
    if (!user) {
      return;
    }

    const popout = $('#popout');
    popoutAnchor = anchor;
    $('#popout-avatar').textContent = user.name[0];
    $('#popout-avatar').style.background = user.color;
    $('#popout-name').innerHTML = `${escapeHtml(user.name)}${user.tag ? `<span class="popout__tag">${escapeHtml(user.tag)}</span>` : ''}`;
    $('#popout-meta').textContent = user.status === 'offline' ? 'Оффлайн' : user.status === 'dnd' ? 'Не беспокоить' : user.status === 'idle' ? 'Неактивен' : 'В сети';
    $('#popout-about').textContent = user.about;
    $('#popout-links').innerHTML = (user.links || [])
      .map((link) => `<a class="popout__link" href="${link.href}" target="_blank" rel="noreferrer"><span>${link.icon}</span><span>${escapeHtml(link.label)}</span></a>`)
      .join('');

    popout.classList.add('is-open');
    positionPopout(anchor);
  };

  const hidePopout = () => {
    $('#popout').classList.remove('is-open');
    popoutAnchor = null;
  };

  /* ---------------------------------------------------------
     Меню сервера
     --------------------------------------------------------- */

  const closeServerMenu = () => {
    const menu = $('#server-menu');
    menu.classList.remove('is-open');
    delete menu.dataset.guild;
  };

  const openServerMenu = (guildId, anchor) => {
    const menu = $('#server-menu');

    // Повторный клик по той же иконке закрывает меню.
    if (menu.classList.contains('is-open') && menu.dataset.guild === guildId) {
      closeServerMenu();
      return;
    }

    menu.dataset.guild = guildId;
    menu.innerHTML = `
      <button class="server-menu__item"><span>🔗</span> Пригласить друзей</button>
      <button class="server-menu__item"><span>⚙️</span> Настройки сервера</button>
      <div class="server-menu__sep"></div>
      <button class="server-menu__item"><span>🔔</span> Уведомления</button>
      <button class="server-menu__item" data-menu-action="theme"><span>🎨</span> Смена темы</button>
      <div class="server-menu__sep"></div>
      <button class="server-menu__item server-menu__item--danger"><span>🚪</span> Покинуть сервер</button>`;

    menu.classList.add('is-open');

    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(rect.right + margin, window.innerWidth - menu.offsetWidth - margin);
    const top = Math.min(rect.top, window.innerHeight - menu.offsetHeight - margin);

    menu.style.left = `${Math.max(margin, left)}px`;
    menu.style.top = `${Math.max(margin, top)}px`;
  };

  /* ---------------------------------------------------------
     События
     --------------------------------------------------------- */

  const initEvents = () => {
    // Каналы
    $('#sidebar-body').addEventListener('click', (event) => {
      const channel = event.target.closest('[data-channel]');
      if (channel) {
        openChannel(channel.dataset.channel);
      }
    });

    // Поиск каналов
    $('#channel-search').addEventListener('input', (event) => {
      renderSidebar(event.target.value);
    });

    // Отправка
    $('#send').addEventListener('click', sendMessage);

    $('#composer').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    $('#composer').addEventListener('input', (event) => {
      const el = event.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
      $('#send').classList.toggle('is-ready', el.value.trim().length > 0);
    });

    // Реакции
    $('#messages').addEventListener('click', (event) => {
      const reaction = event.target.closest('[data-react]');
      if (reaction) {
        reaction.classList.toggle('is-mine');
        const count = $('.reaction__count', reaction);
        const mine = reaction.classList.contains('is-mine');
        count.textContent = String(Math.max(0, Number(count.textContent) + (mine ? 1 : -1)));
        return;
      }

      const user = event.target.closest('[data-user]');
      if (user) {
        showPopout(user.dataset.user, user);
      }
    });

    // Карточка участника по наведению
    document.addEventListener('mouseover', (event) => {
      const user = event.target.closest('[data-user]');
      if (!user || popoutAnchor === user) {
        return;
      }
      clearTimeout(popoutTimer);
      popoutTimer = window.setTimeout(() => showPopout(user.dataset.user, user), 400);
    });

    document.addEventListener('mouseout', (event) => {
      if (!event.target.closest('[data-user]')) {
        return;
      }
      const next = event.relatedTarget;
      if (next instanceof Element && (next.closest('#popout') || next.closest('[data-user]'))) {
        return;
      }
      clearTimeout(popoutTimer);
      popoutTimer = window.setTimeout(hidePopout, 250);
    });

    // Пока курсор на самой карточке — не прячем её.
    $('#popout').addEventListener('mouseenter', () => window.clearTimeout(popoutTimer));
    $('#popout').addEventListener('mouseleave', () => {
      clearTimeout(popoutTimer);
      popoutTimer = window.setTimeout(hidePopout, 200);
    });

    // Клик по участнику в списке справа открывает карточку сразу.
    $('#members').addEventListener('click', (event) => {
      const user = event.target.closest('[data-user]');
      if (!user) {
        return;
      }
      clearTimeout(popoutTimer);
      showPopout(user.dataset.user, user);
    });

    window.addEventListener('resize', () => {
      if (popoutAnchor) {
        positionPopout(popoutAnchor);
      }
    });

    // RPC
    $('#rpc-btn').addEventListener('click', (event) => {
      event.stopPropagation();
      $('#rpc-menu').classList.toggle('is-open');
      $('#status-menu').classList.remove('is-open');
    });

    $('#rpc-options').addEventListener('click', (event) => {
      const option = event.target.closest('[data-activity]');
      if (!option) {
        return;
      }
      applyActivity(option.dataset.activity);
      $('#rpc-menu').classList.remove('is-open');
    });

    // Статус
    $('#status-menu').addEventListener('click', (event) => {
      const option = event.target.closest('[data-status]');
      if (!option) {
        return;
      }
      applyStatus(option.dataset.status);
      $('#status-menu').classList.remove('is-open');
    });

    // Открыть меню статуса по клику на панель RPC
    $('#rpc-card').addEventListener('click', (event) => {
      if (event.target.closest('#rpc-btn')) {
        return;
      }
      $('#status-menu').classList.toggle('is-open');
      $('#rpc-menu').classList.remove('is-open');
    });

    // Серверы
    $('#guilds').addEventListener('click', (event) => {
      const guild = event.target.closest('[data-guild]');
      if (!guild) {
        return;
      }
      openServerMenu(guild.dataset.guild, guild);
    });

    $('#server-menu').addEventListener('click', (event) => {
      const action = event.target.closest('[data-menu-action]');
      if (action && action.dataset.menuAction === 'theme') {
        nextTheme();
      }
      closeServerMenu();
    });

    // Закрытие всплывающих окон
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.rpc') && !event.target.closest('.server-menu')) {
        $('#rpc-menu').classList.remove('is-open');
        $('#status-menu').classList.remove('is-open');
      }
      if (!event.target.closest('.server-menu') && !event.target.closest('[data-guild]')) {
        closeServerMenu();
      }
      if (!event.target.closest('[data-user]') && !event.target.closest('#popout')) {
        hidePopout();
      }
    });

    // Переключение списка участников
    $('#toggle-members').addEventListener('click', () => {
      $('#members').classList.toggle('is-hidden');
    });

    // Клавиша Escape
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      $('#rpc-menu').classList.remove('is-open');
      $('#status-menu').classList.remove('is-open');
      closeServerMenu();
      hidePopout();
    });
  };

  /* ---------------------------------------------------------
     Экран загрузки: вращающиеся подсказки и плавное исчезновение
     --------------------------------------------------------- */

  const BOOT_TIPS = [
    'Совет: нажмите Escape, чтобы закрыть открытое меню или карточку.',
    'Совет: Shift + Enter переносит строку, а Enter отправляет сообщение.',
    'Совет: наведите курсор на участника — откроется его карточка.',
    'Совет: кнопка «Смена темы» под каналами переключает три оформления.',
    'Совет: шестерёнка на панели внизу выбирает активность Rich Presence.',
    'Совет: клик по панели внизу меняет ваш статус.',
    'Совет: поле «Найти канал» фильтрует список на лету.',
    'Совет: сообщения сохраняются в localStorage и переживают перезагрузку.',
    'Совет: клик по иконке сервера открывает меню сервера.',
  ];

  const BOOT_MIN_MS = 3800;
  const BOOT_TIP_MS = 1700;

  const initBoot = () => {
    const boot = $('#boot');
    const tip = $('#boot-tip');
    if (!boot || !tip) {
      return;
    }

    const startedAt = Date.now();
    let tipIndex = 0;
    let tipTimer = null;
    let done = false;

    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      window.clearInterval(tipTimer);
      boot.classList.add('is-done');
      window.setTimeout(() => boot.remove(), 600);
    };

    tip.textContent = BOOT_TIPS[0];

    tipTimer = window.setInterval(() => {
      tip.classList.add('is-fading');
      window.setTimeout(() => {
        if (done) {
          return;
        }
        tipIndex = (tipIndex + 1) % BOOT_TIPS.length;
        tip.textContent = BOOT_TIPS[tipIndex];
        tip.classList.remove('is-fading');
      }, 220);
    }, BOOT_TIP_MS);

    // Заставка живёт не меньше BOOT_MIN_MS, но ждёт загрузку картинок и шрифтов.
    const schedule = () => {
      window.setTimeout(finish, Math.max(0, BOOT_MIN_MS - (Date.now() - startedAt)));
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    // Страховка: даже если load не придёт, экран не останется навсегда.
    window.setTimeout(finish, 12000);
    boot.addEventListener('click', finish);
  };

  /* ---------------------------------------------------------
     Запуск
     --------------------------------------------------------- */

  const init = () => {
    initBoot();

    applyTheme(state.theme);
    $('#rpc-name').textContent = ME;
    $('#rpc-avatar').textContent = ME[0];

    applyActivity(state.activity);
    applyStatus(state.status);

    renderGuilds();
    renderSidebar();
    renderMembers();
    openChannel(state.channel);
    renderThemeSwitch();
    initEvents();
  };

  init();
})();
