import { cp, rm } from 'node:fs/promises';

await rm('www', { recursive: true, force: true });
await cp('dist/prueba-desarrollador-full-stack/browser', 'www', { recursive: true });
console.log('Contenido web sincronizado en www.');
