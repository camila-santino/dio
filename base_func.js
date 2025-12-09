// ---------- SIMULADOR DE gets() E print() ----------
const fs = require("fs");
const input = fs.readFileSync(0, "utf8").trim().split(/\r?\n/);
let lineIndex = 0;

global.gets = () => input[lineIndex++];
global.print = (text) => console.log(text);

// ---------- A PARTIR DAQUI, SEU CÓDIGO ----------
const n = parseInt(gets());
let totalTransacoes = 0;

for (let i = 0; i < n; i++) {
  const t = parseInt(gets());
  totalTransacoes += t;
}

print(`${totalTransacoes} transacoes no total`);