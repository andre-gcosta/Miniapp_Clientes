function renderClients(userId) { 
    const clients = alasql("SELECT * FROM clients WHERE user_id = ?", [userId]);

    const rowsHtml = clients.map(client => `
        <tr>
            <td class="text-break">${client.nome}</td>
            <td class="text-break">${formatCPF(client.cpf)}</td>
            <td>
                <div class="d-flex flex-column flex-sm-row gap-1">
                    <button class="btn btn-primary btn-sm btn-open-address" data-id="${client.id}">
                        Endereços
                    </button>
                    <button class="btn btn-warning btn-sm btn-edit-client" data-id="${client.id}">
                        Editar
                    </button>
                    <button class="btn btn-danger btn-sm btn-delete-client" data-id="${client.id}">
                        Apagar
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Clientes</h4>
            <button id="btnNewClient" class="btn btn-success mb-3">Novo Cliente</button>

            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>CPF</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>

            <button id="btnLogout" class="btn btn-secondary">Sair</button>
        </div>
    `);

    $("#btnNewClient").on("click", () => renderClientForm(userId));
    $("#btnLogout").on("click", renderLogin);

    $(".btn-open-address").on("click", function () {
        const clientId = $(this).data("id");
        renderAddresses(userId, clientId);
    });

        $(".btn-edit-client").on("click", function() {
        const clientId = $(this).data("id");
        editClient(userId, clientId);
    });

    $(".btn-delete-client").on("click", function() {
        const clientId = $(this).data("id");
        if (confirm("Deseja realmente apagar este cliente?")) {
            alasql("DELETE FROM clients WHERE id=? AND user_id=?", [clientId, userId]);
            alasql("DELETE FROM addresses WHERE cliente_id=? AND user_id=?", [clientId, userId]);
            renderClients(userId);
        }
    });
}

