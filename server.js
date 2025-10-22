require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./database.js');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid'); // Para gerar IDs de sessão únicos

// Cria a tabela de estatísticas diárias se ela não existir
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS user_stats_daily (
        user_id INTEGER NOT NULL,
        object_name TEXT NOT NULL,
        detection_date DATE NOT NULL,
        detection_count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, object_name, detection_date),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);
});
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        activity TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);
});
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);
});
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        PRIMARY KEY (user_id, key),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);
});
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS alert_log (
        user_id INTEGER NOT NULL,
        object_name TEXT NOT NULL,
        last_alerted_at DATETIME NOT NULL,
        PRIMARY KEY (user_id, object_name),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);
});

// Função auxiliar para adicionar coluna se não existir
function addColumnIfNotExists(table, column, type) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error(`Erro ao adicionar coluna ${column}:`, err.message);
        }
    });
}

// Adiciona colunas para recuperação de senha, se não existirem
addColumnIfNotExists('users', 'reset_token', 'TEXT');
addColumnIfNotExists('users', 'reset_token_expires', 'INTEGER');
// Adiciona colunas para 2FA, se não existirem
addColumnIfNotExists('users', 'two_fa_secret', 'TEXT');
addColumnIfNotExists('users', 'two_fa_enabled', 'INTEGER DEFAULT 0');


const app = express();
const port = 3000;
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'); // Use uma chave secreta forte no .env

// Função auxiliar para registrar atividades
function logActivity(userId, activity) {
    db.run('INSERT INTO activity_log (user_id, activity) VALUES (?, ?)', [userId, activity]);
}

// --- Configuração do Passport.js para Google ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (!email) {
        return done(new Error('Não foi possível obter e-mail do Google.'), null);
    }
    try {
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
        });

        if (user) return done(null, user); // user object from DB already has subscription_status

        const randomPassword = await bcrypt.hash(Math.random().toString(36), saltRounds);
        const newUserId = await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, randomPassword], function(err) {
                err ? reject(err) : resolve(this.lastID);
            });
        });
        const newUser = { id: newUserId, email: email, subscription_status: 'free' };
        return done(null, newUser);
    } catch (err) {
        return done(err, null);
    }
}));

// --- Configuração do Passport.js para GitHub ---
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/auth/github/callback",
    scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (!email) {
        // Este erro será capturado pelo `failureRedirect` na rota de autenticação.
        return done(null, false, { message: 'Email do GitHub não é público.' });
    }
    try {
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
        });

        if (user) return done(null, user); // user object from DB already has subscription_status

        const randomPassword = await bcrypt.hash(Math.random().toString(36), saltRounds);
        const newUserId = await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, randomPassword], function(err) {
                err ? reject(err) : resolve(this.lastID);
            });
        });
        const newUser = { id: newUserId, email: email, subscription_status: 'free' };
        return done(null, newUser);
    } catch (err) {
        return done(err, null);
    }
}));

// Middlewares para processar JSON e dados de formulário
app.use(express.json());
app.use(cors()); // Habilita o CORS para todas as rotas
app.use(express.urlencoded({ extended: true }));

// Configura o Express para servir arquivos estáticos da pasta raiz do projeto
app.use(express.static(__dirname));

// Rota para registrar um novo usuário
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!email || !password || !name || !phone) {
            return res.status(400).json({ message: 'Nome, email, telefone e senha são obrigatórios.' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = 'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)';
        db.run(sql, [name, email, phone, hashedPassword], function(err) {
            if (err) {
                logActivity(this.lastID, 'Criação de conta');
                // Trata o erro de email duplicado (UNIQUE constraint)
                return res.status(400).json({ message: 'Este email já está cadastrado.' });
            }
            res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: this.lastID });
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar registrar.' });
    }
});

