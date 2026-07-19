// 1. Carrega as variáveis de ambiente (deve ser a primeira linha)
require('dotenv').config(); 

// 2. Importações necessárias
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// 3. Inicialização
const prisma = new PrismaClient();
const app = express();

// 4. Middlewares
app.use(cors());
app.use(express.json());

// Log de requisições para debug no terminal
app.use((req, res, next) => {
  console.log(`Recebi um pedido: ${req.method} ${req.url}`);
  next();
});

// 5. Rota de Login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // Busca o usuário no banco pelo e-mail
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { empresa: true } // Traz os dados da empresa vinculada
    });

    // Se o usuário não existir
    if (!usuario) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // Compara a senha digitada com o hash no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    
    if (!senhaValida) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // Gera o Token JWT
    const token = jwt.sign(
      { userId: usuario.id, empresaId: usuario.empresaId }, 
      process.env.JWT_SECRET || 'segredo-super-forte', 
      { expiresIn: '8h' }
    );

    // Retorna os dados para o frontend
    res.json({
      token,
      usuario: {
        nome: usuario.nome,
        perfil: usuario.perfil,
        empresaId: usuario.empresaId,
        nomeEmpresa: usuario.empresa.nomeFantasia
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

// 6. Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});