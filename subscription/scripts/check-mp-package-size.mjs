import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
const root = resolve(process.argv[2] || 'unpackage/dist/build/mp-weixin');
const config = JSON.parse(await readFile(resolve(root, 'project.config.json'), 'utf8'));
const ignored = config.packOptions?.ignore || [];
function excluded(path) {
 return ignored.some(rule => rule.type === 'file' ? path === rule.value : rule.type === 'folder' && (path === rule.value || path.startsWith(rule.value + '/')));
}
let bytes = 0, count = 0;
async function walk(dir) {
 for (const entry of await readdir(dir, {withFileTypes:true})) {
  const path = resolve(dir, entry.name);
  const name = relative(root, path).replaceAll('\\', '/');
  if (excluded(name)) continue;
  if(entry.isDirectory()) await walk(path);
  else { bytes += (await stat(path)).size; count++; }
 }
}
await walk(root);
const limit = 2 * 1024 * 1024;
const sharing = 'static/share-card-blue.png';
if(excluded(sharing)) throw new Error('分享封面被错误排除');
await stat(resolve(root,sharing));
console.log(JSON.stringify({root, files:count, bytes, kilobytes:Math.ceil(bytes/1024), limit, remaining:limit-bytes},null,2));
if(bytes >= limit) throw new Error('发布包超过2MB，请检查静态资源及分包');
