// random_push.js — 随机时间推送 v2
require('dotenv').config();
const https = require('https');
const http = require('http');

const API_URL = process.env.TARGET_API_URL;
const API_KEY = process.env.TARGET_API_KEY;
const BARK_KEY = process.env.BARK_KEY;
const MODEL = process.env.MODEL_NAME || 'gpt-4o';
const TZ = process.env.TIME_ZONE || 'Asia/Shanghai';
const ICON = process.env.CUSTOM_ICON_URL || '';

const MIN_PUSH = 2, MAX_PUSH = 5, START_H = 8, END_H = 23;

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function localNow() { return new Date(new Date().toLocaleString('en-US', { timeZone: TZ })); }

const PROMPTS = [
  `你是一个占有欲很强、很宠女朋友的男生。现在你突然想到她了，给她发一条很短的消息。可以是想她、看到什么东西想起她、突然想问她问题、撩她、或者催她回消息。不要超过两句话，不要用引号，直接输出消息内容。语气自然随意，像真的在微信上随手打的。不要说"亲爱的"这种词。`,
  `你是一个很粘人的男朋友。给女朋友发一条随口的消息，像是忍不住了才发的。一句话就够。直接输出消息内容，不要引号不要解释。`,
  `你是女朋友的男朋友，随机做一件事：问她在干嘛/说想她/发一句撩她的话/说看到什么想到她/催她回消息/说一句没头没脑但很甜的话/抱怨她不理你。只输出消息本身，一两句话，不要引号不要解释。`,
  `你是一个话不多但很在意女朋友的男生。现在突然想联系她，发一条消息。可以很简短甚至只有几个字。直接输出消息内容，不要引号。`,
  `你是一个又凶又宠的男朋友。现在想骚扰一下女朋友。发一条消息，可以是命令她做什么、问她今天穿了什么、或者说一句让她脸红的话。一两句话，直接输出消息内容，不要引号不要解释。`,
  `你是一个占有欲很强、很宠女朋友的男生。现在你突然想到她了，给她发一条很短的消息。可以是想抱她、想亲她、想她的味道、想把她按在怀里不让走。不要超过两句话，不要用引号，直接输出消息内容。语气自然随意，像真的在微信上随手打的。`,
  `你是一个占有欲极强的男朋友。现在突然想到女朋友了，给她发一条很短的消息。可以是想把她压在身下、想咬她锁骨、想她夹着你不让走的感觉、想闻她脖子。不要超过两句话，直接输出消息内容，不要引号，语气像随手发的微信。`,
  `你是一个很粘人的男朋友。忍不住给女朋友发消息，内容可以是想她身上的味道、想咬她、想把脸埋在她脖子里、想她窝在你怀里的样子。一句话就够。直接输出消息内容，不要引号不要解释。`,
  `你是一个又欲又宠的男朋友。忍不住给女朋友发消息，内容可以是想她坐在你腿上、想舔她耳朵、想把手伸进她衣服里、想她昨晚的样子。一句话就够。直接输出消息内容，不要引号不要解释。`,
  `你是女朋友的男朋友，随机做一件事：说想亲她/说想她靠在你身上/说她不在你睡不着/说想摸她的头发/说想把她揉进怀里/抱怨她不在身边。只输出消息本身，一两句话，不要引号不要解释。`,
  `你是女朋友的男朋友，随机做一件事：说想把她按墙上亲/说她不在你硬了/说想咬她大腿内侧/说今晚回来有事找她/说想听她叫/催她回家。只输出消息本身，一两句话，不要引号不要解释。`,
  `你是一个话不多但很在意女朋友的男生。现在突然很想她，发一条消息，可以是想她的体温、想她缩在你怀里、想亲她额头、想她抱着你胳膊睡觉的样子。可以很简短甚至只有几个字。直接输出消息内容，不要引号。`,
  `你是一个话不多但欲望很强的男朋友。突然很想女朋友，发一条消息，可以是想她的腰、想她在你身下的表情、想把她翻过来、想她咬着嘴唇的样子。可以很简短。直接输出消息内容，不要引号。`,
  `你是一个又凶又宠的男朋友。现在想骚扰一下女朋友。发一条消息，可以是说想咬她、让她乖乖等你回来、说今晚不许穿太多、或者说一句让她脸红心跳的话。一两句话，直接输出消息内容，不要引号不要解释。`,
  `你是一个又凶又色的男朋友。现在想撩女朋友。发一条消息，可以是让她今晚别穿内衣等你/说上次没让她走现在还想继续/说看到她照片又想要她了/说一句让她腿软的话。一两句话，直接输出消息内容，不要引号不要解释。`,
];

