const fs = require('fs');
const path = require('path');
const dir = 'frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  if (code.includes('import axios from')) {
    // Replace import
    code = code.replace(/import axios from ["']axios["'];?/g, 'import axios from "../api/axios";');
    
    // Remove base URLs since interceptor handles it
    code = code.replace(/http:\/\/localhost:5000\/api/g, '');
    
    // Remove headers since interceptor adds token
    code = code.replace(/, { headers: headers\(\) }/g, '');
    code = code.replace(/headers: headers\(\),?/g, '');
    
    // Fix headers() function if it's unused now, but we can just leave it or remove it
    
    fs.writeFileSync(filePath, code);
  }
}
console.log('Refactored pages to use global axios api');
