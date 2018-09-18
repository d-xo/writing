const IPFS = require('ipfs-mini');
const fs = require('mz/fs');
const md = require('markdown-it')();
const mk = require('markdown-it-katex');
const decode = require('unescape');

md.use(mk);

const infura = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const local = new IPFS({
  host: '127.0.0.1',
  port: 5001,
  protocol: 'http'
});

const katex = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css'
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

const build = async path => {
  const raw = await fs.readFile(path);
  const rendered = md.render(raw.toString());
  return `${prefix}\n${rendered}\n${suffix}`;
};

const publish = async (data, node) => {
  const cid = await new Promise((resolve, reject) => {
    node.add(data, (err, result) => {
      if (err) reject(new Error(err));
      resolve(result);
    });
  });
  return cid;
};

const main = async () => {
  const data = await build(process.argv['2']);
  const cid = await publish(data, local);
  await publish(data, infura);
  console.log(`url: https://ipfs.io/ipfs/${cid}`);
};

main();
