require('dotenv').config();
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ─── USO ──────────────────────────────────────────────────────────────────────
// node scripts/generate-cupfever.js          → gera 1000 perguntas
// node scripts/generate-cupfever.js 500      → gera 500 perguntas
// node scripts/generate-cupfever.js 200 true → gera 200 e já insere no banco

const TOTAL      = parseInt(process.argv[2]) || 1000;
const AUTO_SEED  = process.argv[3] === 'true';
const GAME_ID    = 'cupfever';
const BATCH_SIZE = 25;
const OUTPUT_JSON = path.join(__dirname, `cupfever-questions-${Date.now()}.json`);
const OUTPUT_SEED = path.join(__dirname, `seed-cupfever-generated-${Date.now()}.js`);
const API_KEY    = process.env.ANTHROPIC_API_KEY || '';

if (!API_KEY) {
  console.error('\n❌ ANTHROPIC_API_KEY não definida no .env\n');
  process.exit(1);
}

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    cat: 'Copa 2026',
    topics: 'formato 48 seleções, sedes EUA/Canadá/México, 16 cidades, grupos definidos, Brasil no Grupo C, final no MetLife Stadium em Nova York, abertura no Azteca, novidades do torneio, classificação das confederações, estreantes Cabo Verde/Curaçao/Jordânia/Uzbequistão'
  },
  {
    cat: 'História Geral',
    topics: 'primeira Copa de 1930 no Uruguai, evolução do formato, Copas de 1934 a 2022, países sede, campeões, contexto histórico de cada edição, curiosidades de bastidores'
  },
  {
    cat: 'Brasil nas Copas',
    topics: 'cinco títulos (1958/62/70/94/02), Maracanazo 1950, geração de Pelé, tetracampeonato 1994, pentacampeonato 2002, eliminação 7x1 em 2014, Copa 2018 e 2022, artilheiros brasileiros, técnicos históricos'
  },
  {
    cat: 'Artilheiros e Gols',
    topics: 'Miroslav Klose recordista com 16 gols, Just Fontaine 13 gols em 1958, Ronaldo 15 gols, gols históricos, hat-tricks em finais, artilheiros por edição, gols mais rápidos, golaços memoráveis'
  },
  {
    cat: 'Lendas do Futebol',
    topics: 'Pelé três títulos, Maradona mão de Deus e gol do século, Zidane cabeçada na final 2006, Ronaldo Fenômeno 2002, Messi campeão em 2022, Garrincha, Eusébio, Cruyff, Beckenbauer, Johan Neeskens'
  },
  {
    cat: 'Recordes e Curiosidades',
    topics: 'maior goleada da história Hungria 10x1 El Salvador, maior público Maracanã 1950 com 173 mil, único jogador expulso em final Zidane, seleções mais participantes, Copas com mais gols, jogadores em mais Copas, goleiros históricos'
  },
  {
    cat: 'Finais Históricas',
    topics: 'final de 1950 Uruguai x Brasil, 1954 Alemanha x Hungria, 1966 Inglaterra x Alemanha, 1970 Brasil x Itália, 1982 Itália x Alemanha, 1986 Argentina x Alemanha, 1994 Brasil x Itália nos pênaltis, 1998 França x Brasil, 2006 Itália x França, 2014 Alemanha x Argentina, 2022 Argentina x França'
  },
  {
    cat: 'Zebras e Surpresas',
    topics: 'Coreia do Sul semifinalista em 2002, Camarões ganhando da Argentina em 1990, EUA eliminando Inglaterra em 1950, Irlanda do Norte em 1958, Argélia surpreendendo em 1982, Gana nas quartas em 2010, Marrocos semifinalista em 2022, Croácia finalista em 2018'
  },
  {
    cat: 'Estádios e Sedes',
    topics: 'Maracanã no Rio, Azteca no México único a sediar duas finais, Wembley 1966, Estádio Olímpico em Berlim 2006, Lusail Stadium no Catar 2022, estádios da Copa 2026, sedes mais marcantes da história'
  },
  {
    cat: 'Seleções Europeias',
    topics: 'Alemanha e Itália tetracampeãs, França bicampeã, Espanha campeã em 2010, Inglaterra campeã em 1966, Holanda três finais sem título, Portugal com Eusébio e Cristiano Ronaldo, Iugoslávia e gerações perdidas'
  },
  {
    cat: 'Seleções Sul-Americanas',
    topics: 'Brasil pentacampeão, Argentina bicampeã com Maradona e Messi, Uruguai bicampeão, Chile semifinalista, Peru e Colômbia em Copas memoráveis, geração de ouro do Paraguai, Ecuador e sua história nas eliminatórias'
  },
  {
    cat: 'África e Ásia nas Copas',
    topics: 'Marrocos primeiro africano semifinalista em 2022, Coreia do Sul semifinalista em 2002, Camarões com Roger Milla, Senegal em 2002, Japão e sua evolução, Austrália semifinalista em 2006, Nigéria nos anos 90, Gana em 2010'
  },
];

