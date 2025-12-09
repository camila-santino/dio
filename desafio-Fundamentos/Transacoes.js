// Lê a primeira linha da entrada e converte para número inteiro.
// Este valor representa a quantidade de entradas (número de transações a serem lidas).
const n = parseInt(gets());

// Inicializa a variável que vai acumular o total de transações.
let totalTransacoes = 0;

// TODO: Implemente um loop que vai se repetir 'n' vezes, para ler e somar cada transação.
// Lê n transações
for (let i = 0; i < n; i++) {
    const t = parseInt(gets());
    totalTransacoes += t;
}

// Exibe o total de transações no formato especificado.
print(`${totalTransacoes} transacoes no total`);
