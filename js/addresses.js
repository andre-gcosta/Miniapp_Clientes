function renderAddresses(userId, clientId) {
    clientId = Number(clientId);

    const client = alasql(
        "SELECT * FROM clients WHERE id=? AND user_id=?",
        [clientId, userId]
    )[0];

    if (!client) {
        showToast("Cliente não encontrado.", "danger");
        renderClients(userId);
        return;
    }

    const addresses = alasql(
        "SELECT * FROM addresses WHERE cliente_id=? AND user_id=?",
        [clientId, userId]
    );

    const rowsHtml = addresses.map(addr => `
        <tr>
            <td class="text-break">${addr.rua}</td>
            <td class="text-break">${addr.cidade}</td>
            <td>${addr.principal ? "✔️" : ""}</td>
            <td>
                <div class="d-flex flex-column flex-sm-row gap-1">
                    <button class="btn btn-warning btn-sm btn-edit-address" data-id="${addr.id}">Editar</button>
                    <button class="btn btn-danger btn-sm btn-delete-address" data-id="${addr.id}">Apagar</button>
                </div>
            </td>
        </tr>
    `).join("");

    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Endereços de ${client.nome}</h4>

            <button id="btnNewAddress" class="btn btn-success mb-3">
                Novo Endereço
            </button>

            <div class="table-responsible">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Rua</th>
                            <th>Cidade</th>
                            <th>Principal</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            <div>

            <button id="btnBack" class="btn btn-secondary mt-2">
                Voltar
            </button>
        </div>
    `);

    $(".btn-edit-address").on("click", function() {
        const addressId = $(this).data("id");
        editAddress(userId, clientId, addressId);
    });
    $(".btn-delete-address").on("click", function() {
        const addressId = $(this).data("id");
        if (confirm("Deseja realmente apagar este endereço?")) {
            alasql("DELETE FROM addresses WHERE id=? AND user_id=?", [addressId, userId]);
            renderAddresses(userId, clientId);
        }
    });
    $("#btnNewAddress").on("click", () => renderAddressForm(userId, clientId));
    $("#btnBack").on("click", () => renderClients(userId));
}

function saveAddress(userId, clientId) {
    const data = {
        cep: $("#inputCEP").val().trim(),
        rua: $("#inputStreet").val().trim(),
        bairro: $("#inputDistrict").val().trim(),
        cidade: $("#inputCity").val().trim(),
        estado: $("#inputState").val().trim(),
        pais: $("#inputCountry").val().trim(),
        principal: $("#inputMain").is(":checked"),
    };

    if (!validateAddress(data)) {
        showToast("Preencha todos os campos.", "warning");
        return;
    }

    if (data.principal) {
        alasql(
            "UPDATE addresses SET principal=FALSE WHERE cliente_id=? AND user_id=?",
            [clientId, userId]
        );
    }

    alasql(
        "INSERT INTO addresses (user_id, cliente_id, cep, rua, bairro, cidade, estado, pais, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            userId,
            clientId,
            data.cep,
            data.rua,
            data.bairro,
            data.cidade,
            data.estado,
            data.pais,
            data.principal
        ]
    );
    showToast("Endereço cadastrado!", "success");
    renderAddresses(userId, clientId);
}

function renderAddressForm(userId, clientId) {
    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Novo Endereço</h4>

            <input id="inputCEP" class="form-control mt-2" placeholder="CEP" maxlength="9" />
            <input id="inputStreet" class="form-control mt-2" placeholder="Rua" />
            <input id="inputDistrict" class="form-control mt-2" placeholder="Bairro" />
            <input id="inputCity" class="form-control mt-2" placeholder="Cidade" />
            <input id="inputState" class="form-control mt-2" placeholder="Estado" />
            <input id="inputCountry" class="form-control mt-2" placeholder="País" value="Brasil" />

            <div class="form-check mt-3">
                <input id="inputMain" type="checkbox" class="form-check-input" />
                <label for="inputMain" class="form-check-label">Principal</label>
            </div>

            <button id="btnSaveAddress" class="btn btn-success w-100 mt-3">
                Salvar
            </button>

            <button id="btnBack" class="btn btn-secondary w-100 mt-2">
                Voltar
            </button>
        </div>
    `);

    $("#inputCEP").on("input", function() {
    let cep = $(this).val().replace(/\D/g, "");
    if (cep.length > 5) {
        cep = cep.replace(/(\d{5})(\d)/, "$1-$2");
    }
    $(this).val(cep);
    });

    $("#inputCEP").on("blur", () => buscarCEP($("#inputCEP").val()));
    $("#btnSaveAddress").on("click", () => saveAddress(userId, clientId));
    $("#btnBack").on("click", () => renderAddresses(userId, clientId));
}