// Rota para fazer login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
        }

        const sql = 'SELECT * FROM users WHERE email = ?';

        // Envolve a chamada ao banco de dados em uma Promise para usar await
        const user = await new Promise((resolve, reject) => {
            db.get(sql, [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(401).json({ message: 'Email ou senha inválidos.' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Se 2FA estiver habilitado, não loga ainda, pede o token.
            if (user.two_fa_enabled) {
                logActivity(user.id, 'Tentativa de login (2FA solicitado)');
                res.json({ message: 'Verificação de dois fatores necessária.', two_fa_required: true, userId: user.id });
            } else {
                // Login bem-sucedido, cria a sessão
                logActivity(user.id, 'Login bem-sucedido');
                const sessionId = uuidv4();
                const userAgent = req.headers['user-agent'];
                const ipAddress = req.ip;

                db.run('INSERT INTO user_sessions (session_id, user_id, user_agent, ip_address) VALUES (?, ?, ?, ?)', 
                    [sessionId, user.id, userAgent, ipAddress]);

                const token = jwt.sign({ 
                    sessionId: sessionId, 
                    userId: user.id, 
                    email: user.email, 
                    subscription_status: user.subscription_status 
                }, JWT_SECRET, { expiresIn: '30d' });
                res.json({ message: 'Login bem-sucedido!', token: token });
            }
        } else {
            res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar fazer login.' });
    }
});

// Rota para validar o token 2FA durante o login
app.post('/api/login/2fa', async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_fa_secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (verified) {
            // Token válido, login completo.
            const sessionId = uuidv4();
            const userAgent = req.headers['user-agent'];
            const ipAddress = req.ip;
            db.run('INSERT INTO user_sessions (session_id, user_id, user_agent, ip_address) VALUES (?, ?, ?, ?)', 
                [sessionId, user.id, userAgent, ipAddress]);

            logActivity(userId, 'Login bem-sucedido (2FA)');
            const token = jwt.sign({ 
                sessionId: sessionId, userId: user.id, email: user.email, subscription_status: user.subscription_status 
            }, JWT_SECRET, { expiresIn: '30d' });

            res.json({ message: 'Login bem-sucedido!', token: token });
        } else {
            // Token inválido.
            res.status(401).json({ message: 'Código de verificação inválido.' });
        }
    } catch (error) {
        console.error('Erro na verificação 2FA:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Rota de Logout
app.post('/api/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(204); // No content

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        db.run('DELETE FROM user_sessions WHERE session_id = ?', [payload.sessionId], (err) => {
            if (err) {
                return res.status(500).json({ message: 'Erro ao fazer logout.' });
            }
            logActivity(payload.userId, 'Logout');
            res.json({ message: 'Logout bem-sucedido.' });
        });
    } catch (e) {
        // Token inválido ou expirado, mas o logout do cliente pode prosseguir
        res.sendStatus(204);
    }
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, async (err, userPayload) => {
        if (err) {
            return res.sendStatus(403); // Forbidden (token inválido ou expirado)
        }

        // Verifica se a sessão ainda é válida no banco de dados
        const session = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM user_sessions WHERE session_id = ?', [userPayload.sessionId], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!session) {
            return res.sendStatus(401); // Unauthorized (sessão revogada)
        }

        req.user = userPayload; // Adiciona o payload do usuário ao objeto req
        next();
    });
};

// Rota para alterar a senha
app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        // 1. Buscar o usuário no banco de dados
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 2. Verificar se a senha atual está correta
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({ message: 'A senha atual está incorreta.' });
        }

        // 3. Criptografar e atualizar a nova senha
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
        db.run('UPDATE users SET password = ? WHERE id = ?', [newHashedPassword, userId], function(err) {
            if (err) {
                console.error('Erro ao atualizar a senha:', err);
                return res.status(500).json({ message: 'Erro interno ao atualizar a senha.' });
            }
            logActivity(userId, 'Senha alterada');
            res.json({ message: 'Senha alterada com sucesso!' });
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Rota para solicitar recuperação de senha
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!user) {
            // Responde com sucesso mesmo se o email não existir para não revelar quais emails estão cadastrados
            return res.json({ message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.' });
        }

        // Gerar token
        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 3600000; // 1 hora

        // Salvar token no banco de dados
        db.run('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [token, expires, user.id]);

        // Configurar Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Enviar e-mail
        const resetURL = `http://localhost:${port}/reset-password.html?token=${token}`;
        await transporter.sendMail({
            from: `"Detecção de Objetos" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Recuperação de Senha',
            html: `
                <p>Você solicitou a redefinição de senha.</p>
                <p>Clique neste <a href="${resetURL}">link</a> para redefinir sua senha.</p>
                <p>O link é válido por 1 hora.</p>
                <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
            `,
        });

        res.json({ message: 'Se um usuário com este e-mail existir, um link de recuperação será enviado.' });

    } catch (error) {
        console.error('Erro na recuperação de senha:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Rota para redefinir a senha com o token
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?', [token, Date.now()], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
        db.run('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [newHashedPassword, user.id]);

        res.json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Rota para sincronizar as estatísticas de detecção
app.post('/api/stats/sync', authenticateToken, async (req, res) => {
    const { stats } = req.body;
    const userId = req.user.userId;

    if (!userId || !stats) {
        return res.status(400).json({ message: 'Dados insuficientes para sincronização.' });
    }

    // O 'stats' vem como um objeto { "objeto": contagem }. Ex: { "person": 10, "car": 5 }
    const statsArray = Object.entries(stats);

    if (statsArray.length === 0) {
        return res.json({ message: 'Nenhuma estatística para sincronizar.' });
    }

    db.serialize(() => {
        const today = new Date().toISOString().slice(0, 10); // Formato YYYY-MM-DD
        const stmt = db.prepare(`
            INSERT INTO user_stats_daily (user_id, object_name, detection_date, detection_count)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, object_name, detection_date) DO UPDATE SET
            detection_count = detection_count + excluded.detection_count;
        `);

        statsArray.forEach(([objectName, count]) => {
            stmt.run(userId, objectName, today, count);
        });

        stmt.finalize((err) => {
            if (err) {
                console.error('Erro ao sincronizar estatísticas:', err);
                return res.status(500).json({ message: 'Erro ao salvar estatísticas.' });
            }
            res.json({ message: 'Estatísticas sincronizadas com sucesso.' });
        });
    });
});

// Rota para buscar as estatísticas de um usuário
app.get('/api/stats', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { period } = req.query; // '7', '30', ou 'all'

    let dateFilter = '';
    if (period === '7') {
        dateFilter = `AND detection_date >= date('now', '-7 days')`;
    } else if (period === '30') {
        dateFilter = `AND detection_date >= date('now', '-30 days')`;
    }

    // Agrupa os resultados por nome de objeto, somando as contagens do período
    const sql = `
        SELECT object_name, SUM(detection_count) as total_count
        FROM user_stats_daily
        WHERE user_id = ? ${dateFilter}
        GROUP BY object_name
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar estatísticas:', err);
            return res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
        }
        res.json(rows);
    });
});

// Rota para buscar o log de atividades de um usuário
app.get('/api/activity-log', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Itens por página
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    const searchPattern = `%${searchTerm}%`;

    const countSql = 'SELECT COUNT(*) as count FROM activity_log WHERE user_id = ? AND activity LIKE ?';
    const logsSql = 'SELECT activity, timestamp FROM activity_log WHERE user_id = ? AND activity LIKE ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';

    // Usar Promise.all para executar as duas consultas em paralelo
    try {
        const totalResult = await new Promise((resolve, reject) => {
            db.get(countSql, [userId, searchPattern], (err, row) => err ? reject(err) : resolve(row));
        });
        const totalLogs = totalResult.count;
        const totalPages = Math.ceil(totalLogs / limit);

        const logs = await new Promise((resolve, reject) => {
            db.all(logsSql, [userId, searchPattern, limit, offset], (err, rows) => err ? reject(err) : resolve(rows));
        });

        res.json({
            logs,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Erro ao buscar log de atividades:', error);
        res.status(500).json({ message: 'Erro ao buscar log de atividades.' });
    }
});



// Rota para "assinar"
app.post('/api/subscribe', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    if (!userId) {
        return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    const sql = `UPDATE users SET subscription_status = 'premium' WHERE id = ?`;
    db.run(sql, [userId], function(err) {
        if (err) {
            console.error('Erro ao atualizar assinatura:', err);
            return res.status(500).json({ message: 'Erro interno ao processar a assinatura.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json({ message: 'Assinatura atualizada com sucesso!', subscription_status: 'premium' });
    });
});

// Rota para deletar a conta do usuário
app.post('/api/delete-account', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.userId;

        if (!userId || !password) {
            return res.status(400).json({ message: 'ID do usuário e senha são obrigatórios.' });
        }

        // 1. Buscar o usuário para verificar a senha
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // 2. Verificar se a senha fornecida está correta
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Senha incorreta. A exclusão foi cancelada.' });
        }

        // 3. Deletar o usuário do banco de dados
        // A tabela user_stats será limpa automaticamente por causa do "ON DELETE CASCADE"
        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) {
                console.error('Erro ao deletar usuário:', err);
                return res.status(500).json({ message: 'Erro interno ao tentar deletar a conta.' });
            }
            res.json({ message: 'Conta deletada com sucesso. Você será redirecionado.' });
        });
    } catch (error) {
        console.error('Erro ao deletar conta:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// --- Rotas de Autenticação de Dois Fatores (2FA) ---

// 1. Rota para iniciar a configuração do 2FA
app.post('/api/2fa/setup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const secret = speakeasy.generateSecret({
            name: `Detecção de Objetos (${userId})`
        });

        // Salva o segredo (ainda não habilitado) no banco de dados
        db.run('UPDATE users SET two_fa_secret = ? WHERE id = ?', [secret.base32, userId]);

        // Gera o QR Code
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                throw err;
            }
            res.json({
                secret: secret.base32,
                qrCodeUrl: data_url
            });
        });
    } catch (error) {
        console.error('Erro na configuração do 2FA:', error);
        res.status(500).json({ message: 'Erro ao gerar segredo 2FA.' });
    }
});

