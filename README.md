Mini App de Clientes e Endereços
===========================================

1. Descrição do Projeto
-----------------------
Este projeto é uma mini aplicação Web para cadastro e gerenciamento de:
- Usuários
- Clientes
- Endereços de clientes

A aplicação utiliza:
- HTML, CSS e JavaScript (Vanilla)
- Plugin AlaSQL.js para banco de dados SQL no navegador
- jQuery
- Bootstrap 5

A aplicação roda **diretamente no navegador**, sem necessidade de servidor.

---

2. Estrutura de Pastas
----------------------
```text
├── index.html        -> Página principal
├── css/
│   └── style.css    -> Estilos customizados
├── js/
│   ├── db.js        -> Funções de banco de dados
│   ├── auth.js      -> Funções de login/cadastro de usuários
│   ├── clients.js   -> Funções de listagem, cadastro, apagar e edição de clientes
│   ├── addresses.js -> Funções de listagem, cadastro, apagar e edição de endereços
│   ├── main.js      -> Inicialização da aplicação
│   └── utils.js     -> Utilitários (popups)
└── INFO.txt          -> Este arquivo
```

---

3. Como Executar
----------------
1. Abra a pasta do projeto.
2. Abra o arquivo `index.html` no navegador (Chrome, Firefox ou Edge recomendados).
3. A aplicação carregará automaticamente a tela de login.
4. Observação: para a API de busca de CEP funcionar é necessário ter conexão com a internet.

---

4. Funcionalidades
------------------
### Login
- Informe usuário e senha.
- Usuário padrão: `admin` / `admin`
- É possível cadastrar novos usuários (usuário único).

### Configurações
- Botão para importar um banco de dados pré-populado em JSON.
- Botão para exportar o banco de dados atual para JSON.

### Clientes
- Listagem de clientes cadastrados.
- Cadastro, edição e exclusão de clientes.
- Campos obrigatórios: Nome, CPF, Data de Nascimento.
- Validação:
	- Verificação de CPF
	- CPF único no sistema (global).

### Endereços
- Cada cliente pode ter um ou mais endereços.
- Campos obrigatórios: CEP, Rua, Bairro, Cidade, Estado, País.
- É obrigatório marcar um endereço como “Principal”.
- Busca automática de endereço pelo CEP usando ViaCEP API (requisição necessita de conexão à internet).

### Exportar Banco
- Possível exportar todo o banco de dados (usuários, clientes, endereços) em JSON.

---

5. Observações Técnicas
-----------------------
- O banco de dados em memória usando AlaSQL.js.
- Ao importar um JSON, registros existentes são substituídos.
- Não há necessidade de servidor, todos os dados ficam no navegador.
- A aplicação é mobile friendly (Bootstrap 5, tabelas responsivas).
- jQuery facilita a manipulação do DOM e eventos.
- Endereços com `cliente_id` inexistente no JSON de importação serão ignorados.

---

6. Como Importar Banco de Dados
-------------------------------
1. Clique em “Configurações” na tela de login.
2. Selecione o arquivo JSON contendo o banco de dados.
3. O sistema apagará os dados atuais e importará os novos.
4. Validações:
   - Usuários com mesmo `username` não serão duplicados.
   - Clientes com mesmo CPF não serão duplicados.
   - Endereços sem cliente existente serão ignorados.
5. Após a importação, a tela será atualizada automaticamente.

---

7. Sugestões de Uso
-------------------
- Sempre exporte o banco antes de fazer testes destrutivos.
- Use CEP válido para preenchimento automático dos campos de endereço.
- Utilize navegadores atualizados para evitar problemas com fetch ou AlaSQL.

---

8. Contatos / Autor
-------------------
- Desenvolvido por: André Goulart Costa
- Data de finalização do projeto: 14/11/2025 às 20:05

