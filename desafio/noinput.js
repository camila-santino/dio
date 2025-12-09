const readline = require("readline");

let linhas = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on("line", (line) => {
  linhas.push(line);
});

rl.on("close", () => {
  const n = parseInt(linhas[0], 10);
  let total = 0;

  for (let i = 1; i <= n; i++) {
    total += parseInt(linhas[i], 10);
  }

  console.log(`${total} transacoes no total`);
});
