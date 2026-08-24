/* ==========================================================================
   Мини-апп крипто-разбора. Дизайн-система прототипа сохранена целиком,
   данные — настоящие, из API бота.
   ==========================================================================

   ЧЕГО ЗДЕСЬ НЕТ И ПОЧЕМУ. В макете были потоки крупных кошельков
   («+214 млн $»), разбивка объёма по биржам и золотые кресты EMA. Таких
   источников у бота нет, и рисовать правдоподобные цифры в приложении,
   по которому человек принимает решения о деньгах, нельзя. Панели убраны,
   а не заполнены заглушками: пустая рамка с надписью «скоро» занимает
   пол-экрана и обещает то, чего никто не обещал.

   Что вместо них появилось: вход, цели и стоп — их бот теперь считает
   по-настоящему, от суточного диапазона монеты.
   ========================================================================== */

const TG = window.Telegram && window.Telegram.WebApp;

/* null означает «адрес неизвестен»: страница открыта на постоянном
   домене без параметра ссылки — например, по закладке. Пустая строка,
   наоборот, законна и означает «данные там же, где страница». */
const API = window.API_BASE;
const NO_API = API === null || API === undefined;

/* ---------------------------- иконки ------------------------------------ */
const I = {
  grid:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  coins:  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="9" r="6"/><path d="M15.5 4.3a6 6 0 0 1 0 15.4M13 21a6 6 0 0 0 0-12"/></svg>',
  bell:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  user:   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>',
  chevL:  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
  refresh:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-.7 4.3"/><path d="M20 4v6h-6"/></svg>',
  moon:   '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>',
  sun:    '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
};

/* Иконки строк: путь отдельно от обёртки.
   Обёртка у всех одна и та же — 24x24, обводка currentColor, скругления,
   как у набора в I выше. Держать её в каждой иконке значило бы
   пятнадцать раз повторить одну строку и однажды разойтись в толщине. */
const P = {
  trend:   '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  pulse:   '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  globe:   '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  zap:     '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  swap:    '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  chat:    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  target:  '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  login:   '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><path d="M15 12H3"/>',
  octagon: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  gem:     '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/>',
  horn:    '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  medal:   '<circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 7 2h10l-1.5 7.5"/>',
  chevR:   '<path d="m9 5 7 7-7 7"/>',
  dice:    '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.6" cy="8.6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.3" fill="currentColor" stroke="none"/>'
};

function svg(name, size){
  return P[name] ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round">${P[name]}</svg>` : '';
}

/* Иконка по СМЫСЛУ компонента, а не по порядку: строки разбора
   пересортировываются по вкладу, и привязка к позиции разъехалась бы. */
const FACTOR_ICON = {
  price: 'trend', technicals: 'pulse', sentiment: 'chat', trigger: 'zap',
  fundamentals: 'shield', derivatives: 'swap', macro: 'globe',
  btc_regime: 'compass'
};

/* Классы риска. В боте они остались цветными эмодзи намеренно — там это
   ярусный ряд медалей, и цвет несёт смысл. Здесь набор монохромный и
   линейный, поэтому эмодзи выбивались из него единственным цветным пятном. */
const TIER_ICON = {
  major: 'gem', news: 'horn', alt: 'medal', meme: 'dice'
};

const SIDE = {
  long:  { b:'b-long',  cls:'up',   key:'long' },
  short: { b:'b-short', cls:'down', key:'short' },
  watch: { b:'b-watch', cls:'flat', key:'watch' }
};

/* ---------------------------- состояние --------------------------------- */
const S = {
  view:'market', prev:'market', coin:null,
  tierFilter:'all', sideFilter:'all', query:'',
  data:{ market:null, coins:null, signals:null, me:null, coin:null },
  loading:false
};

/* ---------------------------- утилиты ----------------------------------- */
const $ = s => document.querySelector(s);
const _e = document.createElement('div');
const esc = s => { _e.textContent = s == null ? '' : String(s); return _e.innerHTML; };
const nf = (v, d) => Number(v).toLocaleString(UI.locale(), { minimumFractionDigits:d, maximumFractionDigits:d });