function validateAddress({ cep, rua, bairro, cidade, estado, pais }) {
    return cep && rua && bairro && cidade && estado && pais;
}

let lastCepErro = null;
function buscarCEP(rawCep) {
    const cleanCEP = rawCep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
        showToast("CEP inválido!", "warning");
        return;
    }

    if (cleanCEP === lastCepErro) return;

    if (!navigator.onLine) {
        showToast("Sem conexão com a internet. Não é possível buscar o CEP.", "warning");
        return;
    }

    fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
        .then(r => r.json())
        .then(data => {
            if (data.erro) {
                showToast("CEP não encontrado!", "warning");
                lastCepErro = cleanCEP;
                return;
            }

            $("#inputStreet").val(data.logradouro || "");
            $("#inputDistrict").val(data.bairro || "");
            $("#inputCity").val(data.localidade || "");
            $("#inputState").val(data.uf || "");
            $("#inputCountry").val("Brasil");

            lastCepErro = null;
        })
        .catch(() => {
            showToast("Erro ao buscar CEP", "warning");
            lastCepErro = cleanCEP;
        });
}

function editAddress(userId, clientId, addressId) {
    const address = alasql("SELECT * FROM addresses WHERE id=? AND user_id=? AND cliente_id=?", 
                           [addressId, userId, clientId])[0];
    if (!address) {
        showToast("Endereço não encontrado.", "danger");
        renderAddresses(userId, clientId);
        return;
    }

    $("#app").html(`
        <div class="card p-4 mt-4">
            <h4>Editar Endereço</h4>

            <input id="inputCEP" class="form-control mt-2" placeholder="CEP" maxlength="9" value="${address.cep}" />
            <input id="inputStreet" class="form-control mt-2" placeholder="Rua" value="${address.rua}" />
            <input id="inputDistrict" class="form-control mt-2" placeholder="Bairro" value="${address.bairro}" />
            <input id="inputCity" class="form-control mt-2" placeholder="Cidade" value="${address.cidade}" />
            <input id="inputState" class="form-control mt-2" placeholder="Estado" value="${address.estado}" />
            <input id="inputCountry" class="form-control mt-2" placeholder="País" value="${address.pais || "Brasil"}" />

            <div class="form-check mt-3">
                <input id="inputMain" type="checkbox" class="form-check-input" ${address.principal ? "checked" : ""} />
                <label for="inputMain" class="form-check-label">Principal</label>
            </div>

            <button id="btnSaveAddress" class="btn btn-success w-100 mt-3">Salvar</button>
            <button id="btnBack" class="btn btn-secondary w-100 mt-2">Voltar</button>
        </div>
    `);

    $("#inputCEP").on("input", function() {
        let cep = $(this).val().replace(/\D/g, "");
        if (cep.length > 5) {
            cep = cep.replace(/(\d{5})(\d)/, "$1-$2");
        }
        $(this).val(cep);
    });

    $("#inputCEP").on("blur", () => buscarCEP($("#inputCEP").val()));

    $("#btnSaveAddress").on("click", () => {
        const data = {
            cep: $("#inputCEP").val().trim(),
            rua: $("#inputStreet").val().trim(),
            bairro: $("#inputDistrict").val().trim(),
            cidade: $("#inputCity").val().trim(),
            estado: $("#inputState").val().trim(),
            pais: $("#inputCountry").val().trim(),
            principal: $("#inputMain").is(":checked"),
        };

        if (!validateAddress(data)) {
            showToast("Preencha todos os campos.", "warning");
            return;
        }

        if (data.principal) {
            alasql("UPDATE addresses SET principal=FALSE WHERE cliente_id=? AND user_id=?", [clientId, userId]);
        }

        alasql(
            "UPDATE addresses SET cep=?, rua=?, bairro=?, cidade=?, estado=?, pais=?, principal=? WHERE id=? AND cliente_id=? AND user_id=?",
            [data.cep, data.rua, data.bairro, data.cidade, data.estado, data.pais, data.principal, addressId, clientId, userId]
        );

        showToast("Endereço atualizado!", "success");
        renderAddresses(userId, clientId);
    });

    $("#btnBack").on("click", () => renderAddresses(userId, clientId));
}
