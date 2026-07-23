const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { withFileLock, waitForFileQueue } = require('./fileLockService');

const rootDir = path.join(__dirname, '..');

function getCandidatosFilePath() {
    return process.env.CANDIDATOS_FILE_PATH || path.join(rootDir, 'dados', 'candidatos.json');
}

let candidatesCache = [];

function resolveDataFile(customPath) {
    return customPath || getCandidatosFilePath();
}


async function carregarCandidatos({ waitForQueue = true, dataFile } = {}) {
    const filePath = resolveDataFile(dataFile);

    if (waitForQueue) {
        await waitForFileQueue();
    }

    try {
        const data = await fsPromises.readFile(filePath, 'utf8');
        const parsed = JSON.parse(data);

        if (Array.isArray(parsed)) {
            candidatesCache = parsed;
        } else if (parsed && Array.isArray(parsed.candidatos)) {
            candidatesCache = parsed.candidatos;
        } else {
            candidatesCache = [];
        }

        return candidatesCache;
    } catch (error) {
        if (error.code === 'ENOENT') {
            candidatesCache = [];
            // Ensure the directory exists before saving an empty array
            await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
            await salvarCandidatos([], { useLock: false, dataFile: filePath });
            return candidatesCache;
        }
        candidatesCache = [];
        return [];
    }
}

async function salvarCandidatos(candidatos, { useLock = true, dataFile } = {}) {
    const filePath = resolveDataFile(dataFile);
    const persist = async () => {
        const dir = path.dirname(filePath);
        await fsPromises.mkdir(dir, { recursive: true });

        const payload = {
            timestamp: new Date().toISOString(),
            candidatos,
            metadata: {
                total_candidatos: candidatos.length,
                sistema: 'CIPA-Votacao',
                versao: '1.0.0'
            }
        };

        await fsPromises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
        candidatesCache = candidatos;
    };

    return useLock ? withFileLock('salvarCandidatos', persist) : persist();
}

async function adicionarCandidato(dados, { dataFile } = {}) {
    const { numcad, numcpf, nomfun, titcar, datnas } = dados;

    if (!numcad || !nomfun) {
        const error = new Error('Matricula e nome sao obrigatorios');
        error.statusCode = 400;
        throw error;
    }

    let novoCandidato = null;
    await withFileLock('admin_adicionar_candidato', async () => {
        const candidatos = await carregarCandidatos({ waitForQueue: false, dataFile });
        const exists = candidatos.find(c => c.numcad === numcad);

        if (exists) {
            const duplicateError = new Error('Candidato ja cadastrado');
            duplicateError.statusCode = 400;
            throw duplicateError;
        }

        novoCandidato = {
            numcad: numcad.toString(),
            numcpf: numcpf || null,
            nomfun,
            titcar: titcar || null,
            datnas: datnas || null,
            voto: 0,
            ativo: 'S',
            data_criacao: new Date().toISOString()
        };

        candidatos.push(novoCandidato);
        await salvarCandidatos(candidatos, { useLock: false, dataFile });
    });

    return novoCandidato;
}

async function excluirCandidato(numcad, { dataFile } = {}) {
    if (!numcad) {
        const error = new Error('Matricula e obrigatoria');
        error.statusCode = 400;
        throw error;
    }

    let candidatoExcluido = null;
    await withFileLock('admin_excluir_candidato', async () => {
        const candidatos = await carregarCandidatos({ waitForQueue: false, dataFile });
        const candidatoIndex = candidatos.findIndex(c => c.numcad === numcad);

        if (candidatoIndex === -1) {
            const notFoundError = new Error('Candidato nao encontrado');
            notFoundError.statusCode = 404;
            throw notFoundError;
        }

        candidatoExcluido = candidatos[candidatoIndex];
        candidatos.splice(candidatoIndex, 1);
        await salvarCandidatos(candidatos, { useLock: false, dataFile });
    });

    return candidatoExcluido;
}

async function registrarVotoParaCandidato(numcad, { dataFile, useLock = true } = {}) {
    let votoResumo = null;

    const executarRegistro = async () => {
        const candidatos = await carregarCandidatos({ waitForQueue: false, dataFile });
        const candidatoIndex = candidatos.findIndex(c => c.numcad === numcad.toString() && c.ativo === 'S');

        if (candidatoIndex === -1) {
            const candidateNotFound = new Error('Candidato nao encontrado ou inativo');
            candidateNotFound.statusCode = 400;
            throw candidateNotFound;
        }

        candidatos[candidatoIndex].voto = (candidatos[candidatoIndex].voto || 0) + 1;
        votoResumo = {
            numcad: candidatos[candidatoIndex].numcad,
            nomfun: candidatos[candidatoIndex].nomfun,
            votosTotais: candidatos[candidatoIndex].voto
        };

        await salvarCandidatos(candidatos, { useLock: false, dataFile });
    };

    if (useLock) {
        await withFileLock('registro_voto', executarRegistro);
    } else {
        await executarRegistro();
    }

    return votoResumo;
}

async function registrarVotoNulo({ dataFile, useLock = true } = {}) {
    let votoResumo = null;

    const executarRegistro = async () => {
        const candidatos = await carregarCandidatos({ waitForQueue: false, dataFile });
        const nullVoteIndex = candidatos.findIndex(c => c.numcad === 'NULO');

        if (nullVoteIndex === -1) {
            const nullVoteNotFound = new Error('Candidato de voto nulo nao encontrado');
            nullVoteNotFound.statusCode = 500;
            throw nullVoteNotFound;
        }

        candidatos[nullVoteIndex].voto = (candidatos[nullVoteIndex].voto || 0) + 1;
        votoResumo = {
            numcad: candidatos[nullVoteIndex].numcad,
            nomfun: candidatos[nullVoteIndex].nomfun,
            votosTotais: candidatos[nullVoteIndex].voto
        };

        await salvarCandidatos(candidatos, { useLock: false, dataFile });
    };

    if (useLock) {
        await withFileLock('registro_voto', executarRegistro);
    } else {
        await executarRegistro();
    }

    return votoResumo;
}

module.exports = {
    carregarCandidatos,
    salvarCandidatos,
    adicionarCandidato,
    excluirCandidato,
    registrarVotoParaCandidato,
    registrarVotoNulo,
    resolveDataFile
};