// ─── API ANTHROPIC ────────────────────────────────────────────────────────────
function callAnthropic(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(data);
          if (p.error) return reject(new Error(p.error.message));
          resolve(p);
        } catch { reject(new Error('Resposta inválida da API')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// ─── GERA UM LOTE ─────────────────────────────────────────────────────────────
async function generateBatch(cat, count, existingInCat) {
  const diff = count <= 8 ? 'Fácil' : count <= 16 ? 'Médio' : 'Misto (fácil, médio e difícil)';
  const existingSample = existingInCat.slice(-8).map(q => `- ${q.q}`).join('\n');

  const prompt = `Você é especialista em história do futebol e Copas do Mundo. Crie perguntas de quiz em português brasileiro.

Categoria: ${cat.cat}
Tópicos sugeridos: ${cat.topics}
Dificuldade: ${diff}

${existingSample ? `NÃO repita estas perguntas já existentes:\n${existingSample}\n` : ''}

Gere EXATAMENTE ${count} perguntas únicas, variadas e factualmente corretas sobre Copas do Mundo.

Regras obrigatórias:
- 4 opções por pergunta (A, B, C, D) — apenas 1 correta
- Opções erradas devem ser plausíveis mas claramente incorretas para quem conhece o assunto
- Perguntas variadas: quem, onde, quando, quantos, qual, por que, em que Copa
- Linguagem clara em português brasileiro
- Sem repetições entre si
- Inclua perguntas sobre a Copa 2026 quando a categoria permitir

Responda APENAS com JSON válido (sem markdown):
[{"q":"pergunta","o":["A","B","C","D"],"c":0,"cat":"${cat.cat}","difficulty":"easy"}]

"c" é o índice 0-3 da resposta correta.
"difficulty" deve ser "easy", "medium" ou "hard".`;

  const res  = await callAnthropic(prompt);
  const text = res.content[0].text.trim();
  const s = text.indexOf('[');
  const e = text.lastIndexOf(']') + 1;
  if (s === -1) throw new Error('JSON não encontrado');
  const parsed = JSON.parse(text.slice(s, e));
  return parsed.filter(q =>
    q.q && q.o?.length === 4 &&
    typeof q.c === 'number' && q.c >= 0 && q.c <= 3 &&
    ['easy','medium','hard'].includes(q.difficulty)
  );
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏆 Quiz Cup Fever — Gerador de Perguntas');
  console.log('═'.repeat(50));
  console.log(`📊 Meta: ${TOTAL} perguntas | Lotes de ${BATCH_SIZE}`);
  console.log(`📚 Categorias: ${CATEGORIES.length}`);
  if (AUTO_SEED) console.log('💾 Auto-seed ativado — inserirá no banco ao finalizar');
  console.log('═'.repeat(50) + '\n');

  const allQuestions = [];
  let totalErrors = 0;
  let batchCount  = 0;

  // Distribui perguntas proporcionalmente entre categorias
  const perCat = Math.ceil(TOTAL / CATEGORIES.length);
  const batches = [];
  for (const cat of CATEGORIES) {
    // Divide a categoria em lotes de BATCH_SIZE
    let remaining = perCat;
    while (remaining > 0) {
      batches.push({ cat, count: Math.min(remaining, BATCH_SIZE) });
      remaining -= BATCH_SIZE;
    }
  }

  // Ajusta para não ultrapassar o total
  let planned = batches.reduce((s,b) => s+b.count, 0);
  let idx = batches.length - 1;
  while (planned > TOTAL && idx >= 0) {
    const remove = Math.min(batches[idx].count, planned - TOTAL);
    batches[idx].count -= remove;
    planned -= remove;
    if (batches[idx].count <= 0) batches.splice(idx, 1);
    idx--;
  }

  console.log(`📦 ${batches.length} lotes planejados\n`);

  for (const batch of batches) {
    if (batch.count <= 0) continue;
    const pct   = Math.round(allQuestions.length / TOTAL * 100);
    const label = `${batch.cat.cat} (${batch.count} perguntas)`;
    process.stdout.write(`[${String(allQuestions.length).padStart(4)}/${TOTAL}] ${pct.toString().padStart(3)}% → ${label}...`);

    try {
      const existing = allQuestions.filter(q => q.cat === batch.cat.cat);
      const newQs    = await generateBatch(batch.cat, batch.count, existing);
      allQuestions.push(...newQs);
      batchCount++;
      console.log(` ✅ +${newQs.length}`);

      // Salva progresso a cada 5 lotes
      if (batchCount % 5 === 0) {
        fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allQuestions, null, 2));
        process.stdout.write(`    💾 ${allQuestions.length} perguntas salvas\n`);
      }
    } catch(e) {
      totalErrors++;
      console.log(` ❌ ${e.message}`);
    }

    await sleep(1200);
  }

  // ── SALVA RESULTADO ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`✅ Geração concluída!`);
  console.log(`   Perguntas geradas: ${allQuestions.length}`);
  console.log(`   Erros: ${totalErrors}`);

  // JSON de backup
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allQuestions, null, 2));
  console.log(`\n📄 JSON salvo: ${path.basename(OUTPUT_JSON)}`);

  // Seed script
  const items = allQuestions.map(q =>
    `  {q:${JSON.stringify(q.q)},o:${JSON.stringify(q.o)},c:${q.c},cat:${JSON.stringify(q.cat)},difficulty:${JSON.stringify(q.difficulty)},gameId:"${GAME_ID}",testament:"none",active:true}`
  ).join(',\n');

  const seedContent = `require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../src/models/Question');

// ${allQuestions.length} perguntas geradas por IA — Quiz Cup Fever
const questions = [\n${items}\n];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB Atlas');
    let inserted = 0;
    const chunk = 50;
    for (let i = 0; i < questions.length; i += chunk) {
      try {
        const r = await Question.insertMany(questions.slice(i, i+chunk), { ordered: false });
        inserted += r.length;
      } catch(e) { if(e.insertedDocs) inserted += e.insertedDocs.length; }
      process.stdout.write(\`\\r   Inseridas: \${inserted}/\${questions.length}\`);
    }
    console.log(\`\\n✅ \${inserted} perguntas inseridas no Quiz Cup Fever!\`);
    await mongoose.disconnect();
    process.exit(0);
  } catch(err) { console.error('❌', err.message); process.exit(1); }
}
seed();
`;
  fs.writeFileSync(OUTPUT_SEED, seedContent);
  console.log(`📄 Seed salvo: ${path.basename(OUTPUT_SEED)}`);

  // Estatísticas
  console.log('\n📊 Distribuição por categoria:');
  const catCount = {};
  allQuestions.forEach(q => { catCount[q.cat] = (catCount[q.cat]||0)+1; });
  Object.entries(catCount).sort((a,b)=>b[1]-a[1]).forEach(([cat,n]) => {
    const bar = '█'.repeat(Math.round(n/5));
    console.log(`   ${cat.padEnd(28)} ${String(n).padStart(3)}  ${bar}`);
  });

  console.log('\n📊 Por dificuldade:');
  const diffs = {easy:0,medium:0,hard:0};
  allQuestions.forEach(q => diffs[q.difficulty]++);
  console.log(`   🟢 Fácil:   ${diffs.easy}`);
  console.log(`   🟡 Médio:   ${diffs.medium}`);
  console.log(`   🔴 Difícil: ${diffs.hard}`);

  // Auto-seed
  if (AUTO_SEED && allQuestions.length > 0) {
    console.log('\n💾 Inserindo no banco...');
    const mongoose = require('mongoose');
    const Question = require('../src/models/Question');
    await mongoose.connect(process.env.MONGODB_URI);
    let inserted = 0;
    const qs = allQuestions.map(q => ({...q, gameId: GAME_ID, testament: 'none', active: true}));
    for (let i = 0; i < qs.length; i += 50) {
      try {
        const r = await Question.insertMany(qs.slice(i, i+50), { ordered: false });
        inserted += r.length;
      } catch(e) { if(e.insertedDocs) inserted += e.insertedDocs.length; }
      process.stdout.write(`\r   Inseridas: ${inserted}/${qs.length}`);
    }
    await mongoose.disconnect();
    console.log(`\n✅ ${inserted} perguntas inseridas!`);
  } else if (allQuestions.length > 0) {
    console.log(`\n🔄 Para inserir no banco execute:`);
    console.log(`   node ${path.basename(OUTPUT_SEED)}\n`);
  }
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  process.exit(1);
});
