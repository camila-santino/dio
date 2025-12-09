// ---------- SIMULADOR DE gets() ----------

// Carrega todos os dados da entrada padrão (stdin)
const fs = require("fs");
const input = fs.readFileSync(0, "utf8").split(/\r?\n/);

// índice da linha atual do gets()
let lineIndex = 0;

// gets() 
global.gets = function() {
  return input[lineIndex++]; 
};

// print()
global.print = function(text) {
  console.log(text);
};

// ---------- DAQUI PRA BAIXO VAI O SEU CÓDIGO DO DESAFIO ----------