// 2. Rota para verificar o token e habilitar o 2FA
app.post('/api/2fa/verify', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.userId;
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT two_fa_secret FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!user || !user.two_fa_secret) {
            return res.status(400).json({ message: 'A configuração do 2FA não foi iniciada.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_fa_secret,
            encoding: 'base32',
            token: token,
            window: 1 // Permite uma pequena variação de tempo
        });

        if (verified) {
            // Token correto, habilita o 2FA para o usuário
            logActivity(userId, '2FA ativado');
            db.run('UPDATE users SET two_fa_enabled = 1 WHERE id = ?', [userId]);
            res.json({ message: 'Autenticação de dois fatores habilitada com sucesso!' });
        } else {
            res.status(400).json({ message: 'Código de verificação inválido. Tente novamente.' });
        }
    } catch (error) {
        console.error('Erro ao verificar 2FA:', error);
        res.status(500).json({ message: 'Erro interno ao verificar o código.' });
    }
});

// 3. Rota para desabilitar o 2FA
app.post('/api/2fa/disable', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.userId;
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT password FROM users WHERE id = ?', [userId], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        // Senha correta, desabilita o 2FA
        logActivity(userId, '2FA desativado');
        db.run('UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = ?', [userId]);
        res.json({ message: 'Autenticação de dois fatores desabilitada com sucesso.' });
    } catch (error) {
        console.error('Erro ao desabilitar 2FA:', error);
        res.status(500).json({ message: 'Erro interno ao desabilitar 2FA.' });
    }
});

