const { verificarVotoEleitor } = require('../services/votoService');

function checkIfUserAlreadyVoted(req, res, next) {
    // Se já há um usuário na sessão, verificar se ele já votou
    if (!req.session.user) {
        return next();
    }

    const numcadEleitor = req.session.user.numcad;

    // Verificar se o eleitor já votou em algum candidato
    verificarVotoEleitor(numcadEleitor)
        .then(jaVotou => {
            if (jaVotou) {
                // Usuário já votou - barrar acesso para rotas de votação e APIs
                console.log(`Eleitor ${numcadEleitor} já votou em ${jaVotou.candidato_numcad}`);

                // Se for rota de votação ou API, redirecionar
                if (req.path.includes('/votacao') || req.path.includes('/api/')) {
                    return res.redirect('/voto-já-registrado.html');
                }

                return res.status(403).json({
                    success: false,
                    error: 'VOTO JÁ REGISTRADO! Você já realizou seu voto anteriormente.',
                    ja_votou: true,
                    candidato_votado: jaVotou.candidato_numcad,
                    data_voto: jaVotou.data_voto
                });
            } else {
                // Usuário ainda não votou - permitir acesso
                console.log(`Eleitor ${numcadEleitor} ainda não votou`);
                return next();
            }
        })
        .catch(error => {
            console.error('Erro ao verificar voto do eleitor:', error);
            return res.status(500).json({
                success: false,
                error: 'Erro ao verificar status de voto. Tente novamente.'
            });
        });
}

module.exports = checkIfUserAlreadyVoted;