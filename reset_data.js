const fs = require('fs');
const path = require('path');

// Caminhos
const rootDir = __dirname;
const dadosDir = path.join(rootDir, 'dados');
const resultadosDir = path.join(rootDir, 'resultados');
const backupDir = path.join(rootDir, 'backup');

// Arquivos de dados
const candidatosFile = path.join(dadosDir, 'candidatos.json');
const votosFile = path.join(dadosDir, 'votos_registrados.json');

function resetDataSync() {
    console.log('🔄 Iniciando reset SYNCHRONOUS...');

    try {
        // 1. Resetar votos dos candidatos
        if (fs.existsSync(candidatosFile)) {
            console.log(`Lendo ${candidatosFile}...`);
            const data = fs.readFileSync(candidatosFile, 'utf8');
            const candidatosJson = JSON.parse(data);

            candidatosJson.candidatos = candidatosJson.candidatos.map(c => ({
                ...c,
                voto: 0
            }));

            // Atualizar timestamp
            candidatosJson.timestamp = new Date().toISOString();

            fs.writeFileSync(candidatosFile, JSON.stringify(candidatosJson, null, 2), 'utf8');
            console.log('✅ Votos dos candidatos zerados (SYNC).');
        } else {
            console.error('❌ Arquivo candidatos.json não encontrado!');
        }

        // 2. Limpar registro de quem votou
        console.log(`Limpando ${votosFile}...`);
        fs.writeFileSync(votosFile, '[]', 'utf8');
        console.log('✅ Registro de eleitores que votaram limpo (SYNC).');

        // 3. Limpar pasta de resultados (logs)
        if (fs.existsSync(resultadosDir)) {
            const files = fs.readdirSync(resultadosDir);
            for (const file of files) {
                const filePath = path.join(resultadosDir, file);
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error(`Erro ao deletar ${file}: ${err.message}`);
                }
            }
            console.log(`✅ ${files.length} arquivos de log removidos de resultados/`);
        } else {
            console.log('Pasta resultados não existe.');
        }

        console.log('\n🎉 SUCESSO! DADOS RESETADOS.');

    } catch (error) {
        console.error('❌ ERRO FATAL no reset:', error);
    }
}

resetDataSync();
