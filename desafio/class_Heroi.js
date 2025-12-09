class Heroi {
    constructor(nome, idade, tipo) {
        this.nome = nome;
        this.idade = idade;
        this.tipo = tipo;
    }

    atacar() {
        let ataque;

        switch (this.tipo) {
            case "mago":
                ataque = "magia";
                break;
            case "guerreiro":
                ataque = "espada";
                break;
            case "monge":
                ataque = "artes marciais";
                break;
            case "ninja":
                ataque = "shuriken";
                break;
            default:
                ataque = "um ataque desconhecido";
        }

        console.log(`O ${this.tipo} atacou usando ${ataque}`);
    }
}

// Exemplos de uso:
const heroi1 = new Heroi("Rael", 22, "mago");
heroi1.atacar();

const heroi2 = new Heroi("Kara", 30, "guerreiro");
heroi2.atacar();

const heroi3 = new Heroi("Shin", 19, "ninja");
heroi3.atacar();