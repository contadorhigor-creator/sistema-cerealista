const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log("Criando dados iniciais...");

    // 1. Criar a Empresa (Cerealista União)
    const empresa = await prisma.empresa.create({
        data: {
            nomeFantasia: 'Cerealista União',
            cnpj: '00.000.000/0001-00',
            email: 'contato@cerealistauniao.com.br',
            cidade: 'Cardoso',
            estado: 'SP'
        }
    });

    // 2. Criar a senha criptografada (hash)
    const senhaHash = await bcrypt.hash('123456', 10);

    // 3. Criar o Usuário Administrador vinculado à empresa
    await prisma.usuario.create({
        data: {
            nome: 'Administrador Higor',
            email: 'admin@cerealistauniao.com.br',
            senhaHash: senhaHash,
            empresaId: empresa.id,
            perfil: 'Administrador'
        }
    });

    console.log("✅ Usuário e Empresa criados com sucesso!");
    console.log("E-mail: admin@cerealistauniao.com.br | Senha: 123456");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });