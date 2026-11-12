
const formulario = document.getElementById("formFuncionario");
const mensagem = document.getElementById("mensagem");
const lista = document.getElementById("listaFuncionarios");
const total = document.getElementById("totalFuncionarios");

let funcionarios = [];

function carregarDados() {
    try {
        funcionarios = JSON.parse(
            localStorage.getItem("funcionariosMinertech")
        ) || [];

        if (!Array.isArray(funcionarios)) {
            funcionarios = [];
        }
    } catch {
        funcionarios = [];
    }
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function converterSalario(valor) {
    const limpo = String(valor)
        .replace(/R\$\s?/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();

    return Number(limpo);
}

function mostrarMensagem(texto, tipo) {
    if (!mensagem) return;

    mensagem.textContent = texto;
    mensagem.className = tipo;
}

function validarCPF(valor) {
    const cpf = valor.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    if (resto !== Number(cpf[9])) return false;

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);
}

function dataBR(data) {
    if (!data) return "";

    const [ano, mes, dia] = data.split("-");

    return `${dia}/${mes}/${ano}`;
}

function salvarDados() {
    localStorage.setItem(
        "funcionariosMinertech",
        JSON.stringify(funcionarios)
    );

    atualizarIndicadores();
}

function atualizarIndicadores() {
    const quantidade = funcionarios.length;

    const folhaPagamento = funcionarios.reduce(
        (soma, funcionario) =>
            soma + Number(funcionario.salario || 0),
        0
    );

    const manha = funcionarios.filter(
        funcionario => funcionario.turno === "Manhã"
    ).length;

    const tarde = funcionarios.filter(
        funcionario => funcionario.turno === "Tarde"
    ).length;

    const noite = funcionarios.filter(
        funcionario => funcionario.turno === "Noite"
    ).length;

    const indicadores = {
        totalFuncionariosDashboard: quantidade,
        totalFuncionarios: quantidade,
        folhaPagamento: formatarMoeda(folhaPagamento),
        totalTurnoManha: manha,
        totalTurnoTarde: tarde,
        totalTurnoNoite: noite
    };

    Object.entries(indicadores).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    });
}

function atualizarLista() {
    if (!lista) return;

    lista.innerHTML = "";

    if (total) {
        total.textContent = funcionarios.length;
    }

    if (funcionarios.length === 0) {
        lista.innerHTML = `
            <tr>
                <td colspan="10">Nenhum funcionário cadastrado.</td>
            </tr>
        `;
        return;
    }

    funcionarios.forEach((funcionario, indice) => {
        const linha = document.createElement("tr");

        const dados = [
            funcionario.nome,
            funcionario.cpf,
            dataBR(funcionario.nascimento),
            dataBR(funcionario.entrada),
            funcionario.cargo,
            funcionario.email,
            funcionario.telefone,
            funcionario.turno,
            formatarMoeda(funcionario.salario)
        ];

        dados.forEach(dado => {
            const celula = document.createElement("td");

            celula.textContent = dado;
            linha.appendChild(celula);
        });

        const acao = document.createElement("td");
        const botao = document.createElement("button");

        botao.textContent = "Excluir";
        botao.className = "excluir";
        botao.type = "button";

        botao.addEventListener("click", () => {
            funcionarios.splice(indice, 1);

            salvarDados();
            atualizarLista();

            mostrarMensagem(
                "Funcionário excluído com sucesso!",
                "sucesso"
            );
        });

        acao.appendChild(botao);
        linha.appendChild(acao);
        lista.appendChild(linha);
    });
}

// CADASTRO DE FUNCIONÁRIOS

