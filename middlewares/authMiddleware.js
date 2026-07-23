function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }

    // If this is an API request, return JSON error instead of redirect
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Não autenticado', redirect: '/login' });
    }

    return res.redirect('/login');
}

function isAdmin(req, res, next) {
    if (req.session.admin) {
        return next();
    }
    return res.redirect('/admin');
}

function logout(req, res, redirectTo = '/login') {
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao destruir sessao:', err);
        }
        res.redirect(redirectTo);
    });
}

module.exports = {
    isAuthenticated,
    isAdmin,
    logout
};
