const nome = "Nonsense";
let qtdXp = 0;
 
switch (qtdXp) {
    case (qtdXp <= 1000):
    case (qtdXp >= 1):
      console.log("O Herói " + nome + " está no nível Ferro")
      break;
    case (qtdXp <= 2001 && qtdXp <= 3000):
      console.log("O Herói " + nome + " está no nível Prata");
      break;    
    case (qtdXp <= 3001 && qtdXp <= 4000):
      console.log("O Herói " + nome + " está no nível Ouro");
      break;    
    case (qtdXp <= 4001 && qtdXp <= 5000):
      console.log("O Herói " + nome + " está no nível Platina");
      break;
    default:
        console.log("Seu Herói não iniciou a jornada.");
        break;
}   
