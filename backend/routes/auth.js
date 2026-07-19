import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    // 1. Busca o usuário pelo email
    const usuario = await prisma.usuario.findUnique({
      where: { email: email }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // 2. Compara a senha digitada com o hash no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Senha inválida' });
    }

    // 3. Gera o token (JWT)
    const token = jwt.sign(
      { id: usuario.id, empresaId: usuario.empresaId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, nome: usuario.nome });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;