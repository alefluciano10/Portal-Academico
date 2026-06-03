// Executa o script somente quando a página estiver totalmente carregada
document.addEventListener("DOMContentLoaded", () => {
    // Elemento tbody onde as linhas da tabela serão inseridas
    const tabelaBody = document.getElementById("corpoTabela");

    // Caminho do arquivo JSON com os dados dos alunos
    const dadosUrl = "../JSON/alunos.json";

    // Calcula a média entre nota1 e nota2
    const calcularMedia = (nota1, nota2) => {
        return ((nota1 + nota2) / 2).toFixed(1);
    };

    // Define a situação do aluno com base na média
    const calcularSituacao = (nota1, nota2) => {
        const media = (nota1 + nota2) / 2;
        return media >= 6 ? "Aprovado" : "Reprovado";
    };

    // Cria uma célula <td> com o texto fornecido
    const criarCelula = (texto) => {
        const td = document.createElement("td");
        td.innerText = texto;
        return td;
    };

    // Cria uma linha <tr> para um aluno específico
    const criarLinhaAluno = (aluno) => {
        const tr = document.createElement("tr");

        const media = calcularMedia(aluno.nota1, aluno.nota2);
        const situacao = calcularSituacao(aluno.nota1, aluno.nota2);

        tr.appendChild(criarCelula(aluno.nome));
        tr.appendChild(criarCelula(aluno.curso));
        tr.appendChild(criarCelula(aluno.semestre));
        tr.appendChild(criarCelula(media));
        tr.appendChild(criarCelula(situacao));

        return tr;
    };

    // Preenche a tabela com todos os alunos carregados do JSON
    const carregarTabela = (alunos) => {
        alunos.forEach((aluno) => {
            const linha = criarLinhaAluno(aluno);
            tabelaBody.appendChild(linha);
        });
    };

    // Busca os dados do arquivo JSON e chama a função para montar a tabela
    fetch(dadosUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Não foi possível carregar o arquivo JSON.");
            }
            return response.json();
        })
        .then((alunos) => {
            carregarTabela(alunos);
        })
        .catch((erro) => {
            // Exibe mensagem de erro na tabela caso a leitura falhe
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.setAttribute("colspan", "5");
            td.innerText = "Erro ao carregar os dados dos alunos.";
            tr.appendChild(td);
            tabelaBody.appendChild(tr);
            console.error(erro);
        });
});
