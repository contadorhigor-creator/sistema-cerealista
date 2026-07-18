require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());
// Este código vai imprimir no terminal tudo o que chega no servidor
app.use((req, res, next) => {
  console.log(`Recebi um pedido: ${req.method} ${req.url}`);
  next();
});

// Rota de Login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Busca o usuário no banco pelo e-mail
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { empresa: true } // Traz os dados da empresa junto
    });

    if (!usuario) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // 2. Compara a senha digitada com a senha criptografada (hash) no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    
    if (!senhaValida) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // 3. Gera o Token JWT (o "crachá" do usuário)
    const token = jwt.sign(
      { userId: usuario.id, empresaId: usuario.empresaId }, 
      process.env.JWT_SECRET || 'segredo-super-forte', 
      { expiresIn: '8h' }
    );

    // 4. Retorna os dados para o seu React
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
    res.status(500).json({ error: "Erro interno no servidor." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});