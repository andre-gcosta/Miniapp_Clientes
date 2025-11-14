$(document).ready(function () {
    try {
        initDB();
        renderLogin();
    } catch (err) {
        showToast(`Erro ao carregar a aplicação: ${err}`, "danger");
        console.log(err)
    }
});