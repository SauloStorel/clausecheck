import fs from 'fs';
import https from 'https';

// Baixa um arquivo via HTTP e salva localmente
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
      rejectUnauthorized: false, // STF usa cert autoassinado
    };

    function get(url) {
      https.get(url, options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} para ${url}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    }

    get(url);
  });
}

// Baixa texto via HTTP
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' },
      rejectUnauthorized: false,
    };

    function get(url) {
      https.get(url, options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location);
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    }

    get(url);
  });
}

// Extrai súmulas vinculantes do STF do HTML
function parseSumulasVinculantes(html) {
  const chunks = [];
  // Padrão: "Súmula Vinculante nº X" seguido do texto
  const regex = /S[úu]mula\s+Vinculante\s+n[º°oa]?\s*(\d+)[^:]*[:\-–]\s*([^<\n]+(?:\n(?![A-Z]{2})[^<\n]+)*)/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const num = match[1];
    const content = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (content.length > 20) {
      chunks.push({
        source: 'SUMULAS_STF',
        article: `Súmula Vinculante ${num}`,
        content: `Súmula Vinculante ${num}: ${content}`,
      });
    }
  }
  return chunks;
}

async function main() {
  console.log('📥 Baixando súmulas...\n');

  // ── STJ: PDF completo ────────────────────────────────────────────────────
  const stjDest = '/home/storell/Downloads/sumulas-stj.pdf';
  process.stdout.write('📄 STJ — baixando PDF...');
  try {
    await download(
      'https://www.stj.jus.br/docs_internet/VerbetesSumulares_asc.pdf',
      stjDest,
    );
    console.log(' ✓ salvo em', stjDest);
  } catch (e) {
    console.log(` ❌ falhou: ${e.message}`);
    console.log('   → Baixe manualmente em stj.jus.br e salve como sumulas-stj.pdf');
  }

  // ── STF: Súmulas Vinculantes via HTML ────────────────────────────────────
  const stfDest = '/home/storell/Downloads/sumulas-stf-vinculantes.json';
  process.stdout.write('⚖️  STF Vinculantes — buscando...');
  try {
    const html = await fetchText(
      'https://portal.stf.jus.br/textos/verTexto.asp?servico=jurisprudenciaSumulaVinculante',
    );
    const chunks = parseSumulasVinculantes(html);
    if (chunks.length > 0) {
      fs.writeFileSync(stfDest, JSON.stringify(chunks, null, 2));
      console.log(` ✓ ${chunks.length} súmulas extraídas → ${stfDest}`);
    } else {
      console.log(' ⚠️  Nenhuma súmula extraída do HTML — estrutura pode ter mudado.');
      console.log('   → Acesse portal.stf.jus.br manualmente e salve como PDF');
    }
  } catch (e) {
    console.log(` ❌ falhou: ${e.message}`);
  }

  console.log('\n✅ Pronto! Rode agora:\n');
  console.log('   EXPO_PUBLIC_SUPABASE_URL=https://fvivsmlzusvbzeunwkju.supabase.co INGEST_SECRET=Saulohue32012 node scripts/ingest.mjs');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
