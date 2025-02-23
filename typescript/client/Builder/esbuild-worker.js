console.log('esbuild-worker.js');
importScripts('https://cdn.jsdelivr.net/npm/esbuild-wasm@0.23.0');

let initialized = false;

async function initializeEsbuild() {
  if (!initialized) {
    await esbuild.initialize({ wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.23.0/esbuild.wasm' });
    initialized = true;
  }
}

const virtualModules = {
  name: 'virtual-modules',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      const resolveImport = (importPath) => {
        const normalizedPath = importPath.startsWith('/') ? importPath : `/${importPath}`;
        const possiblePaths = [
          normalizedPath,
          `${normalizedPath}.js`,
          `${normalizedPath}.jsx`, 
          `${normalizedPath}.ts`,
          `${normalizedPath}.tsx`,
          `${normalizedPath}.css`,
          `${normalizedPath}/index.js`,
          `${normalizedPath}/index.jsx`,
          `${normalizedPath}/index.ts`, 
          `${normalizedPath}/index.tsx`
        ];

        if (importPath.startsWith('.')) {
          const currentDir = args.importer.split('/').slice(0, -1).join('/');
          const absolutePath = normalizePath(`${currentDir}/${importPath}`);
          possiblePaths.push(
            absolutePath,
            `${absolutePath}.js`,
            `${absolutePath}.jsx`,
            `${absolutePath}.ts`,
            `${absolutePath}.tsx`,
            `${absolutePath}.css`,
            `${absolutePath}/index.js`,
            `${absolutePath}/index.jsx`,
            `${absolutePath}/index.ts`,
            `${absolutePath}/index.tsx`
          );
        }

        for (const path of possiblePaths) {
          if (path in self.fileContents) {
            return path;
          }
        }
        return null;
      };

      const resolvedPath = resolveImport(args.path);
      if (resolvedPath) {
        return { path: resolvedPath, namespace: 'virtual-modules' };
      }
      return undefined;
    });

    build.onLoad({ filter: /.*/, namespace: 'virtual-modules' }, (args) => {
      if (args.path in self.fileContents) {
        const pathWithoutLeadingDot = args.path.startsWith('.') ? args.path.slice(1) : args.path;
        let loader = 'js';
        if (args.path.endsWith('.jsx')) loader = 'jsx';
        if (args.path.endsWith('.ts')) loader = 'ts';
        if (args.path.endsWith('.tsx')) loader = 'tsx';
        return {
          contents: self.fileContents[pathWithoutLeadingDot],
          loader
        };
      }
    });
  },
};

function normalizePath(path) {
  const parts = path.split('/');
  const result = [];
  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.' && part !== '') {
      result.push(part);
    }
  }
  return '/' + result.join('/');
}

const openartifactPlugin = {
  name: 'openartifact-plugin',
  setup(build) {
    const cache = {};
    const module_host = 'https://cdn.jsdelivr.net';
    const module_url_prefix = '/npm/';

    build.onResolve({ filter: /.*/ }, async (args) => {
      let packageIdentifier = extractPackageIdentifier(args.path);
      let packageName = packageIdentifier.includes('react') || packageIdentifier.includes('three') 
        ? packageIdentifier.replace(/@[\d.]+/, '')
        : packageIdentifier;

      const cached = cache[packageName];
      if (cached) {
        return { path: cached, namespace: 'cdn' };
      } else {
        const packageUrl = `${module_host}${module_url_prefix}${packageIdentifier}/+esm`;
        cache[packageName] = packageUrl;
        return { path: packageUrl, namespace: 'cdn' };
      }
    });

    build.onLoad({ filter: /^https:\/\/cdn.jsdelivr.net\// }, async (args) => {
      const response = await fetch(args.path);
      const contents = await response.text();
      return { contents, loader: 'js' };
    });
  },
};

function extractPackageIdentifier(input) {
  let cleaned = input.replace(/^\/npm\//, '').replace(/\/\+esm$/, '');
  const pattern = /^(@?[\w-]+(?:\/[\w-]+)?)(.*)$/;
  const match = cleaned.match(pattern);
  return match ? match[1] + match[2] : null;
}

self.onmessage = async function(e) {
    if (e.data.type === 'build') {
        self.fileContents = e.data.fileContents;
        
        try {
            await initializeEsbuild();
            const result = await esbuild.build({
                stdin: {
                    contents: e.data.fileContents['/index.tsx'] || e.data.fileContents['/index.jsx'],
                    resolveDir: '',
                    loader: 'tsx'
                },
                bundle: true,
                format: 'esm',
                minify: false,
                keepNames: true,
                jsx: 'automatic',
                target: 'es2020',
                platform: 'browser',
                plugins: [virtualModules, openartifactPlugin],
                write: false,
                loader: { 
                  '.js': 'jsx',
                  '.ts': 'ts',
                  '.tsx': 'tsx',
                  '.css': 'css'
                }
            });

            console.log('result', result);
            const jsFile = result.outputFiles[0].text 

            self.postMessage({ type: 'success', output: JSON.stringify({ js: jsFile, css: '' }) });
            
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
    } else if (e.data.type === 'terminate') {
        console.log('Worker: Termination requested, disposing esbuild...');
        await esbuild.dispose();
        console.log('Worker: Final esbuild disposal complete');
        self.close();
    }
};