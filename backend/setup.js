#!/usr/bin/env node

/**
 * Setup script for Teacher AI Academy Backend
 * This script helps with initial setup and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Teacher AI Academy Backend Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env file from template...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
    console.log('⚠️  Please edit .env file with your configuration before continuing\n');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    console.log('❌ Failed to install dependencies');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed\n');
}

// Check if data directory exists
const dataPath = path.join(__dirname, 'data');
if (!fs.existsSync(dataPath)) {
  console.log('📁 Creating data directory...');
  fs.mkdirSync(dataPath, { recursive: true });
  console.log('✅ Data directory created\n');
} else {
  console.log('✅ Data directory already exists\n');
}

// Run migrations
console.log('🗄️  Setting up database...');
try {
  execSync('npm run migrate', { stdio: 'inherit' });
  console.log('✅ Database setup completed\n');
} catch (error) {
  console.log('❌ Database setup failed');
  process.exit(1);
}

// Ask if user wants to seed sample data
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🌱 Would you like to seed the database with sample posts? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    try {
      execSync('npm run seed', { stdio: 'inherit' });
      console.log('✅ Sample data seeded\n');
    } catch (error) {
      console.log('❌ Failed to seed sample data');
    }
  }
  
  console.log('🎉 Setup completed successfully!\n');
  console.log('📋 Next steps:');
  console.log('1. Edit .env file with your configuration');
  console.log('2. Run "npm run dev" to start the development server');
  console.log('3. Visit http://localhost:8080/api/health to test the API');
  console.log('4. Check the README.md for detailed usage instructions\n');
  
  rl.close();
});
