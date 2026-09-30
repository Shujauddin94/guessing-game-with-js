const { execSync } = require('child_process');
const output = execSync('git --no-pager log -10 --format="%H | %an | %ae | %cd"', { encoding: 'utf-8' });
console.log(output);
