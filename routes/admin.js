const express = require('express');
const path = require('path');
const { isAdmin } = require('../middlewares/authMiddleware');
const {
    carregarCandidatos,
    adicionarCandidato,
    excluirCandidato,
    salvarCandidatos
} = require('../services/candidatoService');
const { salvarResultados } = require('../services/lgpdArchive');
const {
    getConnection,
    buscarColaboradoresPorPrefixo,
    fetchColaboradorDetalhado
} = require('../services/oracleService');

const router = express.Router();

router.get('/admin', (req, res) => {
    if (req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    return res.sendFile(path.join(__dirname, '..', 'public', 'admin-login.html'));
});

router.post('/api/admin-login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin') {
        req.session.admin = {
            username: 'admin',
            name: 'Administrador CIPA',
            role: 'admin',
            loginTime: new Date()
        };
        return res.json({ success: true, message: 'Login administrativo realizado com sucesso!' });
    }

    return res.status(401).json({ error: 'Credenciais administrativas invalidas' });
});

router.post('/api/admin/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir sessao admin:', err);
        }
        res.json({ success: true });
    });
});

router.get('/admin/dashboard', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin-dashboard-enhanced.html'));
});

router.get('/admin/estatisticas', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin-dashboard.html'));
});

router.get('/api/admin/resultados', isAdmin, async (req, res) => {
    try {
        const candidatos = await carregarCandidatos();
        const resultados = candidatos
            .filter(c => c.ativo === 'S' && c.voto > 0)
            .sort((a, b) => b.voto - a.voto);

        return res.json(resultados);
    } catch (error) {
        console.error('Erro ao carregar resultados admin:', error);
        return res.status(500).json({ error: 'Erro ao carregar resultados' });
    }
});

router.get('/api/eleitores', isAdmin, async (req, res) => {
    try {
        const { tipo } = req.query;
        const connection = getConnection();
        let eleitores = (await carregarCandidatos()).filter(c => c.ativo === 'S');

        if (connection) {
            try {
                const enriched = await Promise.all(
                    eleitores.map(async eleitor => {
                        try {
                            const colaborador = await fetchColaboradorDetalhado(eleitor.numcad);
                            if (colaborador) {
                                return {
                                    numcad: colaborador.NUMCAD,
                                    numcpf: colaborador.NUMCPF,
                                    nomfun: colaborador.NOMFUN,
                                    datnas: colaborador.DATNAS,
                                    codcar: colaborador.CODCAR,
                                    titcar: colaborador.TITCAR,
                                    datadm: colaborador.DATADM,
                                    salario: null,
                                    ...eleitor
                                };
                            }
                            return eleitor;
                        } catch (error) {
                            console.error('Erro ao buscar dados do eleitor:', eleitor.numcad, error);
                            return eleitor;
                        }
                    })
                );
                eleitores = enriched;
            } catch (error) {
                console.error('Erro ao enriquecer dados dos eleitores:', error);
            }
        }

        if (tipo === 'parcial') {
            eleitores = eleitores.filter(e => !e.numcpf || !e.datnas);
        } else if (tipo === 'completo') {
            eleitores = eleitores.filter(e => e.numcpf && e.datnas);
        }

        return res.json(eleitores);
    } catch (error) {
        console.error('Erro ao carregar eleitores:', error);
        return res.status(500).json({ error: 'Erro ao carregar eleitores' });
    }
});

router.get('/api/admin/candidates', isAdmin, async (req, res) => {
    try {
        const candidatos = await carregarCandidatos();
        return res.json(candidatos);
    } catch (error) {
        console.error('Erro ao buscar candidatos:', error);
        return res.status(500).json({ error: 'Erro ao buscar candidatos' });
    }
});

// Rota para buscar eleitores que já votaram
router.get('/api/admin/voters', isAdmin, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const votosFilePath = path.join(__dirname, '..', 'dados', 'votos_registrados.json');

        let votosRegistrados = [];
        try {
            const data = await fs.readFile(votosFilePath, 'utf8');
            votosRegistrados = JSON.parse(data);
        } catch (err) {
            // Arquivo não existe ou está vazio
            votosRegistrados = [];
        }

        // Buscar nome do candidato votado para cada eleitor
        const candidatos = await carregarCandidatos();
        const candidatosMap = new Map(candidatos.map(c => [String(c.numcad), c.nomfun]));

        const eleitoresQueVotaram = votosRegistrados.map(voto => ({
            numcad: voto.eleitor_numcad,
            nomfun: voto.eleitor_dados?.nomfun || 'Nome não disponível',
            data_voto: voto.data_voto,
            candidato_votado: candidatosMap.get(String(voto.candidato_numcad)) || voto.candidato_numcad,
            ip: voto.ip
        }));

        return res.json(eleitoresQueVotaram);
    } catch (error) {
        console.error('Erro ao buscar eleitores que votaram:', error);
        return res.status(500).json({ error: 'Erro ao buscar eleitores que votaram' });
    }
});

