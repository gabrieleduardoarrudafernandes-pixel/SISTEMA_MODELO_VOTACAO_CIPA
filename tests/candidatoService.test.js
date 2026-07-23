jest.mock('fs'); // This tells Jest to use our __mocks__/fs.js

const path = require('path');

// Import the mock fs functions
const {
    __resetInMemoryFs,
    __getInMemoryFs
} = require('../__mocks__/fs');

jest.isolateModules(() => {
    describe('candidatoService', () => {
        let carregarCandidatos;
        let salvarCandidatos;
        let registrarVotoParaCandidato;

        const testDataFile = path.resolve(__dirname, 'temp_candidatos.json');

        beforeAll(() => {
            process.env.CANDIDATOS_FILE_PATH = testDataFile;
            // Dynamically require candidatoService AFTER mocks are set up
            ({
                carregarCandidatos,
                salvarCandidatos,
                registrarVotoParaCandidato
            } = require('../services/candidatoService'));
        });

        afterAll(() => {
            delete process.env.CANDIDATOS_FILE_PATH;
        });

        beforeEach(() => {
            __resetInMemoryFs(); // Clear the in-memory file system before each test
        });

        test('should save and load candidates using an isolated file', async () => {
            const candidatos = [{
                numcad: '1',
                nomfun: 'Teste Um',
                numcpf: '12345678900',
                titcar: 'Dev',
                datnas: new Date().toISOString(),
                voto: 0,
                ativo: 'S'
            }];

            await salvarCandidatos(candidatos, { useLock: false, dataFile: testDataFile });
            const carregados = await carregarCandidatos({ waitForQueue: false, dataFile: testDataFile });

            expect(carregados.length).toBe(1);
            expect(carregados[0].nomfun).toBe('Teste Um');

            // Verify the content in the mocked file system
            const inMemoryFs = __getInMemoryFs();
            const storedData = JSON.parse(inMemoryFs[path.resolve(testDataFile)]);
            expect(storedData.candidatos[0].nomfun).toBe('Teste Um');
        });

        test('should increment vote for an active candidate', async () => {
            const candidatos = [{
                numcad: '99',
                nomfun: 'Candidata Teste',
                voto: 0,
                ativo: 'S'
            }];

            // Pre-populate the in-memory file system
            __getInMemoryFs()[path.resolve(testDataFile)] = JSON.stringify({ candidatos });

            const resumo = await registrarVotoParaCandidato('99', { dataFile: testDataFile, useLock: false });

            expect(resumo.numcad).toBe('99');
            expect(resumo.votosTotais).toBe(1);

            // Verify the updated content in the mocked file system
            const inMemoryFs = __getInMemoryFs();
            const storedData = JSON.parse(inMemoryFs[path.resolve(testDataFile)]);
            expect(storedData.candidatos[0].voto).toBe(1);
        });
    });
});
