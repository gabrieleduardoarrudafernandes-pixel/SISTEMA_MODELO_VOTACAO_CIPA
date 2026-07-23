const express = require('express');
const path = require('path');
const { salvarResultados } = require('../services/lgpdArchive');
const { logout } = require('../middlewares/authMiddleware');
const { findUserByCpf, verifyPassword } = require('../services/userService');

const router = express.Router();

router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/votacao');
    }
    return res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

router.post('/api/login', async (req, res) => {
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
        return res.status(400).json({ error: 'CPF e senha sao obrigatorios' });
    }

    const cpfLimpo = cpf.replace(/[.-]/g, '');

    try {
        const user = await findUserByCpf(cpfLimpo);

        if (!user) {
            return res.status(401).json({ error: 'CPF nao encontrado' });
        }

        const isPasswordValid = await verifyPassword(senha, user.password);

        console.log(`DEBUG: Login attempt - CPF: ${cpfLimpo}, User: ${user.numcad}, Pass provided: ${senha}, Pass stored: ${user.password ? 'exists' : 'missing'}, Valid: ${isPasswordValid}`);

        if (!isPasswordValid) {
            console.error(`DEBUG: Password validation failed for user ${user.numcad} (CPF: ${cpfLimpo})`);
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        if (user.temporaryPassword) {
            console.warn(`User ${user.numcad} logged in with temporary password. Prompt for password change.`);
        }

        // Verificar se este usuário já votou antes de criar sessão
        const { verificarVotoEleitor } = require('../services/votoService');
        try {
            const jaVotou = await verificarVotoEleitor(user.numcad);
            if (jaVotou) {
                console.warn(`Usuário ${user.numcad} já votou tentando fazer login`);
                return res.status(403).json({
                    success: false,
                    error: 'Você já realizou seu voto anteriormente. Por favor, contate a administração.',
                    ja_votou: true,
                    candidato_votado: jaVotou.candidato_numcad,
                    data_voto: jaVotou.data_voto
                });
            }
        } catch (error) {
            console.error('Erro ao verificar voto pré-login:', error);
            // Se der erro na verificação, permitir login normalmente
        }

        req.session.user = {
            numcad: user.numcad,
            numcpf: user.numcpf,
            nomfun: user.nomfun,
            // Do not store datnas directly in session if it was used as password, or ensure it's not sensitive
            loginTime: new Date()
        };

        await salvarResultados('acesso_eleitor', {
            cpf: cpfLimpo,
            numcad: user.numcad,
            nomfun: user.nomfun,
            data_acesso: new Date().toISOString(),
            ip: req.ip,
            user_agent: req.get('User-Agent')
        });

        return res.json({ success: true, message: 'Login realizado com sucesso!' });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

router.post('/api/logout', (req, res) => {
    logout(req, res, '/login');
});

module.exports = router;
