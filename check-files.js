// Test to check if routes have syntax errors or missing dependencies

const fs = require('fs');
const path = require('path');

async function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for basic syntax issues
    if (content.includes('export async function GET') && !content.includes('NextRequest')) {
      console.log(`⚠️  ${path.basename(filePath)}: GET function without NextRequest import`);
    }
    
    if (content.includes('export async function POST') && !content.includes('NextResponse')) {
      console.log(`⚠️  ${path.basename(filePath)}: POST function without NextResponse import`);
    }
    
    // Check for hanging braces
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      console.log(`❌ ${path.basename(filePath)}: Brace mismatch (${openBraces} open, ${closeBraces} close)`);
    }
    
    console.log(`✓ ${path.basename(filePath)}`);
  } catch (error) {
    console.log(`⚠️  ${path.basename(filePath)}: ${error.message}`);
  }
}

console.log('Checking critical API files...\n');

const files = [
  'app/api/auth/route.ts',
  'app/api/admin/roles/route.ts',
  'app/api/admin/staff/route.ts',
  'app/login/page.tsx',
  'app/page.tsx',
  'app/layout.tsx',
  'components/Header.tsx',
];

for (const file of files) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    checkFile(fullPath);
  } else {
    console.log(`❌ ${file}: NOT FOUND`);
  }
}