function price(v){
  if (v == null || !isFinite(v)) return '—';
  const a = Math.abs(v);
  return a >= 1000 ? nf(v,0) : a >= 10 ? nf(v,2) : a >= 1 ? nf(v,3)
       : a >= 0.01 ? nf(v,4) : nf(v,8).replace(/0+$/,'');
}
function pct(v){
  if (v == null || !isFinite(v)) return '—';
  return (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v),2) + '%';
}
function cap(v){
  if (!v) return '—';
  const u = UI.lang === 'ru' ? [' трлн',' млрд',' млн'] : ['T','B','M'];
  if (v >= 1e12) return nf(v/1e12,2) + u[0];
  if (v >= 1e9)  return nf(v/1e9,1)  + u[1];
  if (v >= 1e6)  return nf(v/1e6,0)  + u[2];
  return nf(v,0);
}
const dirClass = v => v > 0 ? 'up' : v < 0 ? 'down' : 'flat';

/* Дата приходит из SQLite в UTC. Человек смотрит на свои часы — без
   перевода колл «в 08:35» приходил бы ему в 11:35, и лента расходилась бы
   с историей его собственного чата. */
function localTime(stamp){
  if (!stamp) return '';
  const d = new Date(String(stamp).replace(' ', 'T') + 'Z');
  if (isNaN(d)) return esc(stamp);
  return d.toLocaleString(UI.locale(), { day:'2-digit', month:'short',
                                     hour:'2-digit', minute:'2-digit' });
}

/* ---------------------------- графики ----------------------------------- */
/* Рисуются по НАСТОЯЩЕМУ недельному ряду цен: он приходит от CoinGecko тем
   же запросом, что и остальное, и не стоит ничего сверх. В прототипе на
   этом месте был генератор псевдослучайных чисел — для дизайна годится,
   для приложения о деньгах нет. */
