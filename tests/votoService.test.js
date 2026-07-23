const { test } = require('node:test');
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
    verificarVotoEleitor,
    registrarVotoEleitor,
    obterVotoDoEleitor
} = require('../services/votoService');

test('registra e consulta voto em arquivo temporario', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'votos-test-'));
    const votesFile = path.join(tempDir, 'votos_registrados.json');

    const numcadEleitor = '123';
    const numcadCandidato = '999';

    const jaVotouAntes = await verificarVotoEleitor(numcadEleitor, { votesFile });
    assert.equal(jaVotouAntes, false);

    await registrarVotoEleitor(
        numcadEleitor,
        numcadCandidato,
        { numcad: numcadEleitor, nomfun: 'Eleitor Teste' },
        '127.0.0.1',
        'jest',
        { useLock: false, votesFile }
    );

    const jaVotouDepois = await verificarVotoEleitor(numcadEleitor, { votesFile });
    assert.equal(jaVotouDepois, true);

    const voto = await obterVotoDoEleitor(numcadEleitor, { votesFile });
    assert.ok(voto);
    assert.equal(voto.candidato_numcad, numcadCandidato);
});
