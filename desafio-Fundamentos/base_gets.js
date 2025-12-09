// ---------- SIMULADOR DE gets() E print() ----------

// Carrega todos os dados da entrada padrão (stdin)
const fs = require("fs");
const input = fs.readFileSync(0, "utf8").split(/\r?\n/);

// índice da linha atual do gets()
let lineIndex = 0;

// gets() igual ao da DIO
global.gets = function() {
  return input[lineIndex++]; 
};

// print() igual ao da DIO
global.print = function(text) {
  console.log(text);
};

// ---------- DAQUI PRA BAIXO VAI O SEU CÓDIGO DO DESAFIO ----------