function polyline(vals, w, h, pad){
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = (max - min) || 1;
  return vals.map((v, i) => {
    const x = pad + i * (w - pad*2) / Math.max(vals.length - 1, 1);
    const y = pad + (h - pad*2) * (1 - (v - min) / span);
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
}

function spark(vals, up){
  if (!vals || vals.length < 2) return '';
  const c = up ? 'var(--green)' : 'var(--red)';
  return `<svg class="spark" width="46" height="26" viewBox="0 0 46 26" fill="none">
    <polyline points="${polyline(vals, 46, 26, 2)}" stroke="${c}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function lineChart(vals, up, h = 150){
  if (!vals || vals.length < 2)
    return `<div class="chart-empty">${UI.t('noSeries')}</div>`;
  const w = 330, c = up ? 'var(--green)' : 'var(--red)';
  const pts = polyline(vals, w, h, 6);
  const first = pts.split(' ')[0].split(',')[0];
  const last = pts.split(' ').slice(-1)[0].split(',')[0];
  return `<svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c}" stop-opacity=".22"/>
      <stop offset="1" stop-color="${c}" stop-opacity="0"/>
    </linearGradient></defs>
    <polygon points="${first},${h} ${pts} ${last},${h}" fill="url(#g)"/>
    <polyline points="${pts}" stroke="${c}" stroke-width="2.4" fill="none"
      stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function ring(v, size = 78, sw = 9, label){
  label = label || UI.t('agreement');
  const r = (size - sw) / 2, len = 2 * Math.PI * r;
  const off = len * (1 - Math.max(0, Math.min(100, v)) / 100);
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--field)" stroke-width="${sw}" fill="none"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--primary)" stroke-width="${sw}"
        fill="none" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${size/2} ${size/2})"/>
    </svg>
    <div class="ring-c"><div class="ring-v">${v}%</div><div class="ring-l">${label}</div></div>
  </div>`;
}

function coinDot(c){
  const letter = (c.s || '?')[0];
  return `<div class="cdot" style="background:var(--primary-soft);color:var(--primary)">${esc(letter)}</div>`;
}

/* ---------------------------- сеть -------------------------------------- */
/* Подпись Telegram уходит заголовком, а не параметром: в адресной строке
   она осела бы в логах прокси и в истории браузера, а это фактически
   пароль на сутки. */
async function api(path){
  if (NO_API) throw new Error('no-api');
  const r = await fetch(API + path, {
    headers: TG && TG.initData ? { 'X-Init-Data': TG.initData } : {}
  });
  if (!r.ok && r.status !== 401) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function load(key, path, force){
  if (S.data[key] && !force) return S.data[key];
  S.data[key] = await api(path);
  return S.data[key];
}

/* ---------------------------- экран: РЫНОК ------------------------------ */
/* Индекс страха и жадности.
   Классификацию берём у источника (он же задаёт пороги), но показываем
   своими словами — иначе при английском интерфейсе половина карточки
   осталась бы русской, а при русском в неё попал бы «Extreme Greed».
   Карточки нет вовсе, если источник молчит: выдуманные 50 «нейтрально»
   неотличимы на экране от настоящих. */
const FNG_KEYS = {
  'Extreme Fear':  { k:'fngExtremeFear',  cls:'down' },
  'Fear':          { k:'fngFear',         cls:'down' },
  'Neutral':       { k:'fngNeutral',      cls:'flat' },
  'Greed':         { k:'fngGreed',        cls:'up'   },
  'Extreme Greed': { k:'fngExtremeGreed', cls:'up'   }
};

function fngCard(f){
  if (!f || f.value == null) return '';
  const meta = FNG_KEYS[f.label] || { k:'fngNeutral', cls:'flat' };
  return `<div class="card">
    <div class="chart-cap" style="margin-bottom:10px">${UI.t('fngTitle')}</div>
    <div style="display:flex;align-items:baseline;gap:10px">
      <div class="gauge-v ${meta.cls}">${f.value}</div>
      <div class="gauge-l ${meta.cls}" style="font-size:18px">${UI.t(meta.k)}</div>
      ${f.prev != null
        ? `<div class="row-s" style="margin-left:auto">${UI.t('fngYesterday')} ${f.prev}</div>`
        : ''}
    </div>
    <div class="fgbar"><i style="left:${Math.max(0, Math.min(100, f.value))}%"></i></div>
    <div class="fglabels">
      <span>${UI.t('fngFear')}</span>
      <span>${UI.t('fngNeutral')}</span>
      <span>${UI.t('fngGreed')}</span>
    </div>
  </div>`;
}

function viewMarket(){
  const m = S.data.market;
  if (!m) return skeleton(UI.t('market'));

  const recent = m.recent.filter(c =>
    S.sideFilter === 'all' || (c.side || 'watch') === S.sideFilter);

  const h24 = (m.horizons && m.horizons['24']) || {};
  const wr = m.winrate || {};
  const minAll = (m.minSample || {}).headline || 100;
  const minTier = (m.minSample || {}).tier || 30;
  const enoughAll = wr.weighted != null && (wr.n || 0) >= minAll;
  const kpis = [
    { v: m.callsPerDay != null ? nf(m.callsPerDay,1) : '—',
      l: UI.t('callsPerDay'), cls:'' },
    // Винрейт, но взвешенный классом риска: считать коллы один к одному
    // значит мерить число нажатий, а не деньги — мемкоинов за месяц
    // вдесятеро больше, чем крупных, и общий процент оказывался бы
    // процентом по мемкоинам.
    //
    // Рядом обязательно рост самого биткоина за тот же период. Без него
    // винрейт нечитаем: на растущем рынке высокий процент даёт слепая
    // покупка чего угодно, и «60%» ничего не сообщает о работе бота. По
    // нему же считается цвет — сравниваем с рынком, а не с абстрактными
    // 50%.
    // ЧИСЛО НЕ ПОКАЗЫВАЕТСЯ, ПОКА ВЫБОРКИ МАЛО. На 74 замерах интервал
    // винрейта ±11 пунктов: «50%» означает «где-то от 39 до 61», то есть
    // неотличимо от монетки. Такое число читается как факт, фактом не
    // являясь, — а на витрине по нему решают, платить или нет.
    // Вместо процента показан прогресс: видно, что счётчик идёт.
    (enoughAll
      ? { v: wr.weighted + '%', l: UI.t('winrate'),
          hint: wr.btcUp != null
            ? UI.t('winrateHint') + ' ' + wr.btcUp + '% · ' + wr.n + ' ' + UI.t('measures')
            : '',
          cls: wr.btcUp == null ? '' : dirClass(wr.weighted - wr.btcUp) }
      : { v: '—', l: UI.t('winrate'),
          hint: UI.t('collecting') + ': ' + (wr.n || 0) + ' / ' + minAll,
          cls: '' }),
    { v: m.passes, l: UI.t('passes'), cls:'' },
    { v: m.downtimeMin ? m.downtimeMin + ' ' + UI.t('min') : UI.t('none'),
      l: UI.t('downtime'), cls: m.downtimeMin ? 'down' : 'up' }
  ];

  return `<div class="view">
    ${pageHead(UI.t('market'), UI.t('marketSub'), true)}

    ${fngCard(m.fng)}

    <div class="grid2" style="margin-top:12px">
      ${kpis.map(k => `<div class="kpi">
        <div class="kpi-v ${k.cls}">${esc(k.v)}</div>
        <div class="kpi-l">${esc(k.l)}</div>
        ${k.hint ? `<div class="kpi-h">${esc(k.hint)}</div>` : ''}
      </div>`).join('')}
    </div>

    <div class="search" style="margin-top:12px" data-go="coins">
      <span style="color:var(--primary);display:flex">${I.search}</span>
      <span>${UI.t('findCoin')}</span>
    </div>

    <div class="sec"><div class="sec-t">${UI.t('tierAccuracy')}</div>
      <div class="sec-s">${UI.t('last30')}</div></div>
    <div class="card">
      ${m.tiers.map((t, i) => `<div class="row" style="cursor:default;${i ? '' : 'padding-top:0'}">
        <div class="cdot" style="background:var(--field);color:var(--muted)">
          ${svg(TIER_ICON[t.tier] || 'dice', 18)}</div>
        <div class="row-main">
          <div class="row-t" style="font-size:15px">${UI.t('tier_' + t.tier)}</div>
          <div class="row-s wrap">${UI.t('risk_' + t.tier)} · ${UI.t('up_' + t.tier)}</div>
        </div>
        <div class="row-right">
          ${t.winrate != null && t.n >= minTier
            ? `<div class="row-v ${dirClass(t.winrate - 50)}">${t.winrate}%</div>
               <div class="row-s">${t.n} ${UI.t('measures')} · ×${nf(t.weight,1)}</div>`
            : `<div class="row-s">${UI.t('collecting')}</div>
               <div class="row-s">${t.n || 0} / ${minTier} · ×${nf(t.weight,1)}</div>`}
        </div>
      </div>`).join('')}
      <div class="note">${esc(UI.t('tierNote'))}</div>
    </div>

    <div class="sec"><div class="sec-t">${UI.t('freshCalls')}</div>
      <div class="sec-link" data-go="signals">${UI.t('all')}</div></div>

    <div class="pills" data-pills="sideFilter">
      ${[['all','tabAll'],['long','long'],['short','short']]
        .map(([k, v]) => `<button class="pill ${S.sideFilter === k ? 'on' : ''}"
          data-v="${k}">${UI.t(v)}</button>`).join('')}
    </div>

    <div class="stack" style="margin-top:12px">
      ${recent.length ? recent.map(callCard).join('') : empty(UI.t('noCalls'))}
    </div>
  </div>`;
}

/* Три горизонта отдельными плитками, а не одно число.
   Свёрнутый до последнего замера колл выглядит одинаково через час и
   через неделю, хотя это утверждения разной силы: часовой замер — почти
   шум, недельный — результат. Незакрытый горизонт помечен «идёт», а не
   прочерком: пусто читается как «нет данных», хотя данные будут. */
const CARD_HORIZONS = [['1', 'h1'], ['24', 'h24'], ['168', 'h168']];

function callCard(c){
  const s = SIDE[c.side] || SIDE.watch;
  const hz = c.horizons || {};
  return `<div class="card" ${c.id ? `data-coin="${esc(c.id)}"` : ''} style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:11px">
      ${coinDot(c)}
      <div style="flex:1;min-width:0">
        <div class="row-t">${esc(c.s)} <span class="badge ${s.b}">${UI.t(s.key)}</span></div>
        <div class="row-s">${c.tierEmoji || ''} ${c.tier ? UI.t('tier_' + c.tier) : ''} · ${localTime(c.at)}</div>
      </div>
      ${c.price != null
        ? `<div style="text-align:right">
             <div class="row-v">${price(c.price)}</div>
             <div class="row-s">${UI.t('entry')}</div>
           </div>`
        : ''}
    </div>
    <div class="grid3" style="margin-top:12px">
      ${CARD_HORIZONS.map(([h, key]) => {
        const o = hz[h] || {};
        const done = o.result != null;
        return `<div class="kpi c" style="background:${
          done ? (o.result >= 0 ? 'var(--green-soft)' : 'var(--red-soft)') : 'var(--field)'}">
          <div class="kpi-l" style="margin:0 0 3px">${UI.t(key)}</div>
          <div class="kpi-v" style="font-size:16px">
            ${done ? `<span class="${dirClass(o.result)}">${pct(o.result)}</span>`
                   : `<span style="color:var(--muted)">${UI.t('running')}</span>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ---------------------------- экран: МОНЕТЫ ----------------------------- */
function viewCoins(){
  const d = S.data.coins;
  if (!d) return skeleton(UI.t('coins'));

  const q = S.query.trim().toLowerCase();
  let list = d.coins.filter(c =>
    (S.tierFilter === 'all' || c.tier === S.tierFilter) &&
    (!q || (c.s || '').toLowerCase().includes(q) || (c.n || '').toLowerCase().includes(q)));

  const tabs = [['all','tabAll'],['major','tabMajor'],['news','tabNews'],
                ['alt','tabAlt'],['meme','tabMeme']];

  return `<div class="view">
    ${pageHead(UI.t('coins'), UI.t('coinsSub'), true, true)}

    <label class="search" style="margin-bottom:10px">
      <span style="color:var(--primary);display:flex">${I.search}</span>
      <input id="q" placeholder="${UI.t('search')}" value="${esc(S.query)}"
        style="border:0;background:transparent;outline:0;font:inherit;color:inherit;width:100%">
    </label>

    <div class="pills" data-pills="tierFilter">
      ${tabs.map(([k,v]) => `<button class="pill ${S.tierFilter===k?'on':''}" data-v="${k}">${UI.t(v)}</button>`).join('')}
    </div>

    <div class="card" style="margin-top:12px;padding:0">
      ${list.length ? list.map(c => `<div class="row" data-coin="${esc(c.id)}">
        ${coinDot(c)}
        <div class="row-main">
          <div class="row-t" style="font-size:15px">${esc(c.s)} <span class="row-s">${esc(c.tierEmoji)}</span></div>
          <div class="row-s">${esc(c.n)} · ${cap(c.cap)}</div>
        </div>
        ${spark(c.spark, (c.ch || 0) >= 0)}
        <div class="row-right">
          <div class="row-v">${price(c.p)}</div>
          <div class="row-s ${dirClass(c.ch)}">${pct(c.ch)}</div>
        </div>
      </div>`).join('') : empty(UI.t('nothingFound'))}
    </div>
  </div>`;
}

/* ---------------------------- экран: РАЗБОР ----------------------------- */
function viewCoin(){
  const c = S.data.coin;
  if (!c) return skeleton(UI.t('analysis'));
  const s = SIDE[c.side] || SIDE.watch;

  return `<div class="view">
    <div class="page-head">
      <button class="icon-btn" data-back>${I.chevL}</button>
      <div style="flex:1">
        <h1 class="h1" style="font-size:24px">${esc(c.s)}</h1>
        <p class="h1-sub">${esc(c.n)}${c.rank ? ' · #' + c.rank : ''}</p>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex:1">
          <div class="gauge-v ${dirClass(c.ch)}" style="font-size:30px">${price(c.p)}</div>
          <div class="row-s ${dirClass(c.ch)}" style="font-size:15px;font-weight:700">${pct(c.ch)}</div>
          <div style="margin-top:10px">
            <span class="badge ${s.b}">${UI.t(s.key)}</span>
            <span class="badge b-watch" style="gap:5px">${
              svg(TIER_ICON[c.tier] || 'dice', 13)} ${UI.t('tier_' + c.tier)}</span>
          </div>
        </div>
        ${ring(c.conf)}
      </div>
      <div class="row-s wrap" style="margin-top:12px">
        ${UI.t('risk_' + c.tier)} · ${UI.t('up_' + c.tier)}
      </div>
      ${c.isLottery ? `<div class="warn">${UI.t('lotteryWarning')}</div>` : ''}
    </div>

    ${c.levels ? levelsCard(c) : ''}

    <div class="sec"><div class="sec-t">${UI.t('whyScore')}</div>
      <div class="sec-s">${UI.t('weight')}</div></div>
    <div class="card" style="padding:0">
      ${c.factors.map(f => `<div class="row" style="cursor:default">
        <div class="cdot" style="background:var(--field);color:var(--muted)">
          ${svg(FACTOR_ICON[f.key] || 'pulse', 18)}</div>
        <div class="row-main">
          <div class="row-t" style="font-size:15px">${esc(f.t)}</div>
          <div class="row-s">${esc(f.d)}</div>
        </div>
        <div class="row-right">
          <div class="row-v ${f.k}">${f.v > 0 ? '+' : ''}${nf(f.v,2)}</div>
          <div class="row-s">${f.w}%</div>
        </div>
      </div>`).join('')}
    </div>

    ${c.news && c.news.length ? `
      <div class="sec"><div class="sec-t">${c.news.some(n => n.isEvent) ? UI.t('news') : UI.t('newsEcho')}</div></div>
      <div class="card" style="padding:0">
        ${c.news.map(n => `<div class="row" style="cursor:default">
          <div class="row-main"><div class="row-s" style="color:var(--text);font-weight:600">${esc(n.text)}</div>
          <div class="row-s">${esc(n.source)}</div></div>
        </div>`).join('')}
      </div>` : ''}
  </div>`;
}

function levelsCard(c){
  const L = c.levels, up = c.side !== 'short';
  // Иконка на строку: вход, две цели и стоп различаются с одного
  // взгляда, а не вчитыванием подписей.
  const rows = [
    [UI.t('entry'),   L.entry,   '',     'login'],
    [UI.t('target1'), L.target1, 'up',   'target'],
    [UI.t('target2'), L.target2, 'up',   'target'],
    [UI.t('stop'),    L.stop,    'down', 'octagon']
  ];
  return `<div class="sec"><div class="sec-t">${UI.t('levels')}</div>
      <div class="sec-s">${L.rr ? UI.t('rr') + ' ' + nf(L.rr,2) + ':1' : ''}</div></div>
    <div class="card" style="padding:0">
      ${rows.map(([t, v, k, ic]) => `<div class="row" style="cursor:default">
        <div class="cdot" style="background:var(--field);color:var(--muted)">
          ${svg(ic, 18)}</div>
        <div class="row-main"><div class="row-t" style="font-size:15px">${t}</div></div>
        <div class="row-right"><div class="row-v ${k}">${price(v)}</div></div>
      </div>`).join('')}
      <div class="note">${UI.t('levelsNote')}</div>
    </div>`;
}

/* ---------------------------- экран: СИГНАЛЫ ---------------------------- */
function viewSignals(){
  const d = S.data.signals;
  if (!d) return skeleton(UI.t('calls'));

  return `<div class="view">
    ${pageHead(UI.t('calls'), d.full ? UI.t('callsAll') : UI.t('callsSettled'), true, true)}

    ${d.full ? '' : `<div class="card lock">
      <div class="row-t" style="font-size:16px">${UI.t('onlySettled')}</div>
      <div class="row-s wrap" style="margin-top:6px">${UI.t('onlySettledWhy')}</div>
    </div>`}

    <div class="stack" style="margin-top:12px">
      ${d.calls.length ? d.calls.map(callCard).join('') : empty(UI.t('empty'))}
    </div>
  </div>`;
}

/* ---------------------------- экран: ПРОФИЛЬ ---------------------------- */
function viewMe(){
  const me = S.data.me;
  if (!me) return skeleton(UI.t('profile'));

  if (!me.authorized) return `<div class="view">
    ${pageHead(UI.t('profile'), UI.t('outsideTg'), false)}
    <div class="card">
      <div class="row-t" style="font-size:16px">${UI.t('whoAreYou')}</div>
      <div class="row-s wrap" style="margin-top:6px">${UI.t('whoAreYouWhy')}</div>
    </div>
  </div>`;

  const st = me.settings || {};
  // Значки те же, что и везде в приложении. Раньше тут стояли эмодзи —
  // единственное цветное пятно среди линейных иконок.
  const toggles = [
    ['calls_major','major'], ['calls_news','news'],
    ['calls_alt','alt'], ['calls_meme','meme']
  ];
  const favs = me.favorites || [];

  // Сколько дней человек с ботом. Считаем от first_seen, а не от даты
  // подписки: интересно знакомство, а не покупка.
  let days = null;
  if (me.since) {
    const d = new Date(String(me.since).replace(' ', 'T') + 'Z');
    if (!isNaN(d)) days = Math.max(1, Math.round((Date.now() - d) / 86400000));
  }

  const tiles = [
    { v: me.queries || 0, l: UI.t('myQueries') },
    { v: favs.length,     l: UI.t('myFavCount') },
    { v: me.alerts || 0,  l: UI.t('myAlerts') },
    { v: days == null ? '—' : days, l: UI.t('myDays') }
  ];

  return `<div class="view">
    ${pageHead(esc(me.name || UI.t('profile')), me.subscribed ? UI.t('subActive') : UI.t('subNone'), false)}

    <div class="card">
      <div class="row" style="cursor:default;padding-top:0">
        <div class="cdot" style="background:var(--field);color:var(--muted)">
          ${svg(me.subscribed ? 'gem' : 'target', 18)}</div>
        <div class="row-main"><div class="row-t" style="font-size:15px">${UI.t('subscription')}</div></div>
        <div class="row-right"><div class="row-v ${me.subscribed ? 'up' : ''}">
          ${me.subscribed ? UI.t('active') : UI.t('none')}</div>
          ${me.expires ? `<div class="row-s">${UI.t('until')} ${esc(String(me.expires).slice(0,10))}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="grid4" style="margin-top:12px">
      ${tiles.map(t => `<div class="kpi c">
        <div class="kpi-v">${esc(t.v)}</div>
        <div class="kpi-l">${esc(t.l)}</div>
      </div>`).join('')}
    </div>

    <div class="sec"><div class="sec-t">${UI.t('myFavorites')}</div>
      ${favs.length ? `<div class="sec-s">${favs.length}</div>` : ''}</div>
    <div class="card" style="padding:0">
      ${favs.length ? favs.map(f => `<div class="row" ${
          f.id ? `data-coin="${esc(f.id)}"` : 'style="cursor:default"'}>
        ${coinDot(f)}
        <div class="row-main">
          <div class="row-t" style="font-size:15px">${esc(f.s)}</div>
          <div class="row-s">${esc(f.n || '')}</div>
        </div>
        <div class="row-right">
          ${f.p != null
            ? `<div class="row-v">${price(f.p)}</div>
               <div class="row-s ${dirClass(f.ch)}">${pct(f.ch)}</div>`
            : `<div class="row-s">${UI.t('noData')}</div>`}
        </div>
        ${f.id ? `<div class="chev">${svg('chevR', 18)}</div>` : ''}
      </div>`).join('')
      : `<div class="note" style="border:0">${UI.t('noFavorites')}</div>`}
    </div>

    <div class="sec"><div class="sec-t">${UI.t('whichCalls')}</div></div>
    <div class="card" style="padding:0">
      ${toggles.map(([k, tier]) => `<div class="row" style="cursor:default">
        <div class="cdot" style="background:var(--field);color:var(--muted)">
          ${svg(TIER_ICON[tier], 18)}</div>
        <div class="row-main">
          <div class="row-t" style="font-size:15px">${UI.t('tier_' + tier)}</div>
          <div class="row-s">${UI.t('risk_' + tier)}</div>
        </div>
        <div class="row-right"><div class="row-v ${st[k] ? 'up' : ''}">
          ${st[k] ? UI.t('on') : UI.t('off')}</div></div>
      </div>`).join('')}
      <div class="note">${UI.t('togglesWhy')}</div>
    </div>
  </div>`;
}

/* ---------------------------- каркас ------------------------------------ */
/* back — вернуться на «Рынок». Именно data-go, а не data-back: data-back
   ведёт на S.prev, а для вкладки это она сама (go() пишет туда каждый
   не-coin экран), то есть стрелка не делала бы ничего. */
function pageHead(title, sub, refresh, back){
  return `<div class="page-head">
    ${back ? `<button class="icon-btn" data-go="market"
                style="margin-top:6px">${I.chevL}</button>` : ''}
    <div style="flex:1;min-width:0"><h1 class="h1">${esc(title)}</h1><p class="h1-sub">${esc(sub)}</p></div>
    <div class="head-actions">
      <button class="icon-btn lang" data-lang>${UI.lang}</button>
      <button class="icon-btn" data-theme-btn>${UI.theme === 'dark' ? I.sun : I.moon}</button>
      ${refresh ? `<button class="icon-btn" data-refresh>${I.refresh}</button>` : ''}
    </div>
  </div>`;
}
const empty = t => `<div class="card" style="text-align:center;color:var(--muted);font-weight:600">${esc(t)}</div>`;
function skeleton(title){
  return `<div class="view">${pageHead(title, UI.t('loading'), false)}
    ${[0,1,2].map(() => '<div class="card skel"></div>').join('')}</div>`;
}

const VIEWS = { market:viewMarket, coins:viewCoins, signals:viewSignals,
                me:viewMe, coin:viewCoin };
const TABS = [
  ['market','market',  I.grid],
  ['coins', 'coins',   I.coins],
  ['signals','calls',  I.bell],
  ['me',    'profile', I.user]
];

function render(){
  $('#screen').innerHTML = (VIEWS[S.view] || viewMarket)();
  $('#tabbar').innerHTML = TABS.map(([k, label, icon]) =>
    `<button class="tab ${S.view === k ? 'on' : ''}" data-tab="${k}">
       ${icon}<span>${UI.t(label)}</span></button>`).join('');
  $('#screen').scrollTop = 0;

  // Системная кнопка «назад» вместо своей: на экране разбора она уже есть
  // в шапке, но человек жмёт привычную — ту, что рисует Telegram.
  if (TG && TG.BackButton) {
    if (S.view === 'coin') TG.BackButton.show(); else TG.BackButton.hide();
  }
}

function toast(msg){
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2200);
}

function haptic(kind){
  try { TG.HapticFeedback.impactOccurred(kind || 'light'); } catch (e) {}
}

/* ---------------------------- загрузка данных --------------------------- */
async function go(view, opts){
  opts = opts || {};
  if (view !== 'coin') S.prev = view;
  S.view = view;
  render();
  try {
    if (view === 'market')  await load('market', '/api/market', opts.force);
    if (view === 'coins')   await load('coins', '/api/coins', opts.force);
    if (view === 'signals') await load('signals', '/api/signals', opts.force);
    if (view === 'me')      await load('me', '/api/me', opts.force);
    if (view === 'coin') {
      S.data.coin = null; render();
      S.data.coin = await api('/api/coin/' + encodeURIComponent(S.coin));
      if (S.data.coin && S.data.coin.error) { S.data.coin = null; toast(UI.t('errCoin')); }
    }
  } catch (err) {
    // Разные беды — разные слова. «Бот выключен» на закладке без адреса
    // отправило бы человека чинить то, что не сломано.
    toast(err && err.message === 'no-api'
      ? UI.t('errNoApi') : UI.t('errData'));
  }
  render();
}

/* ---------------------------- события ----------------------------------- */
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { haptic(); return go(tab.dataset.tab); }

  const back = e.target.closest('[data-back]');
  if (back) { haptic(); return go(S.prev); }

  const coin = e.target.closest('[data-coin]');
  if (coin) { haptic(); S.coin = coin.dataset.coin; return go('coin'); }

  const goto = e.target.closest('[data-go]');
  if (goto) { haptic(); return go(goto.dataset.go); }

  const pill = e.target.closest('.pill[data-v]');
  if (pill) {
    const group = pill.closest('[data-pills]').dataset.pills;
    S[group] = pill.dataset.v; haptic(); return render();
  }

  const lang = e.target.closest('[data-lang]');
  if (lang) {
    haptic();
    UI.toggleLang();
    // Перерисовываем текущий экран, а не перезагружаем данные: язык живёт
    // в интерфейсе, а цифры от него не зависят.
    render();
    return toast(UI.t('langSwitched'));
  }

  const theme = e.target.closest('[data-theme-btn]');
  if (theme) { haptic(); const label = UI.cycleTheme(); render(); return toast(label); }

  if (e.target.closest('[data-refresh]')) {
    haptic('medium'); toast(UI.t('refreshing'));
    return go(S.view, { force:true });
  }
});

document.addEventListener('input', e => {
  if (e.target.id === 'q') {
    S.query = e.target.value;
    // Перерисовываем только список, иначе поле теряет фокус и каретку
    // после каждой буквы.
    const card = document.querySelector('.view .card');
    render();
    const q = document.getElementById('q');
    if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
});

/* ---------------------------- запуск ------------------------------------ */
/* Темой и языком заведует ui.js — он подключён раньше и красит документ до
   первой отрисовки, иначе человек с тёмной темой увидел бы вспышку
   светлого экрана. */
if (TG) {
  TG.ready();
  TG.expand();
  if (TG.BackButton) TG.BackButton.onClick(() => go(S.prev));
}

go('market');
