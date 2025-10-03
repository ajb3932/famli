const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/famli.db');
const dataDir = path.dirname(DB_PATH);

console.log('========================================');
console.log('FAMLI DATABASE INITIALIZATION');
console.log('========================================');
console.log('Database path:', DB_PATH);
console.log('Data directory:', dataDir);
console.log('Process UID:', process.getuid?.() || 'unknown');
console.log('Process GID:', process.getgid?.() || 'unknown');
console.log('========================================');

try {
  // Check if directory exists
  const dirExists = fs.existsSync(dataDir);
  console.log('Directory exists:', dirExists);

  if (!dirExists) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
    console.log('✓ Created data directory successfully');
  } else {
    // Get directory stats
    const stats = fs.statSync(dataDir);
    console.log('Directory stats:');
    console.log('  - Mode:', stats.mode.toString(8));
    console.log('  - Owner UID:', stats.uid);
    console.log('  - Owner GID:', stats.gid);
    console.log('  - Is Directory:', stats.isDirectory());
  }

  // Check if directory is readable
  console.log('Checking read permissions...');
  fs.accessSync(dataDir, fs.constants.R_OK);
  console.log('✓ Directory is readable');

  // Check if directory is writable
  console.log('Checking write permissions...');
  fs.accessSync(dataDir, fs.constants.W_OK);
  console.log('✓ Directory is writable');

  // Try to create a test file to verify permissions
  console.log('Performing write test...');
  const testFile = path.join(dataDir, '.write-test');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✓ Write test successful');

  console.log('========================================');
  console.log('✓ DATA DIRECTORY CHECK PASSED');
  console.log('========================================');

} catch (err) {
  console.error('========================================');
  console.error('✗ DATA DIRECTORY CHECK FAILED');
  console.error('========================================');
  console.error('Error:', err.message);
  console.error('Error code:', err.code);
  console.error('Error type:', err.constructor.name);
  console.error('');
  console.error('Configuration:');
  console.error('  - Database path:', DB_PATH);
  console.error('  - Data directory:', dataDir);
  console.error('  - Process UID:', process.getuid?.() || 'unknown');
  console.error('  - Process GID:', process.getgid?.() || 'unknown');

  // Try to get directory stats
  try {
    const stats = fs.statSync(dataDir);
    console.error('');
    console.error('Directory permissions:');
    console.error('  - Mode:', stats.mode.toString(8));
    console.error('  - Owner UID:', stats.uid);
    console.error('  - Owner GID:', stats.gid);
    console.error('  - Is Directory:', stats.isDirectory());

    const processUid = process.getuid?.();
    const processGid = process.getgid?.();

    if (processUid !== undefined && processUid !== stats.uid) {
      console.error('');
      console.error('⚠ PERMISSION MISMATCH DETECTED:');
      console.error(`  - Directory is owned by UID ${stats.uid}, GID ${stats.gid}`);
      console.error(`  - Process is running as UID ${processUid}, GID ${processGid}`);
      console.error('');
      console.error('SOLUTION:');
      console.error('  Run this command on the host to fix permissions:');
      console.error(`  sudo chown -R ${processUid}:${processGid} ${dataDir}`);
      console.error('');
      console.error('  Or update docker-compose.yml to run as root:');
      console.error('  user: "0:0"  # Run as root (not recommended)');
    }
  } catch (statErr) {
    console.error('');
    console.error('Could not get directory stats:', statErr.message);
    console.error('The directory may not exist or is completely inaccessible.');
    console.error('');
    console.error('SOLUTION:');
    console.error('  Create the directory with proper permissions:');
    console.error(`  mkdir -p ${dataDir}`);
    console.error(`  chmod 755 ${dataDir}`);
    if (process.getuid?.()) {
      console.error(`  chown ${process.getuid()}:${process.getgid()} ${dataDir}`);
    }
  }

  console.error('========================================');
  console.error('Container will now exit. Fix the permissions and try again.');
  console.error('========================================');

  process.exit(1);
}
