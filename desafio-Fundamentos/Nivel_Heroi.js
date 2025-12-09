// Lê valores informados pelo usuário:
let wins = parseInt(gets());     // número de vitórias
let losses = parseInt(gets());   // número de derrotas
let nome = gets();               // nome do herói (opcional)

function calcularNivel(wins, losses) {
    const saldo = wins - losses;

    switch (true) {
        case (wins <= 10):
            return { nivel: "Ferro", saldo };
        case (wins <= 20):
            return { nivel: "Bronze", saldo };
        case (wins <= 50):
            return { nivel: "Prata", saldo };
        case (wins <= 80):
            return { nivel: "Ouro", saldo };
        case (wins <= 90):
            return { nivel: "Diamante", saldo };
        case (wins <= 100):
            return { nivel: "Lendário", saldo };
        default:
            return { nivel: "Imortal", saldo };
    }
}
const resultado = calcularNivel(wins, losses);

// Exibe a mensagem final:
print(`O Herói ${nome} tem saldo de ${resultado.saldo} e está no nível ${resultado.nivel}`)