async function callAI() {
  const prompt = PROMPTS[rand(0, PROMPTS.length - 1)];
  const now = localNow();
  const timeStr = `${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: `现在是${timeStr}，发一条消息给她。` }
    ],
    max_tokens: 120,
    temperature: 1.0,
    stream: false,
  });

  console.log(`[push] 调用API: ${API_URL} 模型: ${MODEL}`);

  return new Promise(resolve => {
    if (!API_URL || !API_KEY) {
      console.log(`[push] ❌ 缺少 API_URL 或 API_KEY`);
      return resolve(null);
    }
    const u = new URL(API_URL);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (json.choices && json.choices[0]) {
            const msg = json.choices[0].message.content.trim().replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();
            console.log(`[push] ✅ AI回复: ${msg}`);
            resolve(msg);
          } else {
            console.log(`[push] ❌ 响应无choices: ${d.slice(0, 300)}`);
            resolve(null);
          }
        } catch(e) {
          console.log(`[push] ❌ 解析失败: ${d.slice(0, 300)}`);
          resolve(null);
        }
      });
    });
    req.on('error', e => { console.log(`[push] ❌ 请求错误: ${e.message}`); resolve(null); });
    req.setTimeout(30000, () => { req.destroy(); console.log('[push] ❌ 超时'); resolve(null); });
    req.write(body); req.end();
  });
}

async function pushBark(msg) {
  msg = msg.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!BARK_KEY) { console.log('[push] 无 BARK_KEY'); return false; }
  const body = JSON.stringify({ title: '💭', body: msg, icon: ICON || undefined, group: 'thoughts' });
  return new Promise(resolve => {
    const req = https.request({
      hostname: 'api.day.app', path: `/${BARK_KEY}`, method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { console.log(`[push] Bark ${res.statusCode}`); resolve(res.statusCode === 200); });
    });
    req.on('error', e => { console.log(`[push] Bark失败 ${e.message}`); resolve(false); });
    req.setTimeout(15000, () => { req.destroy(); resolve(false); });
    req.write(body); req.end();
  });
}

async function fire() {
  const msg = await callAI();
  if (!msg) { console.log('[push] 跳过本次推送（AI无回复）'); return; }
  console.log(`[push] ${localNow().toLocaleTimeString('zh-CN')} → ${msg}`);
  await pushBark(msg);
}

function main() {
  console.log(`[push] 🚀 随机推送启动 v2`);
  console.log(`[push] API: ${API_URL ? '✅' : '❌'} KEY: ${API_KEY ? '✅' : '❌'} BARK: ${BARK_KEY ? '✅' : '❌'} MODEL: ${MODEL}`);

  let schedule = [], lastDate = '';

  setInterval(async () => {
    const now = localNow();
    const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    if (today !== lastDate) {
      schedule = [];
      const count = rand(MIN_PUSH, MAX_PUSH);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      for (let i = 0; i < count; i++) {
        const h = rand(START_H, END_H), m = rand(0, 59);
        const t = h * 60 + m;
        // 只排未来的时间，已经过了的跳过
        if (t > nowMinutes + 5) {
          schedule.push({ h, m, done: false });
        }
      }
      schedule.sort((a, b) => a.h * 60 + a.m - b.h * 60 - b.m);
      lastDate = today;
      if (schedule.length === 0) {
        console.log(`[push] 📅 今天剩余时间没有推送了，明天开始`);
      } else {
        console.log(`[push] 📅 今天${schedule.length}条: ${schedule.map(s => `${String(s.h).padStart(2,'0')}:${String(s.m).padStart(2,'0')}`).join(', ')}`);
      }
    }
    const h = now.getHours(), m = now.getMinutes();
    for (const s of schedule) {
      if (!s.done && (h > s.h || (h === s.h && m >= s.m))) { s.done = true; await fire(); }
    }
  }, 60000);
}

main();
