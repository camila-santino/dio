// IMPORTANTE: As funções "gets" e "print" são acessíveis globalmente, onde:  
// - "gets" : lê UMA linha com dado(s) de entrada (inputs) do usuário; 
// - "print": imprime um texto de saída (output) e pula uma linha ("\n") automaticamente. 

// TODO: Realize o calculo o imposto:
function calcularImposto(salario) {
    if (salario > 3000) {
        return (salario - 3000) * 0.10; // 10%  
    } else {
        return salario * 0.05; // 55%
    }
}

// Entrada do usuário
let salario = parseFloat(gets());

// Cálculo do imposto
let imposto = calcularImposto(salario);

// Saída formatada com duas casas decimais
print(imposto.toFixed(2));
