const { execSync } = require('child_process');
const path = require('path');
const nodeExe = process.execPath;

// Try to find npm bundled inside this node install
const possibleNpm = [
  path.join(path.dirname(nodeExe), 'npm'),
  path.join(path.dirname(nodeExe), 'npm.cmd'),
  path.join(path.dirname(nodeExe), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
];

const fs = require('fs');
let npmFound = null;
for (const p of possibleNpm) {
  if (fs.existsSync(p)) { npmFound = p; break; }
}

if (npmFound) {
  console.log('Found npm at:', npmFound);
  execSync(`"${nodeExe}" "${npmFound}" install`, {
    stdio: 'inherit',
    cwd: 'C:/Users/opeid/PetAd-Frontend'
  });
} else {
  // Try npx which ships with node
  const npxPaths = [
    path.join(path.dirname(nodeExe), 'npx'),
    path.join(path.dirname(nodeExe), 'npx.cmd'),
  ];
  let npxFound = null;
  for (const p of npxPaths) {
    if (fs.existsSync(p)) { npxFound = p; break; }
  }
  if (npxFound) {
    console.log('Found npx at:', npxFound);
    execSync(`"${npxFound}" --yes pnpm install`, {
      stdio: 'inherit',
      cwd: 'C:/Users/opeid/PetAd-Frontend'
    });
  } else {
    console.log('Neither npm nor npx found alongside node binary at:', path.dirname(nodeExe));
    console.log('Files in node dir:', fs.readdirSync(path.dirname(nodeExe)));
    process.exit(1);
  }
}
