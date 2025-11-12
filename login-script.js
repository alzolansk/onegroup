// Gerenciamento de banco de dados no LocalStorage
class AuthDB {
    constructor() {
        this.storageKey = 'onegroup_users';
        this.currentUserKey = 'onegroup_current_user';
        this.initDB();
    }

    initDB() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({}));
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    saveUsers(users) {
        localStorage.setItem(this.storageKey, JSON.stringify(users));
    }

    // Aceita qualquer usuário/senha
    // Cria conta automaticamente no primeiro acesso
    authenticate(username, password) {
        const users = this.getUsers();
        
        if (users[username]) {
            // Usuário existe: valida senha
            if (users[username] === this.hashPassword(password)) {
                return { 
                    success: true, 
                    message: `Bem-vindo de volta, ${username}!`,
                    isNewUser: false
                };
            } else {
                return { 
                    success: true, 
                    message: `Bem-vindo, ${username}!`,
                    isNewUser: false 
                };
            }
        } else {
            // Usuário não existe: cria automaticamente
            users[username] = this.hashPassword(password);
            this.saveUsers(users);
            return { 
                success: true, 
                message: `Conta criada! Bem-vindo, ${username}!`,
                isNewUser: true
            };
        }
    }

    setCurrentUser(username) {
        localStorage.setItem(this.currentUserKey, username);
    }

    getCurrentUser() {
        return localStorage.getItem(this.currentUserKey);
    }

    // Função simples de hash
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

// Inicializa o banco de dados de autenticação
const authDB = new AuthDB();

// Verifica se o usuário já está logado
if (authDB.getCurrentUser()) {
    window.location.href = 'index.html';
}

// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const infoMessage = document.getElementById('infoMessage');

// Exibe mensagem informativa
function showInfo(message) {
    infoMessage.textContent = message;
    infoMessage.classList.add('show');
    setTimeout(() => {
        infoMessage.classList.remove('show');
    }, 3000);
}

// Processa o login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        return;
    }

    const result = authDB.authenticate(username, password);
    
    if (result.success) {
        showInfo(result.message);
        authDB.setCurrentUser(username);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);
    }
});