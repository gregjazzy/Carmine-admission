import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        coursParticuliers: resolve(__dirname, 'cours-particuliers.html'),
        preparationSat: resolve(__dirname, 'preparation-sat.html'),
        about: resolve(__dirname, 'about.html'),
        temoignages: resolve(__dirname, 'temoignages.html'),
        consultingAdmissions: resolve(__dirname, 'consulting-admissions.html'),
        integrationScolaire: resolve(__dirname, 'integration-scolaire.html'),
        thankYou: resolve(__dirname, 'thank-you.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
