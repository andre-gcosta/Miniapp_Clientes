function createSchema() {
    alasql(`
        CREATE TABLE IF NOT EXISTS users (
            id INT IDENTITY,
            username STRING UNIQUE,
            password STRING
        )
    `);

    alasql(`
        CREATE TABLE IF NOT EXISTS clients (
            id INT IDENTITY,
            user_id INT,
            nome STRING,
            cpf STRING UNIQUE,
            nascimento STRING,
            telefone STRING,
            celular STRING
        )
    `);

    alasql(`
        CREATE TABLE IF NOT EXISTS addresses (
            id INT IDENTITY,
            user_id INT,
            cliente_id INT,
            cep STRING,
            rua STRING,
            bairro STRING,
            cidade STRING,
            estado STRING,
            pais STRING,
            principal BOOLEAN
        )
    `);
}

function initDB() {
    createSchema();

    const res = alasql("SELECT COUNT(*) FROM users");
    const userCount = res[0]["COUNT(*)"];

    if (userCount === 0) {
        alasql("INSERT INTO users (username, password) VALUES (?, ?)", [
            "admin",
            "admin"
        ]);
    }
}

function exportDB() {
    return {
        users: alasql("SELECT * FROM users"),
        clients: alasql("SELECT * FROM clients"),
        addresses: alasql("SELECT * FROM addresses")
    };
}

function importDB(data) {
    if (!data || !data.users || !data.clients || !data.addresses) {
        showToast("Arquivo inválido ou corrompido.", "danger");
        return;
    }

    try {
        alasql("DROP TABLE IF EXISTS addresses");
        alasql("DROP TABLE IF EXISTS clients");
        alasql("DROP TABLE IF EXISTS users");
    } catch (err) {
        console.warn("Erro ao dropar tabelas (pode ser que não existam):", err);
    }

    createSchema();

    data.users.forEach(u => {
        alasql(
            "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
            [u.id, u.username, u.password]
        );
    });

    data.clients.forEach(c => {
        alasql(
            "INSERT INTO clients (id, user_id, nome, cpf, nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [c.id, c.user_id || 1, c.nome, c.cpf, c.nascimento, c.telefone, c.celular]
        );
    });

    const validClientIds = new Set(data.clients.map(c => c.id));

    data.addresses.forEach(a => {
        if (!validClientIds.has(a.cliente_id)) {
            console.warn("Ignorando endereço com cliente inexistente:", a);
            return;
        }

        alasql(
            "INSERT INTO addresses (id, user_id, cliente_id, cep, rua, bairro, cidade, estado, pais, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                a.id,
                a.user_id || 1,
                a.cliente_id,
                a.cep,
                a.rua,
                a.bairro,
                a.cidade,
                a.estado,
                a.pais,
                a.principal
            ]
        );
    });

    resetIdentity("users");
    resetIdentity("clients");
    resetIdentity("addresses");

    showToast("Banco importado com sucesso!", "success");
}

function resetIdentity(table) {
    const maxId = alasql(`SELECT MAX(id) FROM ${table}`)[0]["MAX(id)"] || 0;
    alasql.tables[table].ident = maxId + 1;
}
