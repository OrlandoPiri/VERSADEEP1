// import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    // ADD THIS SECTION:
    // csrf: {
    //   checkOrigin: false, // Disable the default origin check NOTE: This is not recommended for production, but it's necessary for development with remote functions ALSO `config.kit.csrf.checkOrigin` has been deprecated in favour of `csrf.trustedOrigins`. It will be removed in a future version
    //   // trustedOrigins: ['http://localhost:5173', 'http://localhost:5174'], // Add any other trusted origins here
    // },
    experimental: {
      remoteFunctions: true
    }
  },
  compilerOptions: {
    experimental: { async: true } // ← required for await in $derived
  }
};

export default config;

// import adapter from '@sveltejs/adapter-auto';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {
//   preprocess: vitePreprocess(),
//   kit: {
//     adapter: adapter(),
//       experimental: {
//     remoteFunctions: true
//   },
//     csrf: {
//       // This is the new way that replaces checkOrigin
//       // It tells SvelteKit to trust your local dev environment
//       trustedOrigins: ['http://localhost:5173', 'http://localhost:5174'],
//     },
//   },
// };

// export default config;
