/* ==========================================================================
   Тема и язык.
   ==========================================================================

   ПОЧЕМУ ТЕМА ЖИВЁТ ЗДЕСЬ, А НЕ В app.js. Она должна примениться ДО первой
   отрисовки: иначе человек с тёмной темой увидит вспышку светлого экрана.
   Поэтому файл подключается раньше приложения и первым делом красит
   документ.

   ЧТО БЫЛО СЛОМАНО. Раньше у Telegram бралась ОДНА переменная — цвет фона.
   В тёмной теме мессенджера это давало чёрную подложку под белыми
   карточками с тёмным текстом. Половина темы хуже, чем никакой: без неё
   приложение выглядело бы просто светлым, а с ней — сломанным.
   ========================================================================== */

(function () {
  var TG = window.Telegram && window.Telegram.WebApp;
  var LS_THEME = 'theme', LS_LANG = 'lang';

  /* ---------------------------- тема ------------------------------------ */
  /* Три состояния, а не два. «Авто» — это уважение к настройке мессенджера:
     человек, включивший тёмную тему в Telegram, ждёт её и здесь. Но если он
     выбрал явно, его выбор сильнее — потому и хранится отдельно. */
  var THEMES = ['auto', 'light', 'dark'];

  function tgIsDark() {
    if (TG && TG.colorScheme) return TG.colorScheme === 'dark';
    return window.matchMedia &&
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function resolve(mode) {
    return mode === 'auto' ? (tgIsDark() ? 'dark' : 'light') : mode;
  }

  function applyTheme() {
    var mode = UI.theme;
    var real = resolve(mode);
    document.documentElement.setAttribute('data-theme', real);
    /* Шапка мессенджера красится в цвет фона приложения, иначе на границе
       остаётся полоса чужого цвета. */
    try {
      var bg = getComputedStyle(document.documentElement)
                 .getPropertyValue('--bg').trim();
      if (TG && TG.setBackgroundColor) TG.setBackgroundColor(bg);
      if (TG && TG.setHeaderColor) TG.setHeaderColor(bg);
    } catch (e) {}
  }

  /* ---------------------------- язык ------------------------------------ */
  /* Язык угадывается по Telegram, но только один раз: дальше решает выбор
     человека. Русский по умолчанию — бот русскоязычный. */
  function guessLang() {
    var code = TG && TG.initDataUnsafe && TG.initDataUnsafe.user &&
               TG.initDataUnsafe.user.language_code;
    if (!code) code = (navigator.language || 'ru').slice(0, 2);
    return code === 'ru' ? 'ru' : 'en';
  }

  var STR = {
    ru: {
      market: 'Рынок', coins: 'Монеты', calls: 'Коллы', profile: 'Профиль',
      analysis: 'Разбор',
      marketSub: 'Что сканер видит прямо сейчас',
      coinsSub: 'Вселенная сканера — топ-100 и мемкоины',
      callsAll: 'Все сигналы и их исходы',
      callsSettled: 'Отработавшие сигналы',
      loading: 'Загружаю…', refreshing: 'Обновляю…',
      callsPerDay: 'Коллов в сутки', beatBtc: 'Обогнали BTC · сутки',
      passes: 'Проходов за 24ч', downtime: 'Простой',
      none: 'нет', min: 'мин',
      findCoin: 'Найти монету и разобрать',
      tierAccuracy: 'Точность по классам', last30: 'за 30 дней',
      noData: 'данных нет', measures: 'замеров',
      freshCalls: 'Свежие коллы', all: 'все',
      noCalls: 'Коллов пока не было', empty: 'Пока пусто',
      running: 'идёт', forHours: 'за',
      search: 'Тикер или название', nothingFound: 'Ничего не нашлось',
      tabAll: 'Все', tabMajor: 'Крупные', tabNews: 'Новостные',
      tabAlt: 'Альткоины', tabMeme: 'Мемкоины',
      long: 'Лонг', short: 'Шорт', watch: 'Ждём',
      agreement: 'согласие',
      levels: 'Вход, цели и стоп', rr: 'прибыль к риску',
      entry: 'Вход', target1: 'Цель 1', target2: 'Цель 2', stop: 'Стоп',
      whyScore: 'Из чего оценка', weight: 'вес компонента',
      news: 'Новости', newsEcho: 'Пишут о самом движении',
      noSeries: 'Ряд цен недоступен',
      onlySettled: 'Показаны только отработавшие',
      onlySettledWhy: 'Здесь коллы, у которых закрылись все горизонты — им ' +
        'не меньше недели, торговой ценности в них уже нет. Свежие сигналы ' +
        'приходят подписчикам в момент выхода.',
      outsideTg: 'Открыто вне Telegram',
      whoAreYou: 'Кто вы — неизвестно',
      whoAreYouWhy: 'Личность подтверждается подписью Telegram, а её выдаёт ' +
        'только сам мессенджер. Откройте приложение кнопкой в боте, и ' +
        'профиль появится.',
      subActive: 'Подписка активна', subNone: 'Без подписки',
      subscription: 'Подписка', active: 'активна', until: 'до',
      whichCalls: 'Какие коллы приходят', on: 'вкл', off: 'выкл',
      togglesWhy: 'Переключаются в боте: «Настройки» → «Какие коллы ' +
        'присылать». Здесь они показаны, но не меняются — чтобы не было ' +
        'двух мест, где одно и то же настраивается по-разному.',
      errData: 'Данные недоступны: бот выключен или туннель перезапустился.',
      errNoApi: 'Откройте приложение кнопкой в боте — по ссылке адрес ' +
        'данных не передаётся.',
      errCoin: 'Монету разобрать не вышло',
      themeAuto: 'Тема: как в Telegram', themeLight: 'Тема: светлая',
      themeDark: 'Тема: тёмная',
      langSwitched: 'Язык переключён'
    },
    en: {
      market: 'Market', coins: 'Coins', calls: 'Calls', profile: 'Profile',
      analysis: 'Analysis',
      marketSub: 'What the scanner sees right now',
      coinsSub: 'Scanner universe — top 100 and memecoins',
      callsAll: 'All signals and their outcomes',
      callsSettled: 'Settled signals',
      loading: 'Loading…', refreshing: 'Refreshing…',
      callsPerDay: 'Calls per day', beatBtc: 'Beat BTC · 24h',
      passes: 'Scans in 24h', downtime: 'Downtime',
      none: 'none', min: 'min',
      findCoin: 'Find a coin to analyse',
      tierAccuracy: 'Accuracy by class', last30: 'last 30 days',
      noData: 'no data', measures: 'measurements',
      freshCalls: 'Latest calls', all: 'all',
      noCalls: 'No calls yet', empty: 'Nothing here yet',
      running: 'open', forHours: 'in',
      search: 'Ticker or name', nothingFound: 'Nothing found',
      tabAll: 'All', tabMajor: 'Majors', tabNews: 'News-driven',
      tabAlt: 'Altcoins', tabMeme: 'Memecoins',
      long: 'Long', short: 'Short', watch: 'Watch',
      agreement: 'agreement',
      levels: 'Entry, targets and stop', rr: 'reward to risk',
      entry: 'Entry', target1: 'Target 1', target2: 'Target 2', stop: 'Stop',
      whyScore: 'Behind the score', weight: 'component weight',
      news: 'News', newsEcho: 'Coverage of the move itself',
      noSeries: 'Price series unavailable',
      onlySettled: 'Settled calls only',
      onlySettledWhy: 'These are calls whose horizons have all closed — ' +
        'they are at least a week old and no longer tradeable. Fresh ' +
        'signals reach subscribers the moment they fire.',
      outsideTg: 'Opened outside Telegram',
      whoAreYou: 'Identity unknown',
      whoAreYouWhy: 'Identity is proven by a Telegram signature, and only ' +
        'the messenger itself issues one. Open the app from the button in ' +
        'the bot and your profile will appear.',
      subActive: 'Subscription active', subNone: 'No subscription',
      subscription: 'Subscription', active: 'active', until: 'until',
      whichCalls: 'Which calls you receive', on: 'on', off: 'off',
      togglesWhy: 'Change them in the bot: Settings → Which calls to send. ' +
        'They are shown here but not editable, so the same thing is not ' +
        'configured in two different places.',
      errData: 'No data: the bot is off or the tunnel restarted.',
      errNoApi: 'Open the app from the button in the bot — a plain link ' +
        'carries no data address.',
      errCoin: 'Could not analyse this coin',
      themeAuto: 'Theme: follow Telegram', themeLight: 'Theme: light',
      themeDark: 'Theme: dark',
      langSwitched: 'Language switched'
    }
  };

  var UI = {
    theme: localStorage.getItem(LS_THEME) || 'auto',
    lang: localStorage.getItem(LS_LANG) || guessLang(),

    t: function (key) {
      var d = STR[UI.lang] || STR.ru;
      return d[key] != null ? d[key] : (STR.ru[key] != null ? STR.ru[key] : key);
    },

    /* Локаль для чисел следует языку: «1 234,56» и «1,234.56» — не
       украшение, а разные способы прочитать одно число неправильно. */
    locale: function () { return UI.lang === 'ru' ? 'ru-RU' : 'en-US'; },

    cycleTheme: function () {
      var i = THEMES.indexOf(UI.theme);
      UI.theme = THEMES[(i + 1) % THEMES.length];
      localStorage.setItem(LS_THEME, UI.theme);
      applyTheme();
      return UI.t('theme' + UI.theme[0].toUpperCase() + UI.theme.slice(1));
    },

    toggleLang: function () {
      UI.lang = UI.lang === 'ru' ? 'en' : 'ru';
      localStorage.setItem(LS_LANG, UI.lang);
      return UI.lang;
    },

    applyTheme: applyTheme
  };

  if (THEMES.indexOf(UI.theme) < 0) UI.theme = 'auto';
  window.UI = UI;
  applyTheme();

  /* Смена темы в мессенджере догоняет приложение только в режиме «авто» —
     явный выбор человека она перебивать не должна. */
  if (TG && TG.onEvent) {
    TG.onEvent('themeChanged', function () {
      if (UI.theme === 'auto') applyTheme();
    });
  }
})();
