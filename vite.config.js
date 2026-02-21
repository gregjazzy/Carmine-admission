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
        about: resolve(__dirname, 'about.html'),
        temoignages: resolve(__dirname, 'temoignages.html'),
        consultingAdmissions: resolve(__dirname, 'consulting-admissions.html'),
        thankYou: resolve(__dirname, 'thank-you.html'),
        blog: resolve(__dirname, 'blog.html'),
        blogArticle1: resolve(__dirname, 'blog/integrer-jeanine-manuel-retour-expatriation.html'),
        blogArticle2: resolve(__dirname, 'blog/ejm-franklin-saint-germain-choisir-lycee-expat.html'),
        blogArticle3: resolve(__dirname, 'blog/ib-ou-bfi-impact-admissions-ivy-league-epfl.html'),
        blogArticle4: resolve(__dirname, 'blog/retour-expatriation-erreurs-orientation.html'),
        blogArticle5: resolve(__dirname, 'blog/sections-internationales-vs-bfi-comparatif.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
