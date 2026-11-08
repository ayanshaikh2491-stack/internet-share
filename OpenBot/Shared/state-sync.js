// state-sync.js - Shared state management for all OpenBot agents
// Usage: node state-sync.js <agent-id> <action> [file]
// Actions: pull, push, status, merge

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SHARED_DIR = 'C:\\Users\\TAUSHEF\\OpenBot\\Shared';
const STATE_FILE = path.join(SHARED_DIR, 'agent-state.json');
const GIT_REPO = 'C:\\Users\\TAUSHEF';

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { agents: {}, lastUpdated: null, version: 1 };
  }
}

function saveState(state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function gitCmd(cmd) {
  try {
    return execSync(`git ${cmd}`, { cwd: GIT_REPO, encoding: 'utf8', timeout: 30000 }).trim();
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

function pull() {
  console.log('Pulling latest from origin...');
  const out = gitCmd('pull origin master');
  console.log(out);
  // Also pull feature branch if exists
  try {
    const branch = gitCmd('rev-parse --abbrev-ref HEAD').trim();
    if (branch !== 'master') {
      gitCmd(`pull origin ${branch}`);
    }
  } catch {}
  return out;
}

function push(message) {
  const msg = message || `Agent state update ${new Date().toISOString()}`;
  console.log('Staging shared files...');
  gitCmd('add OpenBot/Shared/agent-state.json OpenBot/Shared/Leads/ OpenBot/Shared/Reports/ OpenBot/Shared/Data/ 2>nul');
  console.log('Committing...');
  const commit = gitCmd(`commit -m "${msg}"`);
  console.log(commit);
  console.log('Pushing...');
  const push = gitCmd('push');
  console.log(push);
  return push;
}

function updateAgentState(agentId, status, task, data) {
  const state = loadState();
  if (!state.agents) state.agents = {};
  state.agents[agentId] = {
    status,
    task,
    data,
    lastActive: new Date().toISOString()
  };
  saveState(state);
  console.log(`Updated ${agentId}: ${status} - ${task}`);
}

function getAgentState(agentId) {
  const state = loadState();
  return state.agents?.[agentId] || null;
}

function getAllStates() {
  const state = loadState();
  return state.agents || {};
}

// CLI
const args = process.argv.slice(2);
const agentId = args[0] || 'unknown';
const action = args[1] || 'status';

switch (action) {
  case 'pull':
    pull();
    break;
  case 'push':
    push(args[2] || `Update from ${agentId}`);
    break;
  case 'status':
    console.log(JSON.stringify(getAllStates(), null, 2));
    break;
  case 'update':
    updateAgentState(agentId, args[2], args[3], args[4] ? JSON.parse(args[4]) : {});
    break;
  case 'get':
    console.log(JSON.stringify(getAgentState(agentId), null, 2));
    break;
  default:
    console.log('Usage: node state-sync.js <agentId> <pull|push|status|update|get> [args]');
}