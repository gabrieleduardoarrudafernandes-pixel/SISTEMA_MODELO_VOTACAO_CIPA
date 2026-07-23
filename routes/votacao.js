const express = require('express');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const checkIfUserAlreadyVoted = require('../middlewares/votoCheckMiddleware');
const {
    carregarCandidatos,
    registrarVotoParaCandidato,
    registrarVotoNulo
} = require('../services/candidatoService');
const { salvarResultados } = require('../services/lgpdArchive');
const {
    verificarVotoEleitor,
    obterVotoDoEleitor,
    registrarVotoEleitor
} = require('../services/votoService');
const { fetchColaboradorDetalhado, getConnection } = require('../services/oracleService');
const { withFileLock } = require('../services/fileLockService');

const router = express.Router();

// Função para verificar se existe foto para o candidato
function verificarFotoCandidato(numcad) {
    const fotosPath = path.join(__dirname, '..', 'ELEITORES');
    const fotoPath = path.join(fotosPath, `${numcad}.jpg`);

    try {
        if (fs.existsSync(fotoPath)) {
            return `/eleitores/fotos/${numcad}.jpg`;
        }
    } catch (error) {
        console.error(`Erro ao verificar foto do candidato ${numcad}:`, error);
    }

    return null;
}

router.get('/votacao', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'votacao.html'));
});

router.get('/api/candidatos', isAuthenticated, async (req, res) => {
    try {
        const candidatos = await carregarCandidatos();
        const connection = getConnection();

        const candidatosAtivos = candidatos.filter(c => c.ativo === 'S');
        const candidatosEnriquecidos = await Promise.all(
            candidatosAtivos.map(async (candidato) => {
                // Se for voto nulo, não buscar no Oracle e retornar dados diretos
                if (candidato.numcad === 'NULO') {
                    return {
                        numcad: candidato.numcad,
                        numcpf: null,
                        nomfun: candidato.nomfun,
                        titcar: candidato.titcar,
                        codcar: null,
                        codsec: null,
                        sitafa: null,
                        datadm: null,
                        salario: null,
                        datnas: null,
                        voto: candidato.voto || 0,
                        ativo: candidato.ativo || 'S',
                        data_criacao: candidato.data_criacao,
                        isNullVote: true
                    };
                }

                if (connection) {
                    try {
                        const colaborador = await fetchColaboradorDetalhado(candidato.numcad);
                        if (colaborador) {
                            return {
                                numcad: colaborador.NUMCAD,
                                numcpf: colaborador.NUMCPF || null,
                                nomfun: colaborador.NOMFUN || candidato.nomfun,
                                titcar: colaborador.TITCAR || candidato.titcar,
                                codcar: colaborador.CODCAR || null,
                                codsec: colaborador.CODSEC || null,
                                sitafa: colaborador.SITAFA || null,
                                datadm: colaborador.DATADM || null,
                                salario: null,
                                datnas: colaborador.DATNAS || candidato.datnas,
                                voto: candidato.voto || 0,
                                ativo: candidato.ativo || 'S',
                                data_criacao: candidato.data_criacao,
                                foto: verificarFotoCandidato(colaborador.NUMCAD)
                            };
                        }
                    } catch (error) {
                        console.error('Erro ao buscar dados completos do candidato:', candidato.numcad, error);
                    }
                }

                return {
                    numcad: candidato.numcad,
                    numcpf: candidato.numcpf || null,
                    nomfun: candidato.nomfun,
                    titcar: candidato.titcar || 'Nao informado',
                    codsec: null,
                    sitafa: null,
                    datadm: null,
                    salario: null,
                    datnas: candidato.datnas || null,
                    voto: candidato.voto || 0,
                    ativo: candidato.ativo || 'S',
                    data_criacao: candidato.data_criacao,
                    foto: verificarFotoCandidato(candidato.numcad)
                };
            })
        );

        // Ordenar para garantir que voto NULO apareça primeiro
        candidatosEnriquecidos.sort((a, b) => {
            if (a.numcad === 'NULO') return -1;
            if (b.numcad === 'NULO') return 1;
            return 0; // Manter ordem original para os outros
        });

        return res.json(candidatosEnriquecidos);
    } catch (error) {
        console.error('Erro ao buscar candidatos:', error);
        return res.status(500).json({ error: 'Erro ao buscar candidatos' });
    }
});

