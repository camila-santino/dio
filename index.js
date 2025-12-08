const nome = "Burn";
let qtdXp = 2005;

switch (true) {
    case (qtdXp >= 1 && qtdXp <= 1000):
      console.log("O Herói " + nome + " está no nível Ferro");
      break;
    case (qtdXp >= 1001 && qtdXp <= 2000):
      console.log("O Herói " + nome + " está no nível Bronze");
      break;
    case (qtdXp >= 2001 && qtdXp <= 5000):
      console.log("O Herói " + nome + " está no nível Prata");
      break;
    case (qtdXp >= 5001 && qtdXp <= 7000):
      console.log("O Herói " + nome + " está no nível Ouro");
      break;
    case (qtdXp >= 7001 && qtdXp <= 8000):
      console.log("O Herói " + nome + " está no nível Platina");
      break;
     case (qtdXp >= 8001 && qtdXp <= 9000):
      console.log("O Herói " + nome + " está no nível Ascendente");
      break;
    case (qtdXp >= 9001 && qtdXp <= 10000):
      console.log("O Herói " + nome + " está no nível Imortal");
      break;
    case (qtdXp >= 10001):
      console.log("O Herói " + nome + " está no nível Radiante");
      break;
    default:
      console.log("Seu Herói não iniciou a jornada.");
      break;
}