router.get('/api/search-collaborators', isAdmin, async (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 3) {
        return res.json([]);
    }

    try {
        const candidatos = await carregarCandidatos();
        const cadastrados = new Set(candidatos.map(c => c.numcad));
        const colaboradores = await buscarColaboradoresPorPrefixo(q, cadastrados);
        return res.json(colaboradores);
    } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
        return res.status(500).json({ error: 'Erro ao buscar colaboradores' });
    }
});

router.post('/api/admin/candidates', isAdmin, async (req, res) => {
    try {
        const novoCandidato = await adicionarCandidato(req.body);

        await salvarResultados('candidato_cadastrado', {
            ...novoCandidato,
            admin: req.session.admin?.username,
            ip: req.ip,
            user_agent: req.get('User-Agent')
        });

        return res.json({ success: true, message: 'Candidato cadastrado com sucesso!' });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Erro ao cadastrar candidato:', error);
        return res.status(500).json({ error: 'Erro ao cadastrar candidato' });
    }
});

router.delete('/api/admin/candidates/:numcad', isAdmin, async (req, res) => {
    const { numcad } = req.params;

    try {
        const candidatoExcluido = await excluirCandidato(numcad);

        await salvarResultados('candidato_excluido', {
            ...candidatoExcluido,
            admin: req.session.admin?.username,
            data_exclusao: new Date().toISOString(),
            ip: req.ip,
            user_agent: req.get('User-Agent')
        });

        return res.json({
            success: true,
            message: `Candidato ${candidatoExcluido.nomfun} excluido com sucesso!`,
            candidato_excluido: {
                numcad: candidatoExcluido.numcad,
                nomfun: candidatoExcluido.nomfun,
                voto: candidatoExcluido.voto
            }
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Erro ao excluir candidato:', error);
        return res.status(500).json({ error: 'Erro ao excluir candidato' });
    }
});

router.get('/api/exportar/resultados', isAdmin, async (req, res) => {
    try {
        const candidatos = await carregarCandidatos();
        const candidatosAtivos = candidatos.filter(c => c.ativo === 'S');

        // Separate null votes from regular candidates
        const votosNulos = candidatosAtivos.filter(c => c.numcad === 'NULO');
        const candidatosRegulares = candidatosAtivos.filter(c => c.numcad !== 'NULO');
        const totalVotosNulos = votosNulos.reduce((sum, c) => sum + c.voto, 0);
        const totalVotosValidos = candidatosRegulares.reduce((sum, c) => sum + c.voto, 0);

        const exportacao = {
            data_exportacao: new Date().toISOString(),
            sistema: 'CIPA-Votacao',
            versao: '1.0.0',
            administrador: req.session.admin?.username,
            resumo: {
                total_candidatos: candidatos.length,
                candidatos_ativos: candidatosAtivos.length,
                candidatos_regulares: candidatosRegulares.length,
                total_votos: candidatosAtivos.reduce((sum, c) => sum + c.voto, 0),
                votos_validos: totalVotosValidos,
                votos_nulos: totalVotosNulos,
                percentual_nulos: totalVotosNulos > 0 ? ((totalVotosNulos / (totalVotosValidos + totalVotosNulos)) * 100).toFixed(2) + '%' : '0%'
            },
            candidatos: candidatosAtivos.sort((a, b) => {
                // Put null votes at the end
                if (a.numcad === 'NULO') return 1;
                if (b.numcad === 'NULO') return -1;
                return b.voto - a.voto;
            }).map(c => ({
                ...c,
                tipo: c.numcad === 'NULO' ? 'Voto Nulo' : 'Candidato Regular'
            })),
            metadata: {
                compliance: 'LGPD',
                periodo: new Date().toISOString().split('T')[0],
                formato: 'JSON',
                inclui_votos_nulos: true
            }
        };

        await salvarResultados('exportacao_completa', exportacao);
        return res.json(exportacao);
    } catch (error) {
        console.error('Erro ao exportar resultados:', error);
        return res.status(500).json({ error: 'Erro ao exportar resultados' });
    }
});

router.post('/api/limpar/dados', isAdmin, async (req, res) => {
    const { confirmacao } = req.body;

    if (confirmacao !== 'LIMPAR_TUDO_COM_CUIDADO') {
        return res.status(400).json({ error: 'Confirmacao invalida' });
    }

    try {
        const candidatos = await carregarCandidatos({ waitForQueue: false });
        await salvarResultados('backup_antes_limpar', {
            backup: candidatos,
            data_limpeza: new Date().toISOString(),
            motivo: 'Limpeza manual pelo administrador'
        });

        await salvarCandidatos([], { useLock: false });
        return res.json({ success: true, message: 'Dados limpos com sucesso!' });
    } catch (error) {
        console.error('Erro ao limpar dados:', error);
        return res.status(500).json({ error: 'Erro ao limpar dados' });
    }
});

module.exports = router;
