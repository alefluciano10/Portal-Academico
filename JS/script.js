/*
    JS principal do Portal Acadêmico Web

    Responsabilidades deste arquivo:
    - Carregar dados de alunos do servidor (`/api/alunos`) ou do localStorage quando offline
    - Expor funções para montar a tabela dinâmica usando DOM (createElement/appendChild/innerText)
    - Controlar a UI: alternância de seções (menu lateral), formulário de cadastro e modal de confirmação
    - Enviar atualizações para o servidor (`/api/salvar-alunos`) e manter um backup no localStorage

    IDs importantes usados no HTML:
    - `formCadastro`, `cadastroSection`, `inicioSection`, `tabelaSection`, `corpoTabela`, `modalOverlay`

    Observação de segurança: o código chama a API `http://localhost:3000/api` para gravação do JSON.
    Em ambiente de produção, proteger endpoints e validar dados no servidor.
*/
// Executa o script somente quando a página estiver totalmente carregada
document.addEventListener("DOMContentLoaded", () => {
    const tabelaBody = document.getElementById("corpoTabela");
    const tabelaNotas = document.getElementById("corpoTabelaNotas");
    const formCadastro = document.getElementById("formCadastro");
    const cadastroSection = document.getElementById("cadastroSection");
    const inicioSection = document.getElementById("inicioSection");
    const tabelaSection = document.getElementById("tabelaSection");
    const notasSection = document.getElementById("notasSection");
    const menuLinks = document.querySelectorAll(".side-bar-menu a");
    const apiUrl = "http://localhost:3000/api";
    const storageKey = "alunosCadastro";
    let alunos = [];

    let ordemAtual = {};

    let indiceEdicao = null;
    const botaoSubmit = formCadastro.querySelector(".btn-primary");

    let confirmCallback = null;

    const mostrarModal = ({
    titulo,
    mensagem,
    confirmarTexto = "OK",
    cancelarTexto = "Cancelar",
    onConfirm = null
}) => {

    const modal = document.getElementById("modalOverlay");
    const tituloEl = document.getElementById("modalTitulo");
    const mensagemEl = document.getElementById("modalMensagem");
    const botaoOk = document.getElementById("botaoOk");
    const botaoCancelar = document.getElementById("botaoCancelar");

    tituloEl.textContent = titulo;
    mensagemEl.textContent = mensagem;

    botaoOk.textContent = confirmarTexto;
    botaoCancelar.textContent = cancelarTexto;

    confirmCallback = onConfirm;

    modal.classList.remove("hidden");
    modal.focus();

    const fecharModal = () => {
        modal.classList.add("hidden");
        confirmCallback = null;

        const nomeEl = document.getElementById("nome");

        if (
            nomeEl &&
            !cadastroSection.classList.contains("hidden")
        ) {
            nomeEl.focus();
        }
    };

    botaoOk.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const callback = confirmCallback;

        fecharModal();

        if (callback) {
            callback();
        }
    };

    botaoCancelar.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        fecharModal();
    };
};

    const mostrarNotificacao = (tipo, titulo, mensagem) => {
        mostrarModal({ tipo, titulo, mensagem, mostrarCancelar: false, confirmarTexto: "OK" });
    };

    const confirmarExclusao = (indice, linha, nomeAluno) => {
                mostrarModal({
                    titulo: "Excluir aluno",
                    mensagem: `Deseja remover ${nomeAluno} da lista? Esta ação não pode ser desfeita.`,
                    confirmarTexto: "Excluir",
                    cancelarTexto: "Cancelar",
                    onConfirm: () => {
                alunos.splice(indice, 1);
                if (linha.parentNode) {
                    linha.parentNode.removeChild(linha);
                }
                salvarAlunos();
                carregarTabela(alunos);
            },
        });
    };

    const calcularMedia = (nota1, nota2) => {
        // Trata notas ausentes (undefined, null ou string vazia)
        if (nota1 == null || nota2 == null || nota1 === "" || nota2 === "") {
            return "-";
        }
        const n1 = Number(nota1);
        const n2 = Number(nota2);
        if (isNaN(n1) || isNaN(n2)) return "-";
        return ((n1 + n2) / 2).toFixed(1);
    };

    const calcularSituacao = (nota1, nota2) => {
        if (nota1 == null || nota2 == null || nota1 === "" || nota2 === "") {
            return "-";
        }
        const media = (Number(nota1) + Number(nota2)) / 2;
        return media >= 6 ? "Aprovado" : "Reprovado";
    };

    const criarCelula = (texto) => {
        const td = document.createElement("td");
        td.innerText = texto;
        return td;
    };

    // TABELA DE NOTAS 
    const carregarTabelaNotas = () => {

    tabelaNotas.innerHTML = "";

    alunos.forEach((aluno, indice) => {

        const tr = document.createElement("tr");

        tr.appendChild(criarCelula(aluno.nome));
        tr.appendChild(criarCelula(aluno.curso));
        tr.appendChild(criarCelula(aluno.semestre));

        const tdAcao = document.createElement("td");

        const botaoNotas =
            document.createElement("button");

        botaoNotas.textContent = "Notas";
        botaoNotas.className = "btn-editar";

        botaoNotas.addEventListener("click", () => {

            const nota1 = prompt(
                "Digite a Nota 1:",
                aluno.nota1 || ""
            );

            const nota2 = prompt(
                "Digite a Nota 2:",
                aluno.nota2 || ""
            );

            aluno.nota1 = Number(nota1);
            aluno.nota2 = Number(nota2);

            salvarAlunos();

            carregarTabela(alunos);

            carregarTabelaNotas();

            mostrarModal({
                titulo: "Sucesso",
                mensagem: "Notas atualizadas!"
            });
        });

        tdAcao.appendChild(botaoNotas);

        tr.appendChild(tdAcao);

        tabelaNotas.appendChild(tr);
    });
};

    const criarLinhaAluno = (aluno, indice) => {
        const tr = document.createElement("tr");

        const media = calcularMedia(aluno.nota1, aluno.nota2);
        const situacao = calcularSituacao(aluno.nota1, aluno.nota2);

        tr.appendChild(criarCelula(aluno.nome));
        tr.appendChild(criarCelula(aluno.curso));
        tr.appendChild(criarCelula(aluno.semestre));
        tr.appendChild(criarCelula(media));
        tr.appendChild(criarCelula(situacao));

        const tdAcao = document.createElement("td");

        // BOTÃO EDITAR
        const botaoEditar = document.createElement("button");
        botaoEditar.type = "button";
        botaoEditar.innerText = "Editar";
        botaoEditar.className = "btn-editar";

        botaoEditar.addEventListener("click", () => {

            document.getElementById("nome").value = aluno.nome;
            document.getElementById("curso").value = aluno.curso;
            document.getElementById("semestre").value = aluno.semestre;
            document.getElementById("dataNascimento").value =
                aluno.dataNascimento;

            indiceEdicao = indice;

            botaoSubmit.textContent = "Salvar Alteração";

            mostrarSecao("cadastro");

            document.getElementById("nome").focus();
        });

        // BOTÃO EXCLUIR
        const botaoExcluir = document.createElement("button");
        botaoExcluir.type = "button";
        botaoExcluir.innerText = "Excluir";
        botaoExcluir.className = "btn-excluir";

        botaoExcluir.addEventListener("click", () => {
            confirmarExclusao(indice, tr, aluno.nome);
        });

        tdAcao.appendChild(botaoEditar);
        tdAcao.appendChild(botaoExcluir);

        tr.appendChild(tdAcao);

        return tr;
    };

    // NOTAS

    const ordenarTabela = (coluna) => {

    const crescente = !ordemAtual[coluna];

    ordemAtual[coluna] = crescente;

    alunos.sort((a, b) => {

        let valorA;
        let valorB;

        if (coluna === "media") {
            valorA = Number(calcularMedia(a.nota1, a.nota2)) || 0;
            valorB = Number(calcularMedia(b.nota1, b.nota2)) || 0;
        } else {
            valorA = a[coluna];
            valorB = b[coluna];
        }

        if (typeof valorA === "string") {
            return crescente
                ? valorA.localeCompare(valorB)
                : valorB.localeCompare(valorA);
        }

        return crescente
            ? valorA - valorB
            : valorB - valorA;
    });

    carregarTabela(alunos);
};

    const limparTabela = () => {
        tabelaBody.innerHTML = "";
    };

    const carregarTabela = (alunos) => {
        limparTabela();
        alunos.forEach((aluno, indice) => {
            tabelaBody.appendChild(criarLinhaAluno(aluno, indice));
        });
    };

    // Persiste a lista de alunos localmente e tenta enviar ao servidor.
    // - Guarda em localStorage para permitir funcionamento offline.
    // - POST para `/api/salvar-alunos` tenta atualizar o arquivo JSON no servidor.
    // Nota: a chamada ao servidor é otimista; erros são apenas logados (fallback localStorage).
    const salvarAlunos = () => {
        localStorage.setItem(storageKey, JSON.stringify(alunos));
        
        // Salvar também no servidor (assíncrono). Não bloqueamos a UI caso falhe.
        fetch(`${apiUrl}/salvar-alunos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(alunos),
        })
        .then((res) => {
            if (!res.ok) {
                console.warn('Servidor respondeu com erro ao salvar alunos', res.status);
            }
            return res.json().catch(() => ({}));
        })
        .catch((erro) => {
            // Em caso de falha de rede ou servidor, deixamos os dados no localStorage
            console.warn("Não foi possível salvar no servidor:", erro);
        });
    };

    const carregarAlunosStorage = () => {
        const dados = localStorage.getItem(storageKey);
        return dados ? JSON.parse(dados) : null;
    };

const mostrarSecao = (secao) => {

    menuLinks.forEach((link) => {

        link.classList.toggle(
            "active",
            link.dataset.target === secao
        );

    });

    cadastroSection.classList.add("hidden");
    inicioSection.classList.add("hidden");
    tabelaSection.classList.add("hidden");
    notasSection.classList.add("hidden");

    if (secao === "cadastro") {

        cadastroSection.classList.remove("hidden");

    } else if (secao === "notas") {

         notasSection.classList.remove("hidden");
        carregarTabelaNotas();

    } else {

        inicioSection.classList.remove("hidden");
        tabelaSection.classList.remove("hidden");

    }
};

menuLinks.forEach((link) => {

    link.addEventListener("click", (event) => {

        event.preventDefault();

        mostrarSecao(link.dataset.target);

    });

});

    // Carrega dados iniciais ao abrir a página
    // 1) Tenta buscar do servidor (`/api/alunos`) — modo preferencial
    // 2) Se o servidor não responder (offline), carrega do `localStorage` como fallback
    // 3) Atualiza a tabela na UI chamando `carregarTabela`
    const carregarDadosIniciais = () => {
        const alunosSalvos = carregarAlunosStorage();

        fetch(`${apiUrl}/alunos`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Não foi possível carregar do servidor.");
                }
                return response.json();
            })
            .then((dados) => {
                // Dados obtidos do servidor: atualiza array local e persiste em localStorage
                alunos = dados;
                salvarAlunos();
                carregarTabela(alunos);
            })
            .catch((erro) => {
                // Quando o servidor está offline, recuperamos o estado previamente salvo
                console.warn("Servidor offline, carregando do localStorage:", erro);
                if (alunosSalvos && alunosSalvos.length > 0) {
                    alunos = alunosSalvos;
                    carregarTabela(alunos);
                } else {
                    const tr = document.createElement("tr");
                    const td = document.createElement("td");
                    td.setAttribute("colspan", "6");
                    td.innerText = "Erro ao carregar os dados. Certifique-se de que o servidor está rodando.";
                    tr.appendChild(td);
                    tabelaBody.appendChild(tr);
                }
            });
    };

    formCadastro.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(formCadastro);

        const novoAluno = {
            nome: formData.get("nome").trim(),
            curso: formData.get("curso").trim(),
            semestre: Number(formData.get("semestre")),
            dataNascimento: formData.get("dataNascimento"),
        };

        if (
            !novoAluno.nome ||
            !novoAluno.curso ||
            !novoAluno.dataNascimento
        ) {
            return;
        }

        // ALTERAÇÃO
        if (indiceEdicao !== null) {

            alunos[indiceEdicao] = {
                ...alunos[indiceEdicao],
                ...novoAluno
            };

            salvarAlunos();
            carregarTabela(alunos);

            indiceEdicao = null;

            formCadastro.reset();

            botaoSubmit.textContent = "Cadastrar Aluno";

            mostrarSecao("inicio");

            return;
        }

        // CADASTRO
        mostrarModal({
            titulo: "Cadastrar aluno",
            mensagem: `Tem certeza que deseja cadastrar ${novoAluno.nome}?`,
            confirmarTexto: "Cadastrar",
            cancelarTexto: "Cancelar",

            onConfirm: () => {
                alunos.push(novoAluno);

                salvarAlunos();
                carregarTabela(alunos);

                formCadastro.reset();

                document.getElementById("nome").focus();
            }
        });
    });

    document
    .querySelectorAll("th[data-coluna]")
    .forEach(th => {

        th.style.cursor = "pointer";

        th.addEventListener("click", () => {

            const coluna = th.dataset.coluna;

            ordenarTabela(coluna);
        });
    });

    carregarDadosIniciais();
    mostrarSecao("inicio");
});