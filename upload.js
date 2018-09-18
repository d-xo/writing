const fs = require('mz/fs');
const md = require('markdown-it')();
const mk = require('markdown-it-katex');
const { resolve } = require('path');
const IPFS = require('ipfs');
const fetch = require('node-fetch');

md.use(mk);

// --------------------------------------------------------------------------------------------
// HTML
// --------------------------------------------------------------------------------------------

const katex =
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css';
const githubMarkdown =
  'https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css';

const prefix = `
<!doctype html>
<html>

<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, minimal-ui">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css">
<link rel="stylesheet" href="${katex}">
<link rel="stylesheet" href="${githubMarkdown}">
<style>
	.markdown-body {
		box-sizing: border-box;
		min-width: 200px;
		max-width: 1000px;
		margin: 0 auto;
		padding: 45px;
	}

	@media (max-width: 767px) {
		.markdown-body {
			padding: 15px;
		}
	}
</style>
</head>

<body>
<article class="markdown-body">
`;

const suffix = `
</article>
</body>
</html>
`;

// --------------------------------------------------------------------------------------------
// UTIL
// --------------------------------------------------------------------------------------------

const mkdir = async (path, root) => {
  var dirs = path.split('/'),
    dir = dirs.shift(),
    root = (root || '') + dir + '/';

  try {
    await fs.mkdir(root);
  } catch (e) {
    //dir wasn't made, something went wrong
    if (!(await fs.stat(root)).isDirectory()) throw new Error(e);
  }

  return !dirs.length || mkdir(dirs.join('/'), root);
};

const flatten = array => {
  return [].concat(...array);
};

const mdToHtml = path => {
  return path.replace(new RegExp('.md$'), '.html');
};

const stripRoot = (root, path) => {
  return path.replace(new RegExp('^' + resolve(root) + '/'), '');
};

// --------------------------------------------------------------------------------------------
// READ FILES
// --------------------------------------------------------------------------------------------

const getFiles = async root => {
  const subdirs = await fs.readdir(root);
  const files = await Promise.all(
    subdirs.map(async subdir => {
      const res = resolve(root, subdir);
      return (await fs.stat(res)).isDirectory() ? getFiles(res) : res;
    })
  );

  return flatten(files);
};

const getMarkdownFiles = async root => {
  const files = await getFiles(root);
  return files.filter(path => path.endsWith('.md'));
};

// --------------------------------------------------------------------------------------------
// RENDER MARKDOWN
// --------------------------------------------------------------------------------------------

const renderFile = async input => {
  const raw = await fs.readFile(input);
  const rendered = md.render(raw.toString());
  return `${prefix}\n${rendered}\n${suffix}`;
};

const renderDir = async root => {
  const input = await getMarkdownFiles(root);

  const promises = input.map(async path => {
    const slug = `/writing/${mdToHtml(stripRoot(root, path))}`;
    const data = await renderFile(path);
    return { path: slug, content: Buffer.from(data) };
  });

  return await Promise.all(promises);
};

// --------------------------------------------------------------------------------------------
// IPFS
// --------------------------------------------------------------------------------------------

const addFolder = async (node, folder) => {
  const files = await renderDir(folder);
  return await node.files.add(files);
};

const pin = async hash => {
  const infura = 'https://ipfs.infura.io:5001';
  const url = `api/v0/pin/add?arg=${hash}&recursive=true`;
  const res = await fetch(`${infura}/${url}`);
  return await res.text();
};

// --------------------------------------------------------------------------------------------
// MAIN
// --------------------------------------------------------------------------------------------

const main = async () => {
  const folder = process.argv['2'];
  const node = new IPFS();

  node.on('ready', async () => {
    const addedFiles = await addFolder(node, folder);
    const hash = addedFiles[0].hash;
    await pin(hash);
    console.log(`https://ipfs.io/ipfs/${hash}`);
    process.exit();
  });
};

main();
