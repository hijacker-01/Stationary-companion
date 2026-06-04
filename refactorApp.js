const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Find all lines that look like: import X from "./pages/Y";
// and replace with: const X = React.lazy(() => import("./pages/Y"));

content = content.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+["'](\.\/pages\/[^"']+)["'];/g, 
  'const $1 = React.lazy(() => import("$2"));');

// Add React and Suspense to top if not present
if (!content.includes('import React, { Suspense }')) {
  content = content.replace(
    'import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";',
    'import React, { Suspense } from "react";\nimport { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";'
  );
}

// Wrap Routes inside Suspense
if (!content.includes('<Suspense')) {
  content = content.replace(
    /<Routes>/g,
    '<Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading Module...</div>}>\n          <Routes>'
  );
  content = content.replace(
    /<\/Routes>/g,
    '</Routes>\n        </Suspense>'
  );
}

fs.writeFileSync('frontend/src/App.jsx', content, 'utf8');
console.log("App.jsx refactored for lazy loading!");
