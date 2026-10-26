/* =========================================================
   Данные клиента-визитки.
   Разработчик — SpleIII, пользователь-заглушка — JadecordUser.
   ========================================================= */

const ME = 'JadecordUser';
const DEVELOPER = 'SpleIII';

/* ---------- участники ---------- */

const USERS = {
  SpleIII: {
    name: 'SpleIII',
    tag: 'Разработчик',
    status: 'online',
    color: '#5865F2',
    about: 'Разработчик. Собираю пайплайны, контейнеры и клиенты под Discord.',
    links: [
      { icon: '📁', label: 'github.com/SpleIII', href: 'https://github.com/SpleIII' },
      { icon: '📦', label: 'Zadanie', href: 'https://github.com/SpleIII/Zadanie' },
      { icon: '🐳', label: 'Docker-Compose', href: 'https://github.com/SpleIII/Docker-Compose' },
    ],
  },

  JadecordUser: {
    name: 'JadecordUser',
    status: 'online',
    color: '#3BA55D',
    about: 'Заглушка на время разработки визитки.',
    links: [],
  },
};

/* ---------- серверы ---------- */

const GUILDS = [
  { id: 'dev', name: 'SpleIII Development', icon: 'S', color: '#5865F2', active: true },
  { id: 'add', name: 'Добавить сервер', icon: '＋', add: true },
];

/* ---------- каналы ---------- */

const CHANNELS = [
  { id: 'visitka', type: 'text', name: 'визитка', topic: 'Кто я и чем занимаюсь' },
  { id: 'projects', type: 'text', name: 'проекты', topic: 'Что уже сделано' },
  { id: 'client', type: 'text', name: 'discord-клиент', topic: 'Как устроен этот клиент' },
  { id: 'contacts', type: 'text', name: 'контакты', topic: 'Куда писать' },
  { id: 'general', type: 'voice', name: 'Общий', members: ['SpleIII'] },
  { id: 'dev', type: 'voice', name: 'Разработка', members: [] },
];

/* ---------- сообщения ---------- */

const MESSAGES = {
  visitka: [
    {
      author: 'SpleIII',
      time: '09:12',
      text: 'Привет. Это **SpleIII** — разработчик. Собрал визитку прямо в виде Discord-клиента: всё, что вы видите, это чистые HTML, CSS и JavaScript без единой зависимости.',
    },
    {
      author: 'SpleIII',
      time: '09:12',
      text: 'Слева — серверы, рядом — каналы, справа — участники. Каналы переключаются, сообщения отправляются, тема меняется на лету. Никакого бэкенда.',
    },
    {
      author: 'JadecordUser',
      time: '09:15',
      text: 'Это правда работает?',
    },
    {
      author: 'SpleIII',
      time: '09:15',
      text: 'Работает. Всё живёт в браузере, переписка сохраняется в `localStorage` — закроешь вкладку и вернёшься, сообщения останутся.',
    },
    {
      author: 'JadecordUser',
      time: '09:17',
      text: 'Ну тогда привет 👋',
      reactions: [{ emoji: '👋', count: 2, mine: true }],
    },
  ],

  projects: [
    {
      author: 'SpleIII',
      time: '09:20',
      text: 'Основное, что успел:',
      cards: [
        {
          icon: '⚙️',
          name: 'Zadanie',
          desc: '10 учебных CI/CD пайплайнов в одном монорепозитории',
          href: 'https://github.com/SpleIII/Zadanie',
        },
        {
          icon: '🐳',
          name: 'Docker-Compose',
          desc: '12 готовых compose-стеков и визуальный каталог',
          href: 'https://github.com/SpleIII/Docker-Compose',
        },
        {
          icon: '🎮',
          name: 'Discord',
          desc: 'Этот клиент — визитка в стиле Discord',
          href: 'https://github.com/SpleIII/Discord',
        },
      ],
    },
    {
      author: 'SpleIII',
      time: '09:21',
      text: 'У каждого проекта свой пайплайн: Docker-образы в GHCR, бинарники в Releases, сайты на GitHub Pages.',
    },
  ],

  client: [
    {
      author: 'SpleIII',
      time: '09:24',
      text: 'Про сам клиент. Это макет приложения Discord, собранный с нуля: те же размеры сетки, те же цвета, те же темы.',
    },
    {
      author: 'SpleIII',
      time: '09:24',
      text: 'Размеры сняты прямо из настоящего Discord — рельс серверов **72px**, сайдбар каналов **280px**, шапка чата **49px**, аватар сервера **40px**. Палитра тоже оттуда: `theme-dark`, `theme-darker` и `theme-light` с настоящими значениями `neutral-*`.',
    },
    {
      author: 'JadecordUser',
      time: '09:26',
      text: 'А что за панель снизу слева?',
    },
    {
      author: 'SpleIII',
      time: '09:26',
      text: 'Это Rich Presence — кусок настоящего клиента. Открой меню шестерёнкой: можно выбрать, что сейчас «играешь». Как в Discord с активностями.',
      reactions: [{ emoji: '🔥', count: 1, mine: false }],
    },
    {
      author: 'SpleIII',
      time: '09:27',
      text: 'Свой статус тоже меняется: в сети, неактивен, не беспокоить, невидимый. Ищи внизу под Rich Presence.',
    },
  ],

  contacts: [
    {
      author: 'SpleIII',
      time: '09:30',
      text: 'Писать можно сюда:',
      links: [
        { icon: '📁', label: 'github.com/SpleIII', href: 'https://github.com/SpleIII' },
        { icon: '📧', label: 'SpleIII@users.noreply.github.com', href: 'mailto:SpleIII@users.noreply.github.com' },
      ],
    },
    {
      author: 'SpleIII',
      time: '09:30',
      text: 'Репозиторий с этой визиткой — [github.com/SpleIII/Discord](https://github.com/SpleIII/Discord).',
    },
  ],
};

/* ---------- активности Rich Presence ---------- */

const ACTIVITIES = [
  { id: 'none', icon: '💤', label: 'Не играет', detail: 'Discord' },
  { id: 'zadanie', icon: '⚙️', label: 'Zadanie', detail: 'Собирает пайплайны' },
  { id: 'compose', icon: '🐳', label: 'Docker-Compose', detail: 'Поднимает стеки' },
];

/* ---------- темы ---------- */

const THEMES = [
  { id: 'theme-dark', label: 'Тёмная', dot: '#313338' },
  { id: 'theme-darker', label: 'Тёмнее', dot: '#1a1a1e' },
  { id: 'theme-light', label: 'Светлая', dot: '#f3f3f4' },
];
