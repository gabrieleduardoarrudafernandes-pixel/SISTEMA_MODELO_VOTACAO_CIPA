const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { withFileLock, waitForFileQueue } = require('./fileLockService');

const rootDir = path.join(__dirname, '..');
const defaultVotesFile = path.join(rootDir, 'dados', 'votos_registrados.json');

function resolveVotesFile(customPath) {
    return customPath || defaultVotesFile;
}

async function verificarVotoEleitor(numcadEleitor, { votesFile } = {}) {
    const filePath = resolveVotesFile(votesFile);
    await waitForFileQueue();

    if (!fs.existsSync(filePath)) {
        return false;
    }

    const data = await fsPromises.readFile(filePath, 'utf8');
    const votos = JSON.parse(data);
    return votos.some(voto => voto.eleitor_numcad === numcadEleitor);
}

async function obterVotoDoEleitor(numcadEleitor, { votesFile } = {}) {
    const filePath = resolveVotesFile(votesFile);
    await waitForFileQueue();

    if (!fs.existsSync(filePath)) {
        return null;
    }

    const data = await fsPromises.readFile(filePath, 'utf8');
    const votos = JSON.parse(data);
    return votos.find(voto => voto.eleitor_numcad === numcadEleitor) || null;
}

async function registrarVotoEleitor(numcadEleitor, numcadCandidato, dadosEleitor, ip = null, userAgent = null, { useLock = true, votesFile } = {}) {
    const filePath = resolveVotesFile(votesFile);
    const persistirVoto = async () => {
        const dir = path.dirname(filePath);
        await fsPromises.mkdir(dir, { recursive: true });

        let votos = [];
        if (fs.existsSync(filePath)) {
            const data = await fsPromises.readFile(filePath, 'utf8');
            votos = JSON.parse(data);
        }

        const novoVoto = {
            id: votos.length + 1,
            eleitor_numcad: numcadEleitor,
            candidato_numcad: numcadCandidato,
            data_voto: new Date().toISOString(),
            eleitor_dados: dadosEleitor,
            ip: ip || 'localhost',
            user_agent: userAgent || 'Sistema Interno'
        };

        votos.push(novoVoto);
        await fsPromises.writeFile(filePath, JSON.stringify(votos, null, 2), 'utf8');
        return true;
    };

    return useLock ? withFileLock('registrarVotoEleitor', persistirVoto) : persistirVoto();
}

module.exports = {
    verificarVotoEleitor,
    obterVotoDoEleitor,
    registrarVotoEleitor,
    resolveVotesFile
};
