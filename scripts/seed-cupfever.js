require('dotenv').config();
const mongoose = require('mongoose');
const Game     = require('../src/models/Game');
const Question = require('../src/models/Question');

// ─── CADASTRO DO JOGO ─────────────────────────────────────────────────────────
const GAME = {
  slug:        'cupfever',
  name:        'Quiz Cup Fever',
  description: 'Tudo sobre Copas do Mundo! História, recordes, curiosidades e as últimas novidades da Copa 2026 nos EUA, Canadá e México.',
  icon:        '🏆',
  color:       '#f5a623',
  colorDark:   '#fffbe6',
  status:      'live',
  url:         '',
  adminUrl:    '',
  order:       2,
  config: {
    defaultCount:  10,
    defaultTime:   30,
    difficulties:  ['easy', 'medium', 'hard'],
    modes:         ['mixed'],
    hasRanking:    true,
    hasOffline:    true,
    hasRefs:       false,
    rankingWeights:    { accuracy: 0.7, volume: 0.2, frequency: 0.1 },
    difficultyWeights: { easy: 1, medium: 2, hard: 3 },
  },
};

// ─── PERGUNTAS ────────────────────────────────────────────────────────────────
const QUESTIONS = [

  // ── COPA 2026 — NOVIDADES ─────────────────────────────────────────────────
  {q:"Quantas seleções vão disputar a Copa do Mundo de 2026?",o:["32","40","48","64"],c:2,cat:"Copa 2026",difficulty:"easy"},
  {q:"Quais são os três países que sediam a Copa do Mundo de 2026?",o:["EUA, Brasil e México","EUA, Canadá e México","Canadá, México e Argentina","EUA, Canadá e Brasil"],c:1,cat:"Copa 2026",difficulty:"easy"},
  {q:"Em qual cidade e estádio acontece o jogo de abertura da Copa 2026?",o:["Nova York, MetLife Stadium","Los Angeles, SoFi Stadium","Cidade do México, Estádio Azteca","Toronto, BMO Field"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Onde será disputada a final da Copa do Mundo de 2026?",o:["Los Angeles","Miami","Dallas","Nova York/Nova Jersey"],c:3,cat:"Copa 2026",difficulty:"medium"},
  {q:"Quantas cidades-sede a Copa do Mundo de 2026 terá ao todo?",o:["12","14","16","18"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Qual é a data de início da Copa do Mundo de 2026?",o:["1 de junho","11 de junho","15 de junho","22 de junho"],c:1,cat:"Copa 2026",difficulty:"easy"},
  {q:"Quantos jogos terá a Copa do Mundo de 2026 no total?",o:["64","80","96","104"],c:3,cat:"Copa 2026",difficulty:"hard"},
  {q:"Qual novidade de formato estreia na Copa 2026?",o:["Pênaltis eliminados","Fase de dezesseis avos de final","Tempo de jogo de 50 minutos","VAR obrigatório em todas as partidas"],c:1,cat:"Copa 2026",difficulty:"medium"},
  {q:"Em qual grupo o Brasil está na Copa 2026?",o:["Grupo A","Grupo B","Grupo C","Grupo D"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Qual é o primeiro adversário do Brasil na Copa 2026?",o:["Haiti","Escócia","Marrocos","Argentina"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Quem é o técnico do Brasil para a Copa 2026?",o:["Tite","Fernando Diniz","Carlo Ancelotti","Pep Guardiola"],c:2,cat:"Copa 2026",difficulty:"easy"},
  {q:"Qual seleção é a atual campeã do mundo e defende o título na Copa 2026?",o:["França","Brasil","Argentina","Espanha"],c:2,cat:"Copa 2026",difficulty:"easy"},
  {q:"Em qual grupo está a Argentina na Copa 2026?",o:["Grupo H","Grupo I","Grupo J","Grupo K"],c:2,cat:"Copa 2026",difficulty:"hard"},
  {q:"Quais seleções fazem parte do chamado 'grupo da morte' na Copa 2026?",o:["Brasil, Argentina, Alemanha e França","França, Noruega, Senegal e Iraque","Espanha, Inglaterra, Portugal e Itália","EUA, México, Canadá e Japão"],c:1,cat:"Copa 2026",difficulty:"hard"},
  {q:"Qual é o único país da Oceania classificado para a Copa 2026?",o:["Austrália","Samoa","Fiji","Nova Zelândia"],c:3,cat:"Copa 2026",difficulty:"medium"},
  {q:"Quais países estreiam em Copas do Mundo em 2026?",o:["Cabo Verde, Curaçao, Jordânia e Uzbequistão","Namíbia, Kosovo, Gibraltar e Malta","Macedônia, Montenegro, Kosovo e Ilhas Faroe","San Marino, Andorra, Liechtenstein e Gibraltar"],c:0,cat:"Copa 2026",difficulty:"hard"},
  {q:"Quantas seleções da América do Sul se classificaram diretamente para a Copa 2026?",o:["4","5","6","7"],c:2,cat:"Copa 2026",difficulty:"hard"},
  {q:"Onde será o jogo pelo terceiro lugar da Copa 2026?",o:["Los Angeles","Dallas","Houston","Miami"],c:3,cat:"Copa 2026",difficulty:"hard"},
  {q:"Qual país africano volta à Copa 2026 após 52 anos de ausência?",o:["Angola","Haiti","RD Congo","Camarões"],c:2,cat:"Copa 2026",difficulty:"hard"},
  {q:"Em qual grupo estão Portugal e Cristiano Ronaldo na Copa 2026?",o:["Grupo I","Grupo J","Grupo K","Grupo L"],c:2,cat:"Copa 2026",difficulty:"medium"},

  // ── HISTÓRIA DAS COPAS ────────────────────────────────────────────────────
  {q:"Qual país é o maior vencedor de Copas do Mundo?",o:["Alemanha","Argentina","Itália","Brasil"],c:3,cat:"História",difficulty:"easy"},
  {q:"Quantas Copas do Mundo o Brasil conquistou?",o:["4","5","6","7"],c:1,cat:"História",difficulty:"easy"},
  {q:"Em que ano foi disputada a primeira Copa do Mundo?",o:["1926","1928","1930","1934"],c:2,cat:"História",difficulty:"easy"},
  {q:"Qual país sediou a primeira Copa do Mundo?",o:["Brasil","Argentina","Uruguai","Itália"],c:2,cat:"História",difficulty:"easy"},
  {q:"Quem ganhou a primeira Copa do Mundo da história?",o:["Brasil","Argentina","Uruguai","Itália"],c:2,cat:"História",difficulty:"medium"},
  {q:"Em que ano o Brasil conquistou seu primeiro título mundial?",o:["1950","1954","1958","1962"],c:2,cat:"História",difficulty:"easy"},
  {q:"Qual foi a Copa do Mundo disputada no Brasil em 1950?",o:["A quarta edição","A terceira edição","A segunda edição","A quinta edição"],c:0,cat:"História",difficulty:"hard"},
  {q:"Em que ano ocorreu o famoso 'Maracanazo'?",o:["1946","1950","1954","1958"],c:1,cat:"História",difficulty:"medium"},
  {q:"O que foi o 'Maracanazo'?",o:["Brasil 7x1 Alemanha","Derrota do Brasil para o Uruguai na final de 1950","Derrota do Brasil para a Argentina","Brasil eliminado nas quartas de final"],c:1,cat:"História",difficulty:"medium"},
  {q:"Qual país europeu venceu as Copas de 1934 e 1938?",o:["Alemanha","França","Itália","Hungria"],c:2,cat:"História",difficulty:"medium"},
  {q:"Em qual Copa o Brasil conquistou o tetracampeonato?",o:["França 1998","Alemanha 2006","EUA 1994","Coreia/Japão 2002"],c:2,cat:"História",difficulty:"easy"},
  {q:"Onde o Brasil conquistou seu pentacampeonato?",o:["França 1998","Coreia/Japão 2002","EUA 1994","Alemanha 2006"],c:1,cat:"História",difficulty:"easy"},
  {q:"Qual país sediou a Copa de 1970, vencida pelo Brasil?",o:["Brasil","Argentina","México","Espanha"],c:2,cat:"História",difficulty:"easy"},
  {q:"Em que Copa o Brasil ganhou com a famosa geração de Pelé, Tostão e Rivelino?",o:["Chile 1962","México 1970","Alemanha 1974","Argentina 1978"],c:1,cat:"História",difficulty:"medium"},
  {q:"Qual foi a maior goleada da história das Copas do Mundo?",o:["Brasil 8x0 Bolívia","Alemanha 8x0 Arábia Saudita","Hungria 10x1 El Salvador","Hungria 9x0 Coreia do Sul"],c:2,cat:"História",difficulty:"hard"},
  {q:"Qual Copa ficou conhecida pela geração de ouro da Holanda com Cruyff?",o:["1966","1970","1974","1978"],c:2,cat:"História",difficulty:"hard"},
  {q:"Quantas seleções disputaram as primeiras edições da Copa do Mundo (1930)?",o:["13","16","24","32"],c:0,cat:"História",difficulty:"hard"},
  {q:"Em qual Copa do Mundo a Alemanha venceu o Brasil por 7x1?",o:["África do Sul 2010","Brasil 2014","Rússia 2018","Catar 2022"],c:1,cat:"História",difficulty:"easy"},
  {q:"Qual Copa do Mundo foi a primeira a ter o VAR (árbitro de vídeo)?",o:["Brasil 2014","Rússia 2018","Catar 2022","França 1998"],c:1,cat:"História",difficulty:"medium"},
  {q:"Qual país venceu a Copa de 2018 na Rússia?",o:["Croácia","Argentina","França","Bélgica"],c:2,cat:"História",difficulty:"easy"},

  // ── RECORDES E CURIOSIDADES ───────────────────────────────────────────────
  {q:"Quem é o maior artilheiro da história das Copas do Mundo?",o:["Pelé","Ronaldo Nazário","Miroslav Klose","Gerd Müller"],c:2,cat:"Recordes",difficulty:"medium"},
  {q:"Quantos gols Miroslav Klose marcou em Copas do Mundo?",o:["14","15","16","17"],c:2,cat:"Recordes",difficulty:"hard"},
  {q:"Quem marcou mais gols em uma única Copa do Mundo?",o:["Pelé em 1958","Just Fontaine em 1958","Gerd Müller em 1970","Ronaldo em 2002"],c:1,cat:"Recordes",difficulty:"hard"},
  {q:"Quantos gols Just Fontaine marcou na Copa de 1958?",o:["11","12","13","15"],c:2,cat:"Recordes",difficulty:"hard"},
  {q:"Qual foi o único jogador a ser expulso em uma final de Copa do Mundo?",o:["Zinedine Zidane","Ronaldo","Ronaldinho","Maradona"],c:0,cat:"Recordes",difficulty:"medium"},
  {q:"Em qual Copa Zidane deu a famosa cabeçada em Materazzi?",o:["França 1998","Japão/Coreia 2002","Alemanha 2006","África do Sul 2010"],c:2,cat:"Recordes",difficulty:"easy"},
  {q:"Qual goleiro ficou famoso por pegar três pênaltis numa semifinal de Copa?",o:["Taffarel","Buffon","Neuer","Seaman"],c:0,cat:"Recordes",difficulty:"medium"},
  {q:"Qual time venceu as Copas de 2010 e 2022?",o:["Alemanha","França","Espanha","Argentina"],c:2,cat:"Recordes",difficulty:"medium"},
  {q:"Qual jogador venceu mais Copas do Mundo como jogador?",o:["Pelé","Ronaldo","Zidane","Cafu"],c:0,cat:"Recordes",difficulty:"medium"},
  {q:"Quantas Copas Pelé venceu?",o:["1","2","3","4"],c:2,cat:"Recordes",difficulty:"easy"},
  {q:"Qual é o jogo com mais gols da história das Copas?",o:["Brasil 5x2 Suécia","Áustria 7x5 Suíça em 1954","França 6x5 Argentina","Alemanha 7x1 Brasil"],c:1,cat:"Recordes",difficulty:"hard"},
  {q:"Quem foi o primeiro jogador a marcar em 4 Copas do Mundo diferentes?",o:["Pelé","Cristiano Ronaldo","Messi","Miroslav Klose"],c:1,cat:"Recordes",difficulty:"hard"},
  {q:"Qual é o recorde de público em um jogo de Copa do Mundo?",o:["173.850 — Brasil x Uruguai 1950","100.000 — Wembley 1966","120.000 — México 1986","95.000 — Alemanha 2006"],c:0,cat:"Recordes",difficulty:"hard"},
  {q:"Qual seleção detém o recorde de mais participações em Copas?",o:["Itália","Alemanha","Brasil","Argentina"],c:2,cat:"Recordes",difficulty:"medium"},
  {q:"Qual Copa foi a primeira transmitida ao vivo pela televisão?",o:["Brasil 1950","Suíça 1954","Suécia 1958","Chile 1962"],c:1,cat:"Recordes",difficulty:"hard"},
  {q:"Ronaldo Nazário marcou quantos gols ao todo em Copas?",o:["12","13","14","15"],c:3,cat:"Recordes",difficulty:"hard"},
  {q:"Qual país venceu mais seguido a Copa do Mundo? (bicampeão consecutivo)",o:["Brasil","Itália","Alemanha","Argentina"],c:1,cat:"Recordes",difficulty:"hard"},
  {q:"Qual Copa foi disputada pela primeira vez em dois países?",o:["Alemanha/Áustria 1934","Japão/Coreia 2002","Canadá/EUA/México 1994","Bélgica/Holanda 2000"],c:1,cat:"Recordes",difficulty:"medium"},
  {q:"Qual continente nunca sediou uma Copa do Mundo?",o:["África","Oceania","Ásia","América do Norte"],c:1,cat:"Recordes",difficulty:"medium"},
  {q:"Quem foi eleito o melhor jogador da Copa de 2022?",o:["Mbappé","Modric","Benzema","Messi"],c:3,cat:"Recordes",difficulty:"easy"},

  // ── ESTÁDIOS E SEDES ──────────────────────────────────────────────────────
  {q:"Qual estádio ficou famoso como cenário do 'Maracanazo' de 1950?",o:["Estádio Mineirão","Estádio do Maracanã","Estádio Azteca","Estádio de Wembley"],c:1,cat:"Estádios",difficulty:"easy"},
  {q:"Em qual país fica o Estádio Azteca, que sediou duas finais de Copa?",o:["EUA","Argentina","México","Brasil"],c:2,cat:"Estádios",difficulty:"easy"},
  {q:"Qual foi o estádio da final da Copa de 2022?",o:["Estádio Al-Bayt","Lusail Stadium","Estádio Al Janoub","Estádio Khalifa"],c:1,cat:"Estádios",difficulty:"medium"},
  {q:"Em qual cidade do Brasil ocorreu o '7x1' na Copa de 2014?",o:["Rio de Janeiro","São Paulo","Fortaleza","Belo Horizonte"],c:3,cat:"Estádios",difficulty:"easy"},
  {q:"Qual é o estádio com maior capacidade a sediar jogos na Copa 2026 nos EUA?",o:["SoFi Stadium","MetLife Stadium","AT&T Stadium","Rose Bowl"],c:1,cat:"Estádios",difficulty:"hard"},
  {q:"Quantas cidades dos EUA sediarão jogos na Copa 2026?",o:["8","9","10","11"],c:3,cat:"Estádios",difficulty:"hard"},
  {q:"Qual cidade canadense sediará jogos na Copa 2026?",o:["Montreal e Quebec","Toronto e Vancouver","Calgary e Ottawa","Vancouver e Montreal"],c:1,cat:"Estádios",difficulty:"medium"},
  {q:"Qual das cidades mexicanas NÃO sediará jogos na Copa 2026?",o:["Cidade do México","Guadalajara","Monterrey","Cancún"],c:3,cat:"Estádios",difficulty:"medium"},

  // ── JOGADORES LENDÁRIOS ───────────────────────────────────────────────────
  {q:"Em qual Copa Pelé marcou seu primeiro gol — com apenas 17 anos?",o:["Argentina 1954","Suíça 1954","Suécia 1958","Chile 1962"],c:2,cat:"Lendas",difficulty:"easy"},
  {q:"Diego Maradona marcou o gol mais famoso da história, chamado de:",o:["Gol do século","Mão de Deus","Gol de placa","Golaço divino"],c:0,cat:"Lendas",difficulty:"easy"},
  {q:"Em qual Copa Ronaldo Nazário foi artilheiro com 8 gols e campeão?",o:["EUA 1994","França 1998","Japão/Coreia 2002","Alemanha 2006"],c:2,cat:"Lendas",difficulty:"easy"},
  {q:"Qual craque francês marcou dois gols na final da Copa de 1998 para a França?",o:["Thierry Henry","David Trezeguet","Zinedine Zidane","Patrick Vieira"],c:2,cat:"Lendas",difficulty:"medium"},
  {q:"Com quantos anos Pelé se tornou campeão mundial pela primeira vez?",o:["16","17","18","19"],c:1,cat:"Lendas",difficulty:"medium"},
  {q:"Qual craque argentino foi eleito melhor jogador nas Copas de 2014 e 2022?",o:["Maradona","Caniggia","Batistuta","Messi"],c:3,cat:"Lendas",difficulty:"easy"},
  {q:"Qual era a famosa camisa de Garrincha que encantou o mundo na Copa de 1958?",o:["Camisa 7","Camisa 10","Camisa 11","Camisa 9"],c:2,cat:"Lendas",difficulty:"hard"},
  {q:"Eusébio, a grande estrela da Copa de 1966, jogava por qual seleção?",o:["Brasil","Espanha","Portugal","Angola"],c:2,cat:"Lendas",difficulty:"medium"},
  {q:"Qual lenda do futebol ficou conhecida como 'O Rei' e deu nome ao estádio nacional do Brasil?",o:["Garrincha","Romário","Ronaldo","Pelé"],c:3,cat:"Lendas",difficulty:"easy"},
  {q:"Ronaldinho Gaúcho venceu a Copa do Mundo em qual ano?",o:["1994","1998","2002","2006"],c:2,cat:"Lendas",difficulty:"easy"},

  // ── BRASIL NAS COPAS ──────────────────────────────────────────────────────
  {q:"Em qual Copa o Brasil foi eliminado pela primeira vez nas quartas de final?",o:["1954","1962","1966","1974"],c:2,cat:"Brasil",difficulty:"hard"},
  {q:"Qual técnico comandou o Brasil no pentacampeonato de 2002?",o:["Zagallo","Telê Santana","Luiz Felipe Scolari","Parreira"],c:2,cat:"Brasil",difficulty:"medium"},
  {q:"Qual foi o único ano em que o Brasil foi eliminado na fase de grupos de uma Copa?",o:["1930","1934","1966","1974"],c:1,cat:"Brasil",difficulty:"hard"},
  {q:"Romário marcou quantos gols na Copa de 1994?",o:["3","4","5","6"],c:2,cat:"Brasil",difficulty:"hard"},
  {q:"Qual foi o resultado da final da Copa de 1994 entre Brasil e Itália?",o:["Brasil 3x2 Itália","Brasil 1x0 Itália","0x0, com Brasil vencendo nos pênaltis","Brasil 2x1 Itália"],c:2,cat:"Brasil",difficulty:"medium"},
  {q:"Quem perdeu o pênalti decisivo pela Itália na final de 1994?",o:["Maldini","Baggio","Baresi","Albertini"],c:1,cat:"Brasil",difficulty:"medium"},
  {q:"Qual jogador marcou o gol do pentacampeonato do Brasil em 2002?",o:["Ronaldo","Ronaldinho","Rivaldo","Cafu"],c:0,cat:"Brasil",difficulty:"easy"},
  {q:"Contra qual seleção o Brasil foi derrotado por 7x1 na Copa de 2014?",o:["Argentina","Espanha","Alemanha","Holanda"],c:2,cat:"Brasil",difficulty:"easy"},
  {q:"Neymar participou de quantas Copas do Mundo?",o:["2","3","4","5"],c:1,cat:"Brasil",difficulty:"easy"},
  {q:"Em que posição o Brasil terminou a Copa de 2022 no Catar?",o:["Semifinal","Quartas de final","Oitavas de final","Fase de grupos"],c:1,cat:"Brasil",difficulty:"easy"},
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB Atlas\n');

    // Cadastra ou atualiza o jogo
    const existingGame = await Game.findOne({ slug: GAME.slug });
    if (existingGame) {
      await Game.updateOne({ slug: GAME.slug }, GAME);
      console.log(`🔄 Jogo atualizado: ${GAME.name}`);
    } else {
      await Game.create(GAME);
      console.log(`✅ Jogo criado: ${GAME.name}`);
    }

    // Remove perguntas antigas do jogo (para re-seed limpo)
    const deleted = await Question.deleteMany({ gameId: GAME.slug });
    if (deleted.deletedCount > 0) {
      console.log(`🗑  ${deleted.deletedCount} perguntas antigas removidas`);
    }

    // Insere perguntas com gameId
    const qs = QUESTIONS.map(q => ({ ...q, gameId: GAME.slug, testament: 'none', active: true }));
    const inserted = await Question.insertMany(qs, { ordered: false });

    console.log(`\n✅ ${inserted.length} perguntas inseridas!`);
    console.log('\n📊 Distribuição por categoria:');

    const cats = {};
    qs.forEach(q => { cats[q.cat] = (cats[q.cat]||0)+1; });
    Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([cat,n]) => {
      console.log(`   ${cat.padEnd(25)} ${n} perguntas`);
    });

    console.log('\n📊 Distribuição por dificuldade:');
    const diffs = { easy:0, medium:0, hard:0 };
    qs.forEach(q => diffs[q.difficulty]++);
    console.log(`   🟢 Fácil:   ${diffs.easy}`);
    console.log(`   🟡 Médio:   ${diffs.medium}`);
    console.log(`   🔴 Difícil: ${diffs.hard}`);

    console.log(`\n🏆 Quiz Cup Fever pronto no banco "quizzygamez"!\n`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

seed();