// --- Rotas de Gerenciamento de Sessão ---

// Rota para listar sessões ativas
app.get('/api/sessions', authenticateToken, (req, res) => {
    db.all('SELECT session_id, user_agent, ip_address, created_at FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC', [req.user.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar sessões.' });
        }
        // Adiciona um campo para identificar a sessão atual
        const sessions = rows.map(session => ({
            ...session,
            isCurrent: session.session_id === req.user.sessionId
        }));
        res.json(sessions);
    });
});

// Rota para revogar uma sessão
app.delete('/api/sessions/:sessionId', authenticateToken, (req, res) => {
    const { sessionId } = req.params;

    // Impede o usuário de revogar a sessão atual por esta rota
    if (sessionId === req.user.sessionId) {
        return res.status(400).json({ message: 'Não é possível revogar a sessão atual. Use a função de logout.' });
    }

    // Deleta a sessão, garantindo que o usuário só pode deletar suas próprias sessões
    db.run('DELETE FROM user_sessions WHERE session_id = ? AND user_id = ?', [sessionId, req.user.userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao revogar sessão.' });
        }
        logActivity(req.user.userId, `Sessão revogada: ${sessionId.substring(0, 8)}...`);
        res.json({ message: 'Sessão revogada com sucesso.' });
    });
});

// --- Rotas de Configurações de Relatórios e Alertas ---

