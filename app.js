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
  refresh:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-.7 4.3"/><path d="M20 4v6h-6"/></svg>'
};

const SIDE = {
  long:  { b:'b-long',  cls:'up',   label:'Лонг' },
  short: { b:'b-short', cls:'down', label:'Шорт' },
  watch: { b:'b-watch', cls:'flat', label:'Ждём' }
};

/* ---------------------------- состояние --------------------------------- */
const S = {
  view:'market', prev:'market', coin:null,
  tierFilter:'all', query:'',
  data:{ market:null, coins:null, signals:null, me:null, coin:null },
  loading:false
};

/* ---------------------------- утилиты ----------------------------------- */
const $ = s => document.querySelector(s);
const _e = document.createElement('div');
const esc = s => { _e.textContent = s == null ? '' : String(s); return _e.innerHTML; };
const nf = (v, d) => Number(v).toLocaleString('ru-RU', { minimumFractionDigits:d, maximumFractionDigits:d });

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
  if (v >= 1e12) return nf(v/1e12,2) + ' трлн';
  if (v >= 1e9)  return nf(v/1e9,1)  + ' млрд';
  if (v >= 1e6)  return nf(v/1e6,0)  + ' млн';
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
  return d.toLocaleString('ru-RU', { day:'2-digit', month:'short',
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
  return `<svg class="spark" width="64" height="26" viewBox="0 0 64 26" fill="none">
    <polyline points="${polyline(vals, 64, 26, 2)}" stroke="${c}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function lineChart(vals, up, h = 150){
  if (!vals || vals.length < 2)
    return `<div class="chart-empty">Ряд цен недоступен</div>`;
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

function ring(v, size = 78, sw = 9, label = 'согласие'){
  const r = (size - sw) / 2, len = 2 * Math.PI * r;
  const off = len * (1 - Math.max(0, Math.min(100, v)) / 100);
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--field)" stroke-width="${sw}" fill="none"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" stroke="var(--primary)" stroke-width="${sw}"
        fill="none" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${off}"
        transform="rotate(-90 ${size/2} ${size/2})"/>
    </svg>
    <div class="ring-c"><b>${v}%</b><span>${label}</span></div>
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
function viewMarket(){
  const m = S.data.market;
  if (!m) return skeleton('Рынок');

  const h24 = (m.horizons && m.horizons['24']) || {};
  const kpis = [
    { v: m.callsPerDay != null ? nf(m.callsPerDay,1) : '—',
      l: 'Коллов в сутки', cls:'' },
    { v: h24.beat != null ? h24.beat + '%' : '—',
      l: 'Обогнали BTC · сутки', cls: h24.beat == null ? '' : dirClass(h24.beat - 50) },
    { v: m.passes, l: 'Проходов за 24ч', cls:'' },
    { v: m.downtimeMin ? m.downtimeMin + ' мин' : 'нет',
      l: 'Простой', cls: m.downtimeMin ? 'down' : 'up' }
  ];

  return `<div class="view">
    ${pageHead('Рынок', 'Что сканер видит прямо сейчас', true)}

    <div class="grid2">
      ${kpis.map(k => `<div class="kpi">
        <div class="kpi-v ${k.cls}">${esc(k.v)}</div>
        <div class="kpi-l">${esc(k.l)}</div>
      </div>`).join('')}
    </div>

    <div class="search" style="margin-top:12px" data-go="coins">
      <span style="color:var(--primary);display:flex">${I.search}</span>
      <span>Найти монету и разобрать</span>
    </div>

    <div class="sec"><div class="sec-t">Точность по классам риска</div>
      <div class="sec-s">за 30 дней</div></div>
    <div class="card">
      ${m.tiers.map((t, i) => `<div class="row" style="cursor:default;${i ? '' : 'padding-top:0'}">
        <div class="cdot" style="background:var(--field)">${t.emoji}</div>
        <div class="row-main">
          <div class="row-t" style="font-size:15px">${esc(t.label)}</div>
          <div class="row-s">${esc(t.risk)} · ${esc(t.upside)}</div>
        </div>
        <div class="row-right">
          ${t.n ? `<div class="row-v ${dirClass(t.beat - 50)}">${t.beat}%</div>
                   <div class="row-s">${t.n} замеров</div>`
                : `<div class="row-s">данных нет</div>`}
        </div>
      </div>`).join('')}
    </div>

    <div class="sec"><div class="sec-t">Свежие коллы</div>
      <div class="sec-link" data-go="signals">все</div></div>
    <div class="stack">
      ${m.recent.length ? m.recent.map(callCard).join('') : empty('Коллов пока не было')}
    </div>
  </div>`;
}

function callCard(c){
  const s = SIDE[c.side] || SIDE.watch;
  const done = c.result != null;
  return `<div class="card" ${c.id ? `data-coin="${esc(c.id)}"` : ''} style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:11px">
      ${coinDot(c)}
      <div style="flex:1;min-width:0">
        <div class="row-t">${esc(c.s)} <span class="badge ${s.b}">${s.label}</span></div>
        <div class="row-s">${c.tierEmoji || ''} ${esc(c.tierLabel || '')} · ${localTime(c.at)}</div>
      </div>
      <div style="text-align:right">
        ${done
          ? `<div class="row-v ${dirClass(c.result)}">${pct(c.result)}</div>
             <div class="row-s">за ${c.horizon}ч</div>`
          : `<div class="row-s">идёт</div>`}
      </div>
    </div>
  </div>`;
}

/* ---------------------------- экран: МОНЕТЫ ----------------------------- */
function viewCoins(){
  const d = S.data.coins;
  if (!d) return skeleton('Монеты');

  const q = S.query.trim().toLowerCase();
  let list = d.coins.filter(c =>
    (S.tierFilter === 'all' || c.tier === S.tierFilter) &&
    (!q || (c.s || '').toLowerCase().includes(q) || (c.n || '').toLowerCase().includes(q)));

  const tabs = [['all','Все'],['major','Крупные'],['news','Новостные'],
                ['alt','Альткоины'],['meme','Мемкоины']];

  return `<div class="view">
    ${pageHead('Монеты', 'Вселенная сканера — топ-100 и мемкоины', true)}

    <label class="search" style="margin-bottom:10px">
      <span style="color:var(--primary);display:flex">${I.search}</span>
      <input id="q" placeholder="Тикер или название" value="${esc(S.query)}"
        style="border:0;background:transparent;outline:0;font:inherit;color:inherit;width:100%">
    </label>

    <div class="pills" data-pills="tierFilter">
      ${tabs.map(([k,v]) => `<button class="pill ${S.tierFilter===k?'on':''}" data-v="${k}">${v}</button>`).join('')}
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
      </div>`).join('') : empty('Ничего не нашлось')}
    </div>
  </div>`;
}

/* ---------------------------- экран: РАЗБОР ----------------------------- */
function viewCoin(){
  const c = S.data.coin;
  if (!c) return skeleton('Разбор');
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
          <div class="row-s ${dirClass(c.ch)}" style="font-size:15px;font-weight:700">${pct(c.ch)} за сутки</div>
          <div style="margin-top:10px">
            <span class="badge ${s.b}">${s.label}</span>
            <span class="badge b-watch">${c.tierEmoji} ${esc(c.tierLabel)}</span>
          </div>
        </div>
        ${ring(c.conf)}
      </div>
      <div class="row-s" style="margin-top:12px">
        ${esc(c.risk)} · ${esc(c.upside)}
      </div>
      ${c.lotteryWarning ? `<div class="warn">${esc(c.lotteryWarning)}</div>` : ''}
    </div>

    ${c.levels ? levelsCard(c) : ''}

    <div class="sec"><div class="sec-t">Из чего сложилась оценка</div>
      <div class="sec-s">вес компонента</div></div>
    <div class="card" style="padding:0">
      ${c.factors.map(f => `<div class="row" style="cursor:default">
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
      <div class="sec"><div class="sec-t">${c.news.some(n => n.isEvent) ? 'Новости' : 'Пишут о самом движении'}</div></div>
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
  const rows = [
    ['Вход',        L.entry,   ''],
    ['Цель 1',      L.target1, up ? 'up' : 'up'],
    ['Цель 2',      L.target2, 'up'],
    ['Стоп',        L.stop,    'down']
  ];
  return `<div class="sec"><div class="sec-t">Вход, цели и стоп</div>
      <div class="sec-s">${L.rr ? 'прибыль к риску ' + nf(L.rr,2) + ':1' : ''}</div></div>
    <div class="card" style="padding:0">
      ${rows.map(([t, v, k]) => `<div class="row" style="cursor:default">
        <div class="row-main"><div class="row-t" style="font-size:15px">${t}</div></div>
        <div class="row-right"><div class="row-v ${k}">${price(v)}</div></div>
      </div>`).join('')}
      <div class="note">${(c.levelsNote || []).map(esc).join(' ')}</div>
    </div>`;
}

/* ---------------------------- экран: СИГНАЛЫ ---------------------------- */
function viewSignals(){
  const d = S.data.signals;
  if (!d) return skeleton('Сигналы');

  return `<div class="view">
    ${pageHead('Коллы', d.full ? 'Все сигналы и их исходы'
                               : 'Отработавшие сигналы', true)}

    ${d.full ? '' : `<div class="card lock">
      <div class="row-t" style="font-size:16px">Показаны только отработавшие</div>
      <div class="row-s" style="margin-top:6px">Здесь коллы, у которых закрылись
        все горизонты — им не меньше недели, торговой ценности в них уже нет.
        Свежие сигналы приходят подписчикам в момент выхода.</div>
    </div>`}

    <div class="stack" style="margin-top:12px">
      ${d.calls.length ? d.calls.map(callCard).join('') : empty('Пока пусто')}
    </div>
  </div>`;
}

/* ---------------------------- экран: ПРОФИЛЬ ---------------------------- */
function viewMe(){
  const me = S.data.me;
  if (!me) return skeleton('Профиль');

  if (!me.authorized) return `<div class="view">
    ${pageHead('Профиль', 'Открыто вне Telegram', false)}
    <div class="card">
      <div class="row-t" style="font-size:16px">Кто вы — неизвестно</div>
      <div class="row-s" style="margin-top:6px">Личность подтверждается подписью
        Telegram, а её выдаёт только сам мессенджер. Откройте приложение
        кнопкой в боте, и профиль появится.</div>
    </div>
  </div>`;

  const st = me.settings || {};
  const toggles = [
    ['calls_major','💎 Крупные'], ['calls_news','📣 Новостные'],
    ['calls_alt','🥈 Альткоины'], ['calls_meme','🎰 Мемкоины']
  ];

  return `<div class="view">
    ${pageHead(esc(me.name || 'Профиль'), me.subscribed ? 'Подписка активна'
                                                        : 'Без подписки', false)}
    <div class="card">
      <div class="row" style="cursor:default;padding-top:0">
        <div class="row-main"><div class="row-t" style="font-size:15px">Подписка</div></div>
        <div class="row-right"><div class="row-v ${me.subscribed ? 'up' : ''}">
          ${me.subscribed ? 'активна' : 'нет'}</div>
          ${me.expires ? `<div class="row-s">до ${esc(String(me.expires).slice(0,10))}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="sec"><div class="sec-t">Какие коллы приходят</div></div>
    <div class="card" style="padding:0">
      ${toggles.map(([k, label]) => `<div class="row" style="cursor:default">
        <div class="row-main"><div class="row-t" style="font-size:15px">${label}</div></div>
        <div class="row-right"><div class="row-v ${st[k] ? 'up' : ''}">
          ${st[k] ? 'вкл' : 'выкл'}</div></div>
      </div>`).join('')}
      <div class="note">Переключаются в боте: «Настройки» → «Какие коллы присылать».
        Здесь они показаны, но не меняются — чтобы не было двух мест, где
        одно и то же настраивается по-разному.</div>
    </div>
  </div>`;
}

/* ---------------------------- каркас ------------------------------------ */
function pageHead(title, sub, refresh){
  return `<div class="page-head">
    <div><h1 class="h1">${esc(title)}</h1><p class="h1-sub">${esc(sub)}</p></div>
    ${refresh ? `<div class="head-actions">
      <button class="icon-btn" data-refresh>${I.refresh}</button></div>` : ''}
  </div>`;
}
const empty = t => `<div class="card" style="text-align:center;color:var(--muted);font-weight:600">${esc(t)}</div>`;
function skeleton(title){
  return `<div class="view">${pageHead(title, 'Загружаю…', false)}
    ${[0,1,2].map(() => '<div class="card skel"></div>').join('')}</div>`;
}

const VIEWS = { market:viewMarket, coins:viewCoins, signals:viewSignals,
                me:viewMe, coin:viewCoin };
const TABS = [
  ['market','Рынок',   I.grid],
  ['coins', 'Монеты',  I.coins],
  ['signals','Коллы',  I.bell],
  ['me',    'Профиль', I.user]
];

function render(){
  $('#screen').innerHTML = (VIEWS[S.view] || viewMarket)();
  $('#tabbar').innerHTML = TABS.map(([k, label, icon]) =>
    `<button class="tab ${S.view === k ? 'on' : ''}" data-tab="${k}">
       ${icon}<span>${label}</span></button>`).join('');
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
      if (S.data.coin && S.data.coin.error) { S.data.coin = null; toast('Монету разобрать не вышло'); }
    }
  } catch (err) {
    // Разные беды — разные слова. «Бот выключен» на закладке без адреса
    // отправило бы человека чинить то, что не сломано.
    toast(err && err.message === 'no-api'
      ? 'Откройте приложение кнопкой в боте — по ссылке адрес данных не передаётся.'
      : 'Данные недоступны: бот выключен или туннель перезапустился.');
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

  if (e.target.closest('[data-refresh]')) {
    haptic('medium'); toast('Обновляю…');
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
function applyTheme(){
  // Тема берётся у Telegram, но только фон и текст: перекрашивать акцент
  // и карточки под чужую палитру значит потерять дизайн, ради которого
  // всё и делалось. Меняется подложка, чтобы приложение не выглядело
  // белым пятном в тёмном мессенджере.
  if (!TG || !TG.themeParams) return;
  const p = TG.themeParams;
  if (p.bg_color) document.documentElement.style.setProperty('--bg', p.bg_color);
  if (p.secondary_bg_color) document.documentElement.style.setProperty('--bg-deep', p.secondary_bg_color);
}

if (TG) {
  TG.ready();
  TG.expand();
  applyTheme();
  TG.onEvent('themeChanged', applyTheme);
  if (TG.BackButton) TG.BackButton.onClick(() => go(S.prev));
}

go('market');
