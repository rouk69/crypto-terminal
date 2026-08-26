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
      tier_major: 'Крупные', tier_news: 'Новостной',
      tier_alt: 'Альткоин', tier_meme: 'Мемкоин',
      risk_major: 'умеренный риск', risk_news: 'средний риск',
      risk_alt: 'повышенный риск', risk_meme: 'лотерея',
      up_major: 'движение небольшое', up_news: 'движение резкое, но короткое',
      up_alt: 'движение заметное', up_meme: 'может дать кратно',
      lotteryWarning: 'Заходить только суммой, которую не жалко потерять ' +
        'целиком: у таких монет это обычный исход, а не редкий.',
      levelsNote: 'Вход — текущая цена, без ожидания отката. Первая цель — ' +
        'там, где монета уже разворачивалась за сутки. Вторая — за границей ' +
        'суточного диапазона, если движение продолжится. Стоп за входом: ' +
        'дальше него движение против позиции перестаёт быть шумом. Уровни ' +
        'считаются от диапазона суток, а не от фиксированного процента: на ' +
        'биткоине и на мемкоине «пять процентов» означают совершенно разное.',
      marketSub: 'Что сканер видит прямо сейчас',
      coinsSub: 'Что отслеживаем: топ-100 и мемкоины',
      callsAll: 'Все сигналы и их исходы',
      callsSettled: 'Отработавшие сигналы',
      loading: 'Загружаю…', refreshing: 'Обновляю…',
      callsPerDay: 'Коллов в день', winrate: 'Винрейт',
      winrateHint: 'BTC рос', collecting: 'накапливается',
      passes: 'Сканов за 24ч', downtime: 'Простой',
      none: 'нет', min: 'мин',
      findCoin: 'Найти монету и разобрать',
      tierAccuracy: 'Винрейт по классам', last30: 'за 30 дней',
      tierNote: 'Доля коллов, закрывшихся в плюс. ×2 и ×0,5 — вес класса в '+
        'общем винрейте: он равен тому, во сколько раз крупнее позицию '+
        'мы советуем этим классом, иначе два десятка мемкоинов за месяц '+
        'перевесили бы горстку крупных и «общий процент» оказался бы '+
        'процентом по мемкоинам. Ничья в счёт не идёт. Пока замеров мало, '+
        'процент не показывается вовсе: на трёх десятках наблюдений '+
        'интервал шире ±18 пунктов, и такое число читается как факт, '+
        'фактом не являясь. Смотрите вместе '+
        'с ростом самого биткоина наверху: на растущем рынке высокий '+
        'процент даёт и слепая покупка чего угодно.',
      noData: 'данных нет', measures: 'замеров',
      freshCalls: 'Свежие коллы', all: 'все',
      noCalls: 'Коллов пока не было', empty: 'Пока пусто',
      running: 'идёт', forHours: 'за',
      h1: '1ч', h24: '24ч', h168: '7д',
      fngTitle: 'Индекс страха и жадности', fngYesterday: 'вчера',
      fngExtremeFear: 'Крайний страх', fngFear: 'Страх',
      fngNeutral: 'Нейтрально', fngGreed: 'Жадность',
      fngExtremeGreed: 'Крайняя жадность',
      search: 'Тикер или название', nothingFound: 'Ничего не нашлось',
      tabAll: 'Все', tabMajor: 'Крупные', tabNews: 'Новостные',
      tabAlt: 'Альткоины', tabMeme: 'Мемкоины',
      long: 'Лонг', short: 'Шорт', watch: 'Ждём',
      agreement: 'согласие',
      levels: 'Вход, цели и стоп', rr: 'прибыль к риску (R:R)',
      entry: 'Вход', target1: 'Цель 1', target2: 'Цель 2', stop: 'Стоп',
      plan: 'План сделки', planSub: 'проценты чистые, на маржу позиции',
      planAvg: 'Сделки по плану', planPositive: 'в плюсе', planStops: 'стоп',
      planTentative: 'Сигнала бот не даёт: перевес есть, но слабый. Ниже — ' +
        'как выглядел бы вход, если решите зайти сами.',
      planMissing: 'План не считается: не загрузился ряд цен, а уровни ' +
        'берутся из суточного диапазона. Обычно это лимит запросов — ' +
        'откройте монету через минуту.',
      planResult: 'Сделка по плану:',
      planThin: 'Путь цены записан редко — исход недостоверен и в ' +
        'статистику не идёт.',
      exit_target2: 'обе цели', exit_target1: 'цель 1, остаток по времени',
      exit_breakeven: 'цель 1, остаток в безубытке', exit_stop: 'стоп',
      exit_time: 'по времени', exit_partial: 'наблюдение оборвалось',
      exit_nodata: 'путь цены не записан',
      leverage: 'Плечо', noLeverage: 'без плеча', liq: 'ликвидация',
      closeBy: 'Закрыть через', closeAnyway: 'даже если уровни не задеты',
      h: 'ч', onDeposit: 'На весь депозит', stake: 'позиция',
      planNote: 'Плечо не выбрано, а посчитано от стопа: на этом стопе оно ' +
        'стоит пятой части маржи, если сигнал не сработает. Ликвидация ' +
        'остаётся вдвое дальше стопа — запас нужен на то, что стоп ' +
        'исполняется по стакану, а не по своей цене. На первой цели ' +
        'фиксируется половина, стоп переносится в вход, и дальше сделка уже ' +
        'не может закончиться минусом. По времени она закрывается через ' +
        'сутки в любом случае: ровно на этом горизонте меряется точность ' +
        'коллов, дальше про сигнал не известно ничего. Проценты чистые — ' +
        'после комиссий и фандинга, которые на плече умножаются вместе с ' +
        'прибылью.',
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
      myQueries: 'разборов', myFavorites: 'Избранное',
      myFavCount: 'в избранном',
      myAlerts: 'уведомлений', myDays: 'дней с ботом',
      noFavorites: 'Пусто. Монеты добавляются звёздочкой в боте — '+
        'на экране разбора.',
      subscription: 'Подписка', active: 'активна', until: 'до',
      whichCalls: 'Какие коллы приходят', on: 'вкл', off: 'выкл',
      togglesWhy: 'Переключаются в боте: «Настройки» → «Какие коллы ' +
        'присылать». Здесь они показаны, но не меняются — чтобы не было ' +
        'двух мест, где одно и то же настраивается по-разному.',
      errData: 'Данные недоступны: бот выключен или туннель ' +
        'перезапустился. Если перезапустился — откройте приложение заново ' +
        'кнопкой в боте, у неё всегда свежий адрес.',
      errNoApi: 'Откройте приложение кнопкой в боте — по ссылке адрес ' +
        'данных не передаётся.',
      errRateLimit: 'Источник ограничивает запросы. Данные есть, их просто ' +
        'сейчас не отдают — попробуйте через минуту.',
      errCoin: 'Монету разобрать не вышло',
      staleData: 'Бот сейчас недоступен. Данные собраны',
      minAgo: 'мин назад',
      themeAuto: 'Тема: как в Telegram', themeLight: 'Тема: светлая',
      themeDark: 'Тема: тёмная',
      langSwitched: 'Язык переключён'
    },
    en: {
      market: 'Market', coins: 'Coins', calls: 'Calls', profile: 'Profile',
      analysis: 'Analysis',
      tier_major: 'Majors', tier_news: 'News-driven',
      tier_alt: 'Altcoin', tier_meme: 'Memecoin',
      risk_major: 'moderate risk', risk_news: 'medium risk',
      risk_alt: 'elevated risk', risk_meme: 'a lottery',
      up_major: 'small moves', up_news: 'sharp but short moves',
      up_alt: 'noticeable moves', up_meme: 'can pay many times over',
      lotteryWarning: 'Only risk what you can lose in full: for coins like ' +
        'these that is an ordinary outcome, not a rare one.',
      levelsNote: 'Entry is the current price, with no waiting for a ' +
        'pullback. The first target sits where the coin already turned ' +
        'around today. The second is beyond the daily range, if the move ' +
        'carries on. The stop is past the entry: further than that, a move ' +
        'against the position stops being noise. Levels come from the daily ' +
        'range rather than a fixed percentage — on bitcoin and on a memecoin ' +
        '"five percent" mean entirely different things.',
      marketSub: 'What the scanner sees right now',
      coinsSub: 'What we track: top 100 and memecoins',
      callsAll: 'All signals and their outcomes',
      callsSettled: 'Settled signals',
      loading: 'Loading…', refreshing: 'Refreshing…',
      callsPerDay: 'Calls per day', winrate: 'Win rate',
      winrateHint: 'BTC rose', collecting: 'collecting',
      passes: 'Scans in 24h', downtime: 'Downtime',
      none: 'none', min: 'min',
      findCoin: 'Find a coin to analyse',
      tierAccuracy: 'Win rate by class', last30: 'last 30 days',
      tierNote: 'Share of calls that closed in profit. The ×2 and ×0.5 are '+
        'class weights in the overall win rate — they match how much '+
        'larger a position we advise for that class. Without them two '+
        'dozen memecoin calls a month would outvote a handful of majors. '+
        'While samples are small no percentage is shown at all: on a few '+
        'dozen measurements the interval is wider than ±18 points, and '+
        'such a number reads as a fact while being none. '+
        'Draws are excluded. Read it next to how often BTC itself rose, '+
        'shown above: in a rising market a high hit rate comes from '+
        'buying anything at all.',
      noData: 'no data', measures: 'measurements',
      freshCalls: 'Latest calls', all: 'all',
      noCalls: 'No calls yet', empty: 'Nothing here yet',
      running: 'open', forHours: 'in',
      h1: '1h', h24: '24h', h168: '7d',
      fngTitle: 'Fear & Greed index', fngYesterday: 'yesterday',
      fngExtremeFear: 'Extreme fear', fngFear: 'Fear',
      fngNeutral: 'Neutral', fngGreed: 'Greed',
      fngExtremeGreed: 'Extreme greed',
      search: 'Ticker or name', nothingFound: 'Nothing found',
      tabAll: 'All', tabMajor: 'Majors', tabNews: 'News-driven',
      tabAlt: 'Altcoins', tabMeme: 'Memecoins',
      long: 'Long', short: 'Short', watch: 'Watch',
      agreement: 'agreement',
      levels: 'Entry, targets and stop', rr: 'reward to risk (R:R)',
      entry: 'Entry', target1: 'Target 1', target2: 'Target 2', stop: 'Stop',
      plan: 'Trade plan', planSub: 'net percentages, on position margin',
      planAvg: 'Trades by the plan', planPositive: 'in profit', planStops: 'stopped',
      planTentative: 'Not a signal: the lean is there but weak. Below is ' +
        'what an entry would look like if you decide to take it yourself.',
      planMissing: 'No plan: the price series did not load, and levels come ' +
        'from the daily range. Usually this is a rate limit — open the coin ' +
        'again in a minute.',
      planResult: 'Trade by the plan:',
      planThin: 'The price path was recorded too sparsely — this outcome ' +
        'is unreliable and is left out of the statistics.',
      exit_target2: 'both targets', exit_target1: 'target 1, rest on time',
      exit_breakeven: 'target 1, rest at breakeven', exit_stop: 'stop',
      exit_time: 'on time', exit_partial: 'observation cut short',
      exit_nodata: 'no price path recorded',
      leverage: 'Leverage', noLeverage: 'no leverage', liq: 'liquidation',
      closeBy: 'Close after', closeAnyway: 'even if no level is hit',
      h: 'h', onDeposit: 'On the whole deposit', stake: 'position',
      planNote: 'Leverage is derived from the stop, not picked: at this stop ' +
        'it costs a fifth of the position margin if the signal fails. ' +
        'Liquidation stays twice as far as the stop — that buffer covers the ' +
        'fact that a stop fills against the book, not at its own price. Half ' +
        'is taken at the first target and the stop moves to entry, after ' +
        'which the trade can no longer end in the red. It closes on time ' +
        'after a day regardless: that is exactly the horizon call accuracy ' +
        'is measured on, and beyond it nothing is known about the signal. ' +
        'Percentages are net of fees and funding, which leverage multiplies ' +
        'along with the profit.',
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
      myQueries: 'analyses', myFavorites: 'Favorites',
      myFavCount: 'favorites',
      myAlerts: 'alerts', myDays: 'days here',
      noFavorites: 'Empty. Add coins with the star in the bot, on the '+
        'analysis screen.',
      subscription: 'Subscription', active: 'active', until: 'until',
      whichCalls: 'Which calls you receive', on: 'on', off: 'off',
      togglesWhy: 'Change them in the bot: Settings → Which calls to send. ' +
        'They are shown here but not editable, so the same thing is not ' +
        'configured in two different places.',
      errData: 'No data: the bot is off or the tunnel restarted. If it ' +
        'restarted, reopen the app from the button in the bot — that one ' +
        'always carries the current address.',
      errNoApi: 'Open the app from the button in the bot — a plain link ' +
        'carries no data address.',
      errRateLimit: 'The data source is rate-limiting us. The data exists, ' +
        'it is just not being served right now — try again in a minute.',
      errCoin: 'Could not analyse this coin',
      staleData: 'The bot is unreachable. Data is from',
      minAgo: 'min ago',
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
