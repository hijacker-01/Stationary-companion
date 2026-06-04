const fs = require('fs');
const path = require('path');
const dir = 'frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace `catch(e) { alert(...) }` or `catch(err) { alert(...) }` with empty catch blocks
  // Since the global interceptor now automatically handles showing the toast!
  code = code.replace(/alert\(err\.response\?\.data\?\.error[^)]+\);?/g, '');
  code = code.replace(/alert\(e\.response\?\.data\?\.error[^)]+\);?/g, '');
  code = code.replace(/alert\([^)]+\);?/g, ''); // aggressive alert removal for remaining generic alerts

  fs.writeFileSync(filePath, code);
}
console.log('Removed alert calls');
