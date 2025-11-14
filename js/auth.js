function renderLogin() {
    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Login</h4>
            <input id="loginUser" class="form-control mt-2" placeholder="Usuário" />
            <input id="loginPass" type="password" class="form-control mt-2" placeholder="Senha" />
            <button id="btnLogin" class="btn btn-primary w-100 mt-3">Entrar</button>
            <button id="btnGoRegister" class="btn btn-secondary w-100 mt-2">Cadastrar novo usuário</button>
            <button id="btnConfig" class="btn btn-warning w-100 mt-2">Configurações</button>
        </div>
    `);

    $("#btnLogin").on("click", handleLogin);
    $("#btnGoRegister").on("click", renderRegister);
    $("#btnConfig").on("click", renderConfig);
}

function handleLogin() {
    const username = $("#loginUser").val().trim();
    const password = $("#loginPass").val().trim();

    if (!username || !password) {
        showToast("Informe usuário e senha.", "warning");
        return;
    }

    const result = alasql("SELECT * FROM users WHERE username=? AND password=?", [
        username,
        password
    ]);

    if (result.length > 0) {
        const userId = result[0].id;
        renderClients(userId);
    } else {
        showToast("Usuário ou senha incorretos", "warning");
    }
}

function renderRegister() {
    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Novo usuário</h4>
            <input id="regUser" class="form-control mt-2" placeholder="Usuário" />
            <input id="regPass" type="password" class="form-control mt-2" placeholder="Senha" />
            <button id="btnRegister" class="btn btn-success w-100 mt-3">Cadastrar</button>
            <button id="btnBackLogin" class="btn btn-secondary w-100 mt-2">Voltar</button>
        </div>
    `);

    $("#btnRegister").on("click", handleRegister);
    $("#btnBackLogin").on("click", renderLogin);
}

function handleRegister() {
    const username = $("#regUser").val().trim();
    const password = $("#regPass").val().trim();

    if (!username || !password) {
        showToast("Preencha todos os campos.", "warning");
        return;
    }

    try {
        alasql("INSERT INTO users (username, password) VALUES (?, ?)", [
            username,
            password
        ]);

        showToast("Usuário criado com sucesso!", "success");
        renderLogin();

    } catch (err) {
        showToast("Usuário já existe.", "warning");
    }
}

function renderConfig() {
    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Configurações</h4>

            <button id="btnExport" class="btn btn-info w-100 mt-2">Exportar DB</button>

            <input id="fileUpload" class="form-control mt-3" type="file" accept="application/json" />

            <button id="btnImport" class="btn btn-warning w-100 mt-2">Importar DB</button>

            <button id="btnBack" class="btn btn-secondary w-100 mt-2">Voltar</button>
        </div>
    `);

    $("#btnExport").on("click", handleExportDB);
    $("#btnImport").on("click", handleImportDB);
    $("#btnBack").on("click", renderLogin);
}

function handleExportDB() {
    const data = exportDB();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });

    const tempLink = document.createElement("a");
    tempLink.href = URL.createObjectURL(blob);
    tempLink.download = "database.json";
    tempLink.click();
}

function handleImportDB() {
    const file = $("#fileUpload")[0].files[0];
    if (!file) {
        showToast("Selecione um arquivo.", "info");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        importDB(JSON.parse(e.target.result));
        showToast("Banco carregado!", "success");
    };

    reader.readAsText(file);
}
