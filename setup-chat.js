#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    pink: '\x1b[38;5;206m', // Doki Doki-themed pink
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

console.log(`${colors.fg.pink}${colors.bright}
===============================================
 Doki Doki Productivity Companion Chat Setup
===============================================
${colors.reset}`);

console.log(`${colors.fg.cyan}This script will help you set up the chat functionality for your Doki Doki Productivity Companion.${colors.reset}\n`);

// Step 1: Check if OpenAI package is installed
console.log(`${colors.fg.yellow}Step 1: Checking for required dependencies...${colors.reset}`);

const checkAndInstallDependencies = () => {
  try {
    // Check if package.json exists
    if (!fs.existsSync('./package.json')) {
      console.error(`${colors.fg.red}Error: package.json not found. Make sure you're running this script from the project root.${colors.reset}`);
      process.exit(1);
    }

    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    // Check if openai is in dependencies
    const hasOpenAI = packageJson.dependencies && packageJson.dependencies.openai;
    
    if (!hasOpenAI) {
      console.log(`${colors.fg.yellow}OpenAI package not found. Installing...${colors.reset}`);
      execSync('npm install openai@^4.36.0', { stdio: 'inherit' });
      console.log(`${colors.fg.green}OpenAI package installed successfully!${colors.reset}`);
    } else {
      console.log(`${colors.fg.green}OpenAI package is already installed.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.fg.red}Error checking or installing dependencies:${colors.reset}`, error);
    process.exit(1);
  }
};

// Step 2: Setup environment variables
const setupEnvironmentVariables = () => {
  console.log(`\n${colors.fg.yellow}Step 2: Setting up environment variables...${colors.reset}`);
  
  // Check if .env.local exists
  const envLocalPath = './.env.local';
  const envTemplatePath = './.env.local.template';
  
  if (fs.existsSync(envLocalPath)) {
    console.log(`${colors.fg.yellow}Found existing .env.local file.${colors.reset}`);
    
    rl.question(`${colors.fg.cyan}Would you like to update it? (y/n) ${colors.reset}`, (answer) => {
      if (answer.toLowerCase() === 'y') {
        promptForOpenAIKey();
      } else {
        console.log(`${colors.fg.yellow}Skipping environment variable setup.${colors.reset}`);
        checkFirebaseRules();
      }
    });
  } else if (fs.existsSync(envTemplatePath)) {
    // Copy template to .env.local
    fs.copyFileSync(envTemplatePath, envLocalPath);
    console.log(`${colors.fg.green}Created .env.local from template.${colors.reset}`);
    promptForOpenAIKey();
  } else {
    console.log(`${colors.fg.yellow}No .env.local.template found. Creating .env.local from scratch.${colors.reset}`);
    fs.writeFileSync(envLocalPath, '# Doki Doki Productivity Companion Environment Variables\n\n# OpenAI Configuration\nNEXT_PUBLIC_OPENAI_API_KEY=\n\n# Chat Configuration\nNEXT_PUBLIC_MAX_DAILY_MESSAGES=50\n');
    promptForOpenAIKey();
  }
};

const promptForOpenAIKey = () => {
  rl.question(`${colors.fg.cyan}Please enter your OpenAI API key (leave blank to skip): ${colors.reset}`, (apiKey) => {
    if (apiKey.trim()) {
      // Read current .env.local
      const envLocalPath = './.env.local';
      let envContent = fs.readFileSync(envLocalPath, 'utf8');
      
      // Update or add OPENAI_API_KEY
      if (envContent.includes('NEXT_PUBLIC_OPENAI_API_KEY=')) {
        envContent = envContent.replace(/NEXT_PUBLIC_OPENAI_API_KEY=.*/, `NEXT_PUBLIC_OPENAI_API_KEY=${apiKey.trim()}`);
      } else {
        envContent += `\nNEXT_PUBLIC_OPENAI_API_KEY=${apiKey.trim()}\n`;
      }
      
      // Write updated content back
      fs.writeFileSync(envLocalPath, envContent);
      console.log(`${colors.fg.green}OpenAI API key saved to .env.local!${colors.reset}`);
    } else {
      console.log(`${colors.fg.yellow}Skipped adding OpenAI API key.${colors.reset}`);
    }
    
    checkFirebaseRules();
  });
};

// Step 3: Check Firebase rules
const checkFirebaseRules = () => {
  console.log(`\n${colors.fg.yellow}Step 3: Checking Firebase security rules...${colors.reset}`);
  
  const firebaseRulesPath = './firestore.rules';
  
  if (fs.existsSync(firebaseRulesPath)) {
    const rulesContent = fs.readFileSync(firebaseRulesPath, 'utf8');
    
    // Check if chat rules exist
    if (rulesContent.includes('match /chats/{chatId}')) {
      console.log(`${colors.fg.green}Firebase security rules for chat already set up.${colors.reset}`);
    } else {
      console.log(`${colors.fg.yellow}Chat rules not found in firestore.rules.${colors.reset}`);
      console.log(`${colors.fg.cyan}Please add the following to your Firestore security rules:${colors.reset}`);
      console.log(`
${colors.fg.white}// Rules for chat subcollection
match /users/{userId}/chats/{chatId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Rules for settings subcollection (for chat usage limits)
match /users/{userId}/settings/{settingId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}${colors.reset}
`);
    }
  } else {
    console.log(`${colors.fg.yellow}No firestore.rules file found.${colors.reset}`);
    console.log(`${colors.fg.cyan}Please create a firestore.rules file with appropriate security rules.${colors.reset}`);
  }
  
  showFinalInstructions();
};

// Step 4: Final instructions
const showFinalInstructions = () => {
  console.log(`\n${colors.fg.green}${colors.bright}Setup completed!${colors.reset}`);
  console.log(`
${colors.fg.cyan}Next steps:${colors.reset}
1. Make sure you have set up your OpenAI API key in .env.local
2. Update your Firebase security rules if needed
3. Restart your development server with ${colors.fg.white}npm run dev${colors.reset}
4. Visit the chat page to start chatting with your Doki Doki companions!

${colors.fg.pink}For more information, see the CHATBOT_SETUP.md file.${colors.reset}
`);
  
  rl.close();
};

// Run the steps
checkAndInstallDependencies();
setupEnvironmentVariables(); 