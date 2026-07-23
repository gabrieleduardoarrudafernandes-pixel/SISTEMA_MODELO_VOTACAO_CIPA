const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');
const { fetchColaboradorByCPF } = require('./oracleService');
const { carregarCandidatos } = require('./candidatoService');
const { withFileLock } = require('./fileLockService');

const rootDir = path.join(__dirname, '..');

function getUsersFilePath() {
    return process.env.USERS_FILE_PATH || path.join(rootDir, 'dados', 'users.json');
}

async function _loadUsers() {
    const filePath = getUsersFilePath();
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

async function _saveUsers(users) {
    const filePath = getUsersFilePath();
    await withFileLock('saveUsers', async () => {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(users, null, 2), 'utf8');
    });
}

async function findUserByCpf(cpf) {
    const cpfLimpo = cpf.replace(/[.-]/g, '');
    let user = null;

    // First try local users.json for test users
    const localUsers = await _loadUsers();
    const localUser = Object.entries(localUsers).find(([numcad, userData]) => {
        // For test users, the CPF might be stored in the userData
        return userData.cpf === cpfLimpo;
    });

    if (localUser) {
        const [numcad, userData] = localUser;
        user = {
            numcad: numcad,
            numcpf: userData.cpf || cpfLimpo,
            nomfun: userData.nomfun,
            datnas: userData.datnas,
            password: userData.password,
            temporaryPassword: userData.temporaryPassword,
            source: 'local_test'
        };
        return user;
    }

    // Try fetching from Oracle
    try {
        const colaboradorOracle = await fetchColaboradorByCPF(cpfLimpo);
        if (colaboradorOracle) {
            user = {
                numcad: colaboradorOracle.NUMCAD,
                numcpf: colaboradorOracle.NUMCPF,
                nomfun: colaboradorOracle.NOMFUN,
                datnas: colaboradorOracle.DATNAS,
                source: 'oracle'
            };
        }
    } catch (error) {
        console.warn('Could not fetch from Oracle, trying local candidates:', error.message);
    }

    // If not found in Oracle, try local candidates (if not already converted to user)
    if (!user) {
        const candidatos = await carregarCandidatos();
        const candidatoLocal = candidatos.find(c => c.numcpf === cpfLimpo);
        if (candidatoLocal) {
            user = {
                numcad: candidatoLocal.numcad,
                numcpf: candidatoLocal.numcpf,
                nomfun: candidatoLocal.nomfun,
                datnas: candidatoLocal.datnas,
                source: 'local_candidate'
            };
        }
    }

    // If no user found from any source, return null
    if (!user) {
        return null;
    }

    // Now, try to get the password from the local users.json
    const existingLocalUsers = await _loadUsers();
    if (existingLocalUsers[user.numcad]) {
        user.password = existingLocalUsers[user.numcad].password;
        user.temporaryPassword = existingLocalUsers[user.numcad].temporaryPassword;
    } else {
        // If user exists but no password in users.json, generate a temporary one
        // and store it for future logins.
        const tempPassword = user.datnas ?
            new Date(user.datnas).getDate().toString().padStart(2, '0') +
            (new Date(user.datnas).getMonth() + 1).toString().padStart(2, '0') +
            new Date(user.datnas).getFullYear().toString() : null;
        
        if (tempPassword) {
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            const updatedLocalUsers = await _loadUsers();
            updatedLocalUsers[user.numcad] = { password: hashedPassword, temporaryPassword: true };
            await _saveUsers(updatedLocalUsers);
            user.password = hashedPassword;
            user.temporaryPassword = true;
        }
    }

    return user;
}


async function verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
    findUserByCpf,
    verifyPassword,
    _loadUsers,
    _saveUsers
};