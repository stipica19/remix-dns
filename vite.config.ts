import { vitePlugin as remix } from '@remix-run/dev'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { flatRoutes } from 'remix-flat-routes'

export default defineConfig({
  plugins: [
    remix({ 
      routes(defineRoutes) {
        return flatRoutes('routes', defineRoutes, {
          ignoredRouteFiles: ['**/.*'], // Ignore dot files (like .DS_Store)
          //appDir: 'app',
          //routeDir: 'routes',
          //basePath: '/',
          //paramPrefixChar: '$',
          //nestedDirectoryChar: '+',
          //routeRegex: /((\${nestedDirectoryChar}[\/\\][^\/\\:?*]+)|[\/\\]((index|route|layout|page)|(_[^\/\\:?*]+)|([^\/\\:?*]+\.route)))\.(ts|tsx|js|jsx|md|mdx)$$/,
        })
      }, 
    }),
    tsconfigPaths(),
    // ...
  ]
})