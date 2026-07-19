import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Adicione esta linha abaixo se ele estiver vazio ou sem o 'base'
  base: './', 
})