router.get('/api/resultados', isAuthenticated, async (req, res) => {
    try {
        const candidatos = await carregarCandidatos();
        const candidatosAtivos = candidatos.filter(c => c.ativo === 'S');

        const resultados = candidatosAtivos
            .sort((a, b) => b.voto - a.voto)
            .map(c => ({
                numcad: c.numcad,
                nomfun: c.nomfun,
                voto: c.voto,
                percentual: 0
            }));

        return res.json(resultados);
    } catch (error) {
        console.error('Erro ao buscar resultados:', error);
        return res.status(500).json({ error: 'Erro ao buscar resultados' });
    }
});

router.get('/api/verificar-voto', isAuthenticated, async (req, res) => {
    try {
        const numcadEleitor = req.session.user.numcad;
        const jaVotou = await verificarVotoEleitor(numcadEleitor);

        return res.json({
            ja_votou: jaVotou,
            mensagem: jaVotou ? 'Voce ja registrou seu voto' : 'Seu voto ainda nao foi registrado'
        });
    } catch (error) {
        console.error('Erro ao verificar status do voto:', error);
        return res.status(500).json({ error: 'Erro ao verificar status do voto' });
    }
});

router.get('/api/votos-eleitor', isAuthenticated, async (req, res) => {
    try {
        const numcadEleitor = req.session.user.numcad;
        const votoEleitor = await obterVotoDoEleitor(numcadEleitor);

        if (votoEleitor) {
            return res.json({
                voto_registrado: true,
                candidato_numcad: votoEleitor.candidato_numcad,
                data_voto: votoEleitor.data_voto,
                ip: votoEleitor.ip,
                user_agent: votoEleitor.user_agent
            });
        }

        return res.json({
            voto_registrado: false,
            candidato_votado: null
        });
    } catch (error) {
        console.error('Erro ao obter votos do eleitor:', error);
        return res.status(500).json({ error: 'Erro ao obter votos do eleitor' });
    }
});

router.post('/api/votar', isAuthenticated, async (req, res) => {
    const { numcad } = req.body;

    if (!numcad) {
        return res.status(400).json({ error: 'Numero do cadastro e obrigatorio' });
    }

    try {
        const numcadEleitor = req.session.user.numcad;
        const nomeEleitor = req.session.user.nomfun;

        let jaVotou;
        try {
            jaVotou = await verificarVotoEleitor(numcadEleitor);
        } catch (error) {
            const logMessage = `[${new Date().toISOString()}] Falha ao verificar historico de voto do eleitor ${numcadEleitor}: ${error.stack || error}`;
            console.error(logMessage);

            return res.status(503).json({
                error: 'VALIDACAO_INDISPONIVEL',
                message: 'Nao foi possivel validar seu historico de voto agora. Tente novamente em instantes ou acione o suporte.'
            });
        }

        if (jaVotou) {
            return res.status(403).json({
                error: 'VOTO JA REGISTRADO',
                message: 'Voce ja registrou seu voto anteriormente. Cada eleitor pode votar apenas uma vez.',
                ja_votou: true
            });
        }

        let votoResumo = null;
        const isNullVote = numcad === 'NULO';

        await withFileLock('registro_voto', async () => {
            if (isNullVote) {
                votoResumo = await registrarVotoNulo({ useLock: false });
            } else {
                votoResumo = await registrarVotoParaCandidato(numcad, { useLock: false });
            }

            await registrarVotoEleitor(
                numcadEleitor,
                numcad,
                {
                    numcad: numcadEleitor,
                    nomfun: nomeEleitor
                },
                req.ip,
                req.get('User-Agent'),
                { useLock: false }
            );
        });

        await salvarResultados('voto_registrado', {
            numcad,
            nomfun: votoResumo?.nomfun,
            data_voto: new Date().toISOString(),
            eleitor: {
                numcad: numcadEleitor,
                nomfun: nomeEleitor
            },
            total_votos: votoResumo?.votosTotais,
            ip: req.ip,
            user_agent: req.get('User-Agent'),
            tipo: isNullVote ? 'voto_nulo' : 'voto_validado_unico'
        });

        return res.json({
            success: true,
            message: isNullVote ? 'Voto nulo registrado com sucesso!' : 'Voto registrado com sucesso! Seu voto foi contabilizado.',
            candidato_votado: votoResumo?.nomfun,
            total_votos_candidato: votoResumo?.votosTotais,
            tipo_voto: isNullVote ? 'nulo' : 'candidato'
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Erro ao registrar voto:', error);
        return res.status(500).json({ error: 'Erro ao registrar voto. Tente novamente em instantes.' });
    }
});

router.get('/api/user', isAuthenticated, (req, res) => {
    const userData = req.session.user || {};
    userData.isAdmin = !!req.session.admin;
    return res.json(userData);
});

module.exports = router;