// Rota para buscar as configurações do usuário
app.get('/api/settings', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    db.all('SELECT key, value FROM user_settings WHERE user_id = ?', [userId], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar configurações:', err);
            return res.status(500).json({ message: 'Erro ao buscar configurações.' });
        }
        res.json(rows);
    });
});

// Rota para salvar/atualizar uma configuração
app.post('/api/settings', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const { key, value } = req.body;

    const sql = `
        INSERT INTO user_settings (user_id, key, value) VALUES (?, ?, ?)
        ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value;
    `;

    db.run(sql, [userId, key, value], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao salvar configuração.' });
        }
        res.json({ message: 'Configuração salva com sucesso!' });
    });
});

// --- Rota para Alertas em Tempo Real ---

app.post('/api/trigger-alert', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { objectName } = req.body; // Ex: "Pessoa"

    if (!objectName) {
        return res.status(400).json({ message: 'Nome do objeto é obrigatório.' });
    }

    try {
        // 1. Verificar se o usuário tem alertas configurados para este objeto
        const settings = await new Promise((resolve, reject) => {
            db.get("SELECT value FROM user_settings WHERE user_id = ? AND key = 'alert_objects'", [userId], (err, row) => err ? reject(err) : resolve(row));
        });

        if (!settings || !settings.value) {
            return res.status(200).json({ message: 'Nenhum alerta configurado.' });
        }

        const monitoredObjects = settings.value.toLowerCase().split(',').map(s => s.trim());
        if (!monitoredObjects.includes(objectName.toLowerCase())) {
            return res.status(200).json({ message: 'Objeto não está na lista de monitoramento.' });
        }

        // 2. Verificar o cooldown no banco de dados
        const cooldownMinutes = 10; // Cooldown de 10 minutos
        const lastAlert = await new Promise((resolve, reject) => {
            db.get("SELECT last_alerted_at FROM alert_log WHERE user_id = ? AND object_name = ?", [userId, objectName], (err, row) => err ? reject(err) : resolve(row));
        });

        if (lastAlert) {
            const minutesSinceLastAlert = (new Date() - new Date(lastAlert.last_alerted_at)) / 60000;
            if (minutesSinceLastAlert < cooldownMinutes) {
                return res.status(200).json({ message: 'Alerta em cooldown.' });
            }
        }

        // 3. Enviar e-mail de alerta
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT, secure: process.env.EMAIL_PORT == 465,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});


        await transporter.sendMail({
            from: `"Alerta de Detecção" <${process.env.EMAIL_USER}>`,
            to: req.user.email,
            subject: `Alerta: Objeto Detectado - ${objectName}`,
            html: `
                <p>Olá,</p>
                <p>Detectamos um objeto de seu interesse: <strong>${objectName}</strong>.</p>
                <p>A detecção ocorreu em ${new Date().toLocaleString('pt-BR')}.</p>
                <p>Acesse o sistema para mais detalhes.</p>
            `,
        });

        // 4. Atualizar o log de alertas
        const upsertSql = `INSERT INTO alert_log (user_id, object_name, last_alerted_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, object_name) DO UPDATE SET last_alerted_at = CURRENT_TIMESTAMP;`;
        db.run(upsertSql, [userId, objectName]);

        res.json({ message: 'Alerta enviado com sucesso.' });
    } catch (error) {
        console.error('Erro ao processar alerta:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// --- Sistema de Envio de Relatórios Agendados ---

/**
 * Gera o corpo HTML de um e-mail de relatório com base nas estatísticas.
 * @param {string} period - O período do relatório (ex: "Semanal").
 * @param {Array} stats - Array de objetos com { object_name, total_count }.
 * @returns {string} - O corpo do e-mail em HTML.
 */
function generateReportHTML(period, stats) {
    const totalDetections = stats.reduce((sum, item) => sum + item.total_count, 0);
    const topObject = stats.length > 0 ? stats.sort((a, b) => b.total_count - a.total_count)[0] : null;

    let tableRows = stats.map(item => `
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.object_name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.total_count}</td>
        </tr>
    `).join('');

    if (stats.length === 0) {
        tableRows = '<tr><td colspan="2" style="padding: 8px; text-align: center;">Nenhuma detecção registrada neste período.</td></tr>';
    }

    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #6a82fb;">Seu Relatório ${period} de Detecção de Objetos</h2>
            <p>Olá,</p>
            <p>Aqui está um resumo das atividades de detecção em sua conta durante a última semana.</p>
            <h3 style="color: #444;">Resumo Geral</h3>
            <ul>
                <li><strong>Total de Detecções:</strong> ${totalDetections}</li>
                <li><strong>Objeto Mais Detectado:</strong> ${topObject ? `${topObject.object_name} (${topObject.total_count} vezes)` : 'N/A'}</li>
            </ul>
            <h3 style="color: #444;">Detalhes por Objeto</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Objeto</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Nº de Detecções</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <p style="margin-top: 20px;">Para mais detalhes, acesse seu <a href="http://localhost:${port}/perfil.html">painel de perfil</a>.</p>
            <p>Atenciosamente,<br>Equipe de Detecção de Objetos</p>
        </div>
    `;
}

/**
 * Busca usuários, coleta dados e envia os relatórios.
 * @param {string} frequency - 'weekly' ou 'monthly'.
 * @param {string} dateFilter - Filtro SQL para o período.
 */
async function sendScheduledReports(frequency, dateFilter) {
    const users = await new Promise((resolve, reject) => {
        const sql = `SELECT u.id, u.email FROM users u JOIN user_settings s ON u.id = s.user_id WHERE s.key = 'report_frequency' AND s.value = ?`;
        db.all(sql, [frequency], (err, rows) => err ? reject(err) : resolve(rows));
    });

    for (const user of users) {
        const statsSql = `SELECT object_name, SUM(detection_count) as total_count FROM user_stats_daily WHERE user_id = ? ${dateFilter} GROUP BY object_name`;
        const stats = await new Promise((resolve, reject) => {
            db.all(statsSql, [user.id], (err, rows) => err ? reject(err) : resolve(rows));
        });

        const reportHtml = generateReportHTML(frequency === 'weekly' ? 'Semanal' : 'Mensal', stats);
        
       

        await transporter.sendMail({
            from: `"Detecção de Objetos" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: `Seu Relatório ${frequency === 'weekly' ? 'Semanal' : 'Mensal'} de Detecção`,
            html: reportHtml,
        });
        console.log(`Relatório de ${frequency} enviado para ${user.email}`);
    }
}