function renderClientForm(userId) {
    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Novo Cliente</h4>

            <input id="inputName" class="form-control mt-2" placeholder="Nome completo" />
            <input id="inputCPF" class="form-control mt-2" placeholder="CPF" />
            <input id="inputBirth" type="date" class="form-control mt-2" />
            <input id="inputPhone" class="form-control mt-2" placeholder="Telefone" />
            <input id="inputCell" class="form-control mt-2" placeholder="Celular" />

            <button id="btnSaveClient" class="btn btn-success w-100 mt-3">Salvar</button>
            <button id="btnBack" class="btn btn-secondary w-100 mt-2">Voltar</button>
        </div>
    `);

    $("#inputPhone, #inputCell").on("input", function () {
        const caret = this.selectionStart;
        const originalLength = this.value.length;

        this.value = formatPhone(this.value);

        const newLength = this.value.length;
        this.setSelectionRange(caret + (newLength - originalLength), caret + (newLength - originalLength));
    });

    $("#inputCPF").on("input", function () {
        const caret = this.selectionStart;
        const originalLength = this.value.length;

        this.value = formatCPF(this.value);

        const newLength = this.value.length;
        this.setSelectionRange(caret + (newLength - originalLength), caret + (newLength - originalLength));
    });

    $("#btnSaveClient").on("click", () => saveClient(userId));
    $("#btnBack").on("click", () => renderClients(userId));
}

function formatPhone(phone) {
    phone = phone.replace(/\D/g, "");
    if (phone.length > 10) {
        phone = phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3"); // Celular
    } else if (phone.length > 5) {
        phone = phone.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3"); // Fixo
    } else if (phone.length > 2) {
        phone = phone.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    }
    return phone;
}

function formatCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
    cpf = cpf.replace(/(\d{3})(\d)/, "$1.$2");
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return cpf;
}

function isValidCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    return cpf.length === 11;
}

function isExistentCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cpf)) return false; // bloqueia CPFs repetidos como 111.111.111-11

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
    let resto = soma % 11;
    let dig1 = resto < 2 ? 0 : 11 - resto;

    soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (11 - i);
    soma += dig1 * 2;
    resto = soma % 11;
    let dig2 = resto < 2 ? 0 : 11 - resto;

    return dig1 === parseInt(cpf[9]) && dig2 === parseInt(cpf[10]);
}

function saveClient(userId) {
    const name = $("#inputName").val().trim();
    const cpf = $("#inputCPF").val().trim();
    const birth = $("#inputBirth").val();
    const phone = $("#inputPhone").val().trim();
    const cell = $("#inputCell").val().trim();

    if (!name || !cpf || !birth) {
        showToast("Preencha nome, CPF e data de nascimento.", "warning");
        return;
    }

    if (!isValidCPF(cpf)) {
        showToast("CPF inválido.", "warning");
        return;
    }

    if (!isExistentCPF(cpf)) {
        showToast("Aviso: o CPF cadastrado não existe", "info")
    }

    try {
        alasql(
            "INSERT INTO clients (user_id, nome, cpf, nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, name, cpf, birth, phone, cell]
        );

        showToast("Cliente cadastrado!", "success");
        renderClients(userId);

    } catch (err) {
        showToast("Erro: CPF já cadastrado.", "warning");
    }
}

function editClient(userId, clientId) {
    const client = alasql("SELECT * FROM clients WHERE id=? AND user_id=?", [clientId, userId])[0];
    if (!client) {
        showToast("Cliente não encontrado.", "danger");
        renderClients(userId);
        return;
    }

    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Editar Cliente</h4>

            <input id="inputName" class="form-control mt-2" placeholder="Nome completo" value="${client.nome}" />
            <input id="inputCPF" class="form-control mt-2" placeholder="CPF" value="${client.cpf}" />
            <input id="inputBirth" type="date" class="form-control mt-2" value="${client.nascimento}" />
            <input id="inputPhone" class="form-control mt-2" placeholder="Telefone" value="${client.telefone}" />
            <input id="inputCell" class="form-control mt-2" placeholder="Celular" value="${client.celular}" />

            <button id="btnSaveClient" class="btn btn-success w-100 mt-3">Salvar</button>
            <button id="btnBack" class="btn btn-secondary w-100 mt-2">Voltar</button>
        </div>
    `);

    $("#inputPhone, #inputCell").on("input", function () {
        const caret = this.selectionStart;
        const originalLength = this.value.length;

        this.value = formatPhone(this.value);
        
        const newLength = this.value.length;
        this.setSelectionRange(caret + (newLength - originalLength), caret + (newLength - originalLength));
    });

    $("#inputCPF").on("input", function () {
        const caret = this.selectionStart;
        const originalLength = this.value.length;

        this.value = formatCPF(this.value);

        const newLength = this.value.length;
        this.setSelectionRange(caret + (newLength - originalLength), caret + (newLength - originalLength));
    });

    $("#btnSaveClient").on("click", () => {
        const name = $("#inputName").val().trim();
        const cpf = $("#inputCPF").val().trim();
        const birth = $("#inputBirth").val();
        const phone = $("#inputPhone").val().trim();
        const cell = $("#inputCell").val().trim();

        if (!name || !cpf || !birth) {
            showToast("Preencha nome, CPF e data de nascimento.", "warning");
            return;
        }

        if (!isValidCPF(cpf)) {
            showToast("CPF inválido.", "warning");
            return;
        }

        if (!isExistentCPF(cpf)) {
            showToast("Aviso: o CPF cadastrado não existe", "info")
        }

        try {
            alasql(
                "UPDATE clients SET nome=?, cpf=?, nascimento=?, telefone=?, celular=? WHERE id=? AND user_id=?",
                [name, cpf, birth, phone, cell, clientId, userId]
            );
            showToast("Cliente atualizado!", "success");
            renderClients(userId);
        } catch (err) {
            showToast("Erro: CPF já cadastrado.", "warning");
        }
    });

    $("#btnBack").on("click", () => renderClients(userId));
}
