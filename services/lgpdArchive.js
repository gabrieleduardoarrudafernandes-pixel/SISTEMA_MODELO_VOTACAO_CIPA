const fs = require('fs').promises;
const path = require('path');

function resolveRootDir(baseDir) {
    return path.resolve(baseDir || path.join(__dirname, '..'));
}

async function ensureDirectories(baseDir = path.join(__dirname, '..')) {
    const rootDir = resolveRootDir(baseDir);
    const dirs = ['dados', 'resultados', 'backup'];
    for (const dir of dirs) {
        const target = path.join(rootDir, dir);
        await fs.mkdir(target, { recursive: true });
    }
}

async function salvarResultados(tipo, dados, baseDir = path.join(__dirname, '..')) {
    const rootDir = resolveRootDir(baseDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${tipo}_${timestamp}.json`;
    const filepath = path.join(rootDir, 'resultados', filename);

    const resultado = {
        timestamp: new Date().toISOString(),
        tipo,
        dados,
        metadata: {
            total_registros: Array.isArray(dados) ? dados.length : Object.keys(dados || {}).length,
            sistema: 'SIPA-Votacao',
            versao: '1.0.0'
        }
    };

    await fs.writeFile(filepath, JSON.stringify(resultado, null, 2), 'utf8');

    const dataAtual = new Date().toISOString().split('T')[0];
    const backupFile = path.join(rootDir, 'backup', `${tipo}_${dataAtual}.json`);
    await fs.writeFile(backupFile, JSON.stringify(resultado, null, 2), 'utf8');

    return filepath;
}

module.exports = {
    ensureDirectories,
    salvarResultados
};