if (formulario) {
    formulario.addEventListener("submit", function(evento) {
        evento.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const endereco = document.getElementById("endereco").value.trim();
        const cpfFuncionario = document.getElementById("cpf").value.trim();
        const nascimento = document.getElementById("nascimento").value;
        const entrada = document.getElementById("entrada").value;
        const email = document.getElementById("email").value.trim();
        const telefone = document.getElementById("telefone").value.trim();
        const cargo = document.getElementById("cargo").value;
        const salarioTexto = document.getElementById("salario").value.trim();
        const turno = document.querySelector('input[name="turno"]:checked');

        if (!nome) {
            mostrarMensagem("O campo Nome é obrigatório.", "erro");
            return;
        }

        if (!endereco) {
            mostrarMensagem("O campo Endereço é obrigatório.", "erro");
            return;
        }

        if (!cpfFuncionario) {
            mostrarMensagem("O CPF é obrigatório.", "erro");
            return;
        }

        if (!validarCPF(cpfFuncionario)) {
            mostrarMensagem("CPF inválido! Digite um CPF válido.", "erro");
            return;
        }

        const cpfNumerico = cpfFuncionario.replace(/\D/g, "");

        if (funcionarios.some(f =>
            f.cpf && f.cpf.replace(/\D/g, "") === cpfNumerico
        )) {
            mostrarMensagem("Este CPF já está cadastrado.", "erro");
            return;
        }

        if (!nascimento) {
            mostrarMensagem("Informe a data de nascimento.", "erro");
            return;
        }

        if (!entrada) {
            mostrarMensagem("Informe a data de entrada na empresa.", "erro");
            return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const dataNascimento = new Date(nascimento + "T00:00:00");
        const dataEntrada = new Date(entrada + "T00:00:00");

        if (dataNascimento >= hoje) {
            mostrarMensagem(
                "A data de nascimento deve ser anterior a hoje.",
                "erro"
            );
            return;
        }

        if (dataEntrada > hoje) {
            mostrarMensagem(
                "A data de entrada não pode ser futura.",
                "erro"
            );
            return;
        }

        if (dataEntrada < dataNascimento) {
            mostrarMensagem(
                "A entrada na empresa não pode ser anterior ao nascimento.",
                "erro"
            );
            return;
        }

        if (!email) {
            mostrarMensagem("O campo E-mail é obrigatório.", "erro");
            return;
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValido) {
            mostrarMensagem("Digite um e-mail válido.", "erro");
            return;
        }

        const telefoneNumeros = telefone.replace(/\D/g, "");

        if (
            telefoneNumeros.length < 10 ||
            telefoneNumeros.length > 11
        ) {
            mostrarMensagem(
                "Digite um telefone válido com DDD.",
                "erro"
            );
            return;
        }

        if (!cargo) {
            mostrarMensagem("Selecione um cargo.", "erro");
            return;
        }

        if (!salarioTexto) {
            mostrarMensagem("O campo Salário é obrigatório.", "erro");
            return;
        }

        const salario = converterSalario(salarioTexto);

        if (!Number.isFinite(salario) || salario <= 0) {
            mostrarMensagem(
                "O salário deve ser maior que zero.",
                "erro"
            );
            return;
        }

        if (!turno) {
            mostrarMensagem(
                "Selecione um turno de trabalho.",
                "erro"
            );
            return;
        }

        const funcionario = {
            nome,
            endereco,
            cpf: cpfFuncionario,
            nascimento,
            entrada,
            email,
            telefone,
            cargo,
            salario,
            turno: turno.value
        };

        funcionarios.push(funcionario);

        salvarDados();
        atualizarLista();

        formulario.reset();

        mostrarMensagem(
            "Funcionário cadastrado com sucesso!",
            "sucesso"
        );
    });

    // MÁSCARA DO CPF

    document.getElementById("cpf").addEventListener("input", function() {
        let valor = this.value.replace(/\D/g, "").slice(0, 11);

        valor = valor.replace(/^(\d{3})(\d)/, "$1.$2");
        valor = valor.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
        valor = valor.replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");

        this.value = valor;
    });

    // FORMATAÇÃO DO SALÁRIO

    document.getElementById("salario").addEventListener("blur", function() {
        if (!this.value.trim()) return;

        const valor = converterSalario(this.value);

        if (Number.isFinite(valor) && valor > 0) {
            this.value = formatarMoeda(valor);
        }
    });

    // MÁSCARA DO TELEFONE

    document.getElementById("telefone").addEventListener("input", function() {
        let valor = this.value.replace(/\D/g, "").slice(0, 11);

        if (valor.length > 10) {
            valor = valor.replace(
                /^(\d{2})(\d{5})(\d{4})$/,
                "($1) $2-$3"
            );
        } else if (valor.length > 6) {
            valor = valor.replace(
                /^(\d{2})(\d{4})(\d{0,4})$/,
                "($1) $2-$3"
            );
        } else if (valor.length > 2) {
            valor = valor.replace(
                /^(\d{2})(\d+)$/,
                "($1) $2"
            );
        }

        this.value = valor;
    });

    formulario.addEventListener("reset", function() {
        if (mensagem) {
            mensagem.textContent = "";
            mensagem.className = "";
        }
    });
}

// ATUALIZAÇÃO AUTOMÁTICA ENTRE AS PÁGINAS

window.addEventListener("storage", function(evento) {
    if (evento.key === "funcionariosMinertech") {
        carregarDados();
        atualizarLista();
        atualizarIndicadores();
    }
});

// INICIALIZAÇÃO

carregarDados();
atualizarLista();
atualizarIndicadores();
