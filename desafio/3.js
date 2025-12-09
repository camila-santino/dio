const fs = require("fs");

// Lê tudo da entrada padrão (como se fossem os gets() da DIO)
const input = fs.readFileSync(0, "utf8").trim().split("\n");

// n = número de clientes
const n = parseInt(input[0], 10);

let totalTransacoes = 0;

// percorre as próximas n linhas
for (let i = 1; i <= n; i++) {
  const t = parseInt(input[i], 10);
  totalTransacoes += t;
}

console.log(`${totalTransacoes} transacoes no total`);