// Agenda o envio de relatórios: todo domingo às 8h (semanal) e todo dia 1º às 8h (mensal)
cron.schedule('0 8 * * 0', () => sendScheduledReports('weekly', `AND detection_date >= date('now', '-7 days')`), { timezone: "America/Sao_Paulo" });
cron.schedule('0 8 1 * *', () => sendScheduledReports('monthly', `AND detection_date >= date('now', '-1 month')`), { timezone: "America/Sao_Paulo" });

// --- Rotas de Autenticação do Google ---

// 1. Rota para iniciar o processo de login com Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// 2. Rota de callback que o Google chama após o login
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login.html', session: false }),
  (req, res) => { // req.user contém o usuário do banco de dados
    // Gera uma sessão e um token JWT, assim como no login normal
    const sessionId = uuidv4();
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    db.run('INSERT INTO user_sessions (session_id, user_id, user_agent, ip_address) VALUES (?, ?, ?, ?)', 
        [sessionId, req.user.id, userAgent, ipAddress]);

    const token = jwt.sign({ 
        sessionId: sessionId, 
        userId: req.user.id, 
        email: req.user.email, 
        subscription_status: req.user.subscription_status 
    }, JWT_SECRET, { expiresIn: '30d' });

    // Redireciona para a página de callback com o token
    res.redirect(`/auth-callback.html?token=${token}`);
  });

// --- Rotas de Autenticação do GitHub ---

// 1. Rota para iniciar o processo de login com GitHub
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }));

// 2. Rota de callback que o GitHub chama após o login
app.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login.html?error=github_email_error', session: false }),
  (req, res) => {
    const sessionId = uuidv4();
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;
    db.run('INSERT INTO user_sessions (session_id, user_id, user_agent, ip_address) VALUES (?, ?, ?, ?)', 
        [sessionId, req.user.id, userAgent, ipAddress]);
    const token = jwt.sign({ sessionId: sessionId, userId: req.user.id, email: req.user.email, subscription_status: req.user.subscription_status }, JWT_SECRET, { expiresIn: '30d' });
    res.redirect(`/auth-callback.html?token=${token}`);
  });

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
