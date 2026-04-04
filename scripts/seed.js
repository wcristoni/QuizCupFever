require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('../src/models/Question');

const QUESTIONS = [
  // Copa 2026
  {q:"Quantas seleções vão disputar a Copa do Mundo de 2026?",o:["32","40","48","64"],c:2,cat:"Copa 2026",difficulty:"easy"},
  {q:"Quais são os três países que sediam a Copa do Mundo de 2026?",o:["EUA, Brasil e México","EUA, Canadá e México","Canadá, México e Argentina","EUA, Canadá e Brasil"],c:1,cat:"Copa 2026",difficulty:"easy"},
  {q:"Em qual cidade e estádio acontece o jogo de abertura da Copa 2026?",o:["Nova York, MetLife Stadium","Los Angeles, SoFi Stadium","Cidade do México, Estádio Azteca","Toronto, BMO Field"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Onde será disputada a final da Copa do Mundo de 2026?",o:["Los Angeles","Miami","Dallas","Nova York/Nova Jersey"],c:3,cat:"Copa 2026",difficulty:"medium"},
  {q:"Em qual grupo o Brasil está na Copa 2026?",o:["Grupo A","Grupo B","Grupo C","Grupo D"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Qual é o primeiro adversário do Brasil na Copa 2026?",o:["Haiti","Escócia","Marrocos","Argentina"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Quem é o técnico do Brasil para a Copa 2026?",o:["Tite","Fernando Diniz","Carlo Ancelotti","Pep Guardiola"],c:2,cat:"Copa 2026",difficulty:"easy"},
  {q:"Quantos jogos terá a Copa do Mundo de 2026 no total?",o:["64","80","96","104"],c:3,cat:"Copa 2026",difficulty:"hard"},
  {q:"Qual novidade de formato estreia na Copa 2026?",o:["Pênaltis eliminados","Fase de dezesseis avos de final","Tempo de jogo de 50 minutos","VAR obrigatório"],c:1,cat:"Copa 2026",difficulty:"medium"},
  {q:"Qual seleção é a atual campeã do mundo?",o:["França","Brasil","Argentina","Espanha"],c:2,cat:"Copa 2026",difficulty:"easy"},
  {q:"Quantas cidades-sede a Copa do Mundo de 2026 terá?",o:["12","14","16","18"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Qual é a data de início da Copa do Mundo de 2026?",o:["1 de junho","11 de junho","15 de junho","22 de junho"],c:1,cat:"Copa 2026",difficulty:"easy"},
  {q:"Em qual grupo estão Portugal e Cristiano Ronaldo na Copa 2026?",o:["Grupo I","Grupo J","Grupo K","Grupo L"],c:2,cat:"Copa 2026",difficulty:"medium"},
  {q:"Qual país africano volta à Copa 2026 após 52 anos de ausência?",o:["Angola","Haiti","RD Congo","Camarões"],c:2,cat:"Copa 2026",difficulty:"hard"},
  {q:"Onde será o jogo pelo terceiro lugar da Copa 2026?",o:["Los Angeles","Dallas","Houston","Miami"],c:3,cat:"Copa 2026",difficulty:"hard"},

  // História Geral
  {q:"Qual país é o maior vencedor de Copas do Mundo?",o:["Alemanha","Argentina","Itália","Brasil"],c:3,cat:"História Geral",difficulty:"easy"},
  {q:"Quantas Copas do Mundo o Brasil conquistou?",o:["4","5","6","7"],c:1,cat:"História Geral",difficulty:"easy"},
  {q:"Em que ano foi disputada a primeira Copa do Mundo?",o:["1926","1928","1930","1934"],c:2,cat:"História Geral",difficulty:"easy"},
  {q:"Qual país sediou a primeira Copa do Mundo?",o:["Brasil","Argentina","Uruguai","Itália"],c:2,cat:"História Geral",difficulty:"easy"},
  {q:"Em que ano ocorreu o famoso 'Maracanazo'?",o:["1946","1950","1954","1958"],c:1,cat:"História Geral",difficulty:"medium"},
  {q:"Qual país europeu venceu as Copas de 1934 e 1938?",o:["Alemanha","França","Itália","Hungria"],c:2,cat:"História Geral",difficulty:"medium"},
  {q:"Qual foi a Copa do Mundo vencida pelo Brasil com a geração de Pelé, Tostão e Rivelino?",o:["Chile 1962","México 1970","Alemanha 1974","Argentina 1978"],c:1,cat:"História Geral",difficulty:"medium"},
  {q:"Qual foi a maior goleada da história das Copas do Mundo?",o:["Brasil 8x0 Bolívia","Alemanha 8x0 Arábia Saudita","Hungria 10x1 El Salvador","Hungria 9x0 Coreia do Sul"],c:2,cat:"História Geral",difficulty:"hard"},
  {q:"Qual país venceu a Copa de 2018 na Rússia?",o:["Croácia","Argentina","França","Bélgica"],c:2,cat:"História Geral",difficulty:"easy"},
  {q:"Em qual Copa do Mundo a Alemanha venceu o Brasil por 7x1?",o:["África do Sul 2010","Brasil 2014","Rússia 2018","Catar 2022"],c:1,cat:"História Geral",difficulty:"easy"},

  // Brasil nas Copas
  {q:"Em qual Copa o Brasil conquistou seu primeiro título mundial?",o:["1950","1954","1958","1962"],c:2,cat:"Brasil nas Copas",difficulty:"easy"},
  {q:"Onde o Brasil conquistou seu pentacampeonato?",o:["França 1998","Coreia/Japão 2002","EUA 1994","Alemanha 2006"],c:1,cat:"Brasil nas Copas",difficulty:"easy"},
  {q:"Qual foi o resultado da final da Copa de 1994 entre Brasil e Itália?",o:["Brasil 3x2","Brasil 1x0","0x0 com Brasil vencendo nos pênaltis","Brasil 2x1"],c:2,cat:"Brasil nas Copas",difficulty:"medium"},
  {q:"Qual jogador marcou o gol do pentacampeonato do Brasil em 2002?",o:["Ronaldo","Ronaldinho","Rivaldo","Cafu"],c:0,cat:"Brasil nas Copas",difficulty:"easy"},
  {q:"Neymar participou de quantas Copas do Mundo?",o:["2","3","4","5"],c:1,cat:"Brasil nas Copas",difficulty:"easy"},

  // Artilheiros
  {q:"Quem é o maior artilheiro da história das Copas do Mundo?",o:["Pelé","Ronaldo Nazário","Miroslav Klose","Gerd Müller"],c:2,cat:"Artilheiros e Gols",difficulty:"medium"},
  {q:"Quantos gols Miroslav Klose marcou em Copas do Mundo?",o:["14","15","16","17"],c:2,cat:"Artilheiros e Gols",difficulty:"hard"},
  {q:"Quem marcou mais gols em uma única Copa do Mundo?",o:["Pelé em 1958","Just Fontaine em 1958","Gerd Müller em 1970","Ronaldo em 2002"],c:1,cat:"Artilheiros e Gols",difficulty:"hard"},
  {q:"Quem foi o artilheiro da Copa de 2022 no Catar?",o:["Messi","Mbappé","Benzema","Neymar"],c:1,cat:"Artilheiros e Gols",difficulty:"easy"},

  // Lendas
  {q:"Qual jogador ficou famoso pela 'Mão de Deus' na Copa de 1986?",o:["Pelé","Ronaldo","Diego Maradona","Zidane"],c:2,cat:"Lendas do Futebol",difficulty:"easy"},
  {q:"Em qual Copa Zidane deu a famosa cabeçada em Materazzi?",o:["França 1998","Japão/Coreia 2002","Alemanha 2006","África do Sul 2010"],c:2,cat:"Lendas do Futebol",difficulty:"easy"},
  {q:"Quantas Copas Pelé venceu?",o:["1","2","3","4"],c:2,cat:"Lendas do Futebol",difficulty:"easy"},
  {q:"Quem foi eleito o melhor jogador da Copa de 2022?",o:["Mbappé","Modric","Benzema","Messi"],c:3,cat:"Lendas do Futebol",difficulty:"easy"},

  // Recordes
  {q:"Qual foi o único jogador a ser expulso em uma final de Copa do Mundo?",o:["Zinedine Zidane","Ronaldo","Ronaldinho","Maradona"],c:0,cat:"Recordes e Curiosidades",difficulty:"medium"},
  {q:"Qual Copa foi a primeira a ter o VAR?",o:["Brasil 2014","Rússia 2018","Catar 2022","França 1998"],c:1,cat:"Recordes e Curiosidades",difficulty:"medium"},
  {q:"Qual continente nunca sediou uma Copa do Mundo?",o:["África","Oceania","Ásia","América do Norte"],c:1,cat:"Recordes e Curiosidades",difficulty:"medium"},
  {q:"Qual é o recorde de público em um jogo de Copa do Mundo?",o:["173.850 — Brasil x Uruguai 1950","100.000 — Wembley 1966","120.000 — México 1986","95.000 — Alemanha 2006"],c:0,cat:"Recordes e Curiosidades",difficulty:"hard"},

  // Zebras
  {q:"Qual seleção africana chegou às semifinais da Copa do Mundo de 2022?",o:["Senegal","Gana","Nigéria","Marrocos"],c:3,cat:"Zebras e Surpresas",difficulty:"easy"},
  {q:"Qual seleção asiática chegou às semifinais da Copa do Mundo de 2002?",o:["Japão","Arábia Saudita","Coreia do Sul","China"],c:2,cat:"Zebras e Surpresas",difficulty:"easy"},
  {q:"Qual Copa trouxe a zebra dos EUA eliminando a Inglaterra?",o:["1934","1950","1966","1974"],c:1,cat:"Zebras e Surpresas",difficulty:"hard"},

  // Finais
  {q:"Qual foi o placar da final de 1970 entre Brasil e Itália?",o:["Brasil 3x1","Brasil 4x1","Brasil 2x1","Brasil 3x2"],c:1,cat:"Finais Históricas",difficulty:"medium"},
  {q:"Qual país venceu as Copas de 2010 e 2022?",o:["Alemanha","França","Espanha","Argentina"],c:2,cat:"Finais Históricas",difficulty:"medium"},
  {q:"Qual foi o placar da final de 2022 entre Argentina e França?",o:["Argentina 2x0","Argentina 1x0","3x3 com Argentina vencendo nos pênaltis","Argentina 2x1"],c:2,cat:"Finais Históricas",difficulty:"medium"},
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB Atlas\n');

    const deleted = await Question.deleteMany({});
    if (deleted.deletedCount > 0) console.log(`🗑  ${deleted.deletedCount} perguntas antigas removidas`);

    const inserted = await Question.insertMany(QUESTIONS, { ordered: false });
    console.log(`✅ ${inserted.length} perguntas inseridas!\n`);

    console.log('📊 Por categoria:');
    const cats = {};
    QUESTIONS.forEach(q => { cats[q.cat] = (cats[q.cat]||0)+1; });
    Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => {
      console.log(`   ${c.padEnd(28)} ${n}`);
    });

    console.log('\n📊 Por dificuldade:');
    const diffs = {easy:0,medium:0,hard:0};
    QUESTIONS.forEach(q => diffs[q.difficulty]++);
    console.log(`   🟢 Fácil:   ${diffs.easy}`);
    console.log(`   🟡 Médio:   ${diffs.medium}`);
    console.log(`   🔴 Difícil: ${diffs.hard}`);
    console.log(`\n🏆 Quiz Cup Fever seed concluído!\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

seed();
