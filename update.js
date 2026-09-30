const fs = require('fs');
const { execSync } = require('child_process');

function updateAndCommit(targetRegex, replacement, msg) {
  let content = fs.readFileSync('script.js', 'utf8');
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync('script.js', content);
  try {
    execSync('git add script.js', { stdio: 'inherit' });
    execSync('git commit -m "' + msg + '"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('Committed and pushed:', msg);
  } catch (e) {
    console.error('Git error on ' + msg + ': ' + e);
  }
}

updateAndCommit(
  /const loadAchievements = \(\) => \{\r?\n  const saved = localStorage\.getItem\(ACHIEVEMENTS_KEY\);/,
  '/**\n * Loads achievements from local storage\n */\nconst loadAchievements = () => {\n  const saved = localStorage.getItem(ACHIEVEMENTS_KEY);',
  'docs: add JSDoc to loadAchievements'
);

updateAndCommit(
  /const updateAchievementsDisplay = \(\) => \{\r?\n  const unlocked = Object\.entries\(achievements \|\| \{\}\)/,
  '/**\n * Updates the visual display of achievements in the UI\n */\nconst updateAchievementsDisplay = () => {\n  const unlocked = Object.entries(achievements || {})',
  'docs: add JSDoc to updateAchievementsDisplay'
);

updateAndCommit(
  /const saveAchievements = \(\) => \{\r?\n  localStorage\.setItem\(ACHIEVEMENTS_KEY, JSON\.stringify\(achievements\)\);/,
  '/**\n * Saves current achievements to local storage and updates UI\n */\nconst saveAchievements = () => {\n  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));',
  'docs: add JSDoc to saveAchievements'
);
