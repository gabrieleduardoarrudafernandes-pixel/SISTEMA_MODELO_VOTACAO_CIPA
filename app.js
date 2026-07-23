const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const { ensureDirectories } = require('./services/lgpdArchive');
const { initConnection } = require('./services/oracleService');
const { carregarCandidatos } = require('./services/candidatoService');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const votacaoRoutes = require('./routes/votacao');

// Aplicar verificação de voto em todas as rotas de votação
const aplicarVerificacaoVoto = (req, res, next) => {
    // Ignorar verificação para rotas admin e login
    if (req.path.startsWith('/admin') || req.path.startsWith('/api/admin') || req.path.startsWith('/login')) {
        return next();
    }

    // Aplicar verificação rigorosa para rotas de votação
    const numcad = req.session.user?.numcad;
    if (numcad) {
        const { checkIfUserAlreadyVoted } = require('./middlewares/votoCheckMiddleware');
        return checkIfUserAlreadyVoted(numcad, res, next);
    }

    return next();
};

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Servir fotos dos eleitores da pasta ELEITORES
app.use('/eleitores/fotos', express.static('ELEITORES'));

app.use(session({
    secret: 'sipa-votacao-2024-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 30 * 60 * 1000
    }
}));

app.get('/', (req, res) => {
    res.redirect('/votacao');
});

// Rota direta para a página de voto já registrado
app.get('/voto-ja-registrado', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'voto-já-registrado.html'));
});

app.use(authRoutes);
app.use(adminRoutes);
app.use(votacaoRoutes);

async function bootstrap() {
    try {
        await ensureDirectories(__dirname);
        await carregarCandidatos().catch(() => { });
        await initConnection();

        app.listen(PORT, () => {
            console.log('🚑 Sistema CIPA - Servidor iniciado na porta', PORT);
            console.log('Administracao: http://localhost:' + PORT + '/admin');
            console.log('Votacao: http://localhost:' + PORT + '/votacao');
        });
    } catch (error) {
        console.error('Erro na inicializacao:', error);
    }
}

bootstrap();

module.exports = app;
