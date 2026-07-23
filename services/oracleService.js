const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
    host: process.env.host || '192.168.1.4',
    port: process.env.port || 1521,
    service_name: process.env.service_name || 'prodpdb',
    user: process.env.user || 'usu',
    password: process.env.password || 'usu',
    connectString: `${process.env.host || '192.168.1.4'}:${process.env.port || 1521}/${process.env.service_name || 'prodpdb'}`
};

let connection;

async function initConnection(config = dbConfig) {
    try {
        connection = await oracledb.getConnection(config);
        console.log('Conectado ao Oracle Database');
    } catch (err) {
        console.error('Erro ao conectar ao Oracle:', err);
        console.log('Trabalhando em modo offline com arquivos locais...');
        connection = null;
    }

    return connection;
}

function getConnection() {
    return connection;
}

async function fetchColaboradorByCPF(cpf) {
    if (!connection) return null;

    const result = await connection.execute(`
        SELECT NUMCAD, NUMCPF, NOMFUN, DATNAS
        FROM VETORH.R034FUN
        WHERE NUMCPF = :cpf
    `, [cpf]);

    return result.rows?.[0] || null;
}

async function fetchColaboradorDetalhado(numcad) {
    if (!connection) return null;

    const result = await connection.execute(`
        SELECT
            FUN.NUMCAD,
            FUN.NUMCPF,
            FUN.NOMFUN,
            FUN.DATNAS,
            FUN.CODCAR,
            CAR.TITCAR,
            FUN.SITAFA,
            FUN.DATADM
        FROM VETORH.R034FUN FUN
        LEFT JOIN VETORH.R024CAR CAR ON (CAR.CODCAR = FUN.CODCAR)
        WHERE FUN.NUMEMP = 11
            AND FUN.SITAFA NOT IN (7)
            AND FUN.TIPCOL = 1
            AND FUN.NUMCAD = :numcad
    `, [numcad]);

    return result.rows?.[0] || null;
}

async function buscarColaboradoresPorPrefixo(search, cadastrados = new Set()) {
    if (!connection) return [];

    const result = await connection.execute(`
        SELECT DISTINCT
            FUN.NUMCAD,
            FUN.NOMFUN,
            FUN.NUMCPF,
            FUN.DATNAS,
            CAR.TITCAR
        FROM VETORH.R034FUN FUN
        LEFT JOIN VETORH.R024CAR CAR ON (CAR.CODCAR = FUN.CODCAR)
        WHERE FUN.NUMEMP = 11
            AND FUN.SITAFA NOT IN (7)
            AND FUN.TIPCOL = 1
            AND (FUN.NUMCAD LIKE :search OR FUN.NOMFUN LIKE :search)
        ORDER BY FUN.NOMFUN
    `, [`${search.toUpperCase()}%`]);

    return result.rows
        .map(row => ({
            numcad: row.NUMCAD,
            nomfun: row.NOMFUN,
            numcpf: row.NUMCPF,
            datnas: row.DATNAS,
            titcar: row.TITCAR
        }))
        .filter(collab => !cadastrados.has(collab.numcad));
}

module.exports = {
    initConnection,
    getConnection,
    fetchColaboradorByCPF,
    fetchColaboradorDetalhado,
    buscarColaboradoresPorPrefixo
};
