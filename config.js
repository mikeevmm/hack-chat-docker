/* eslint-disable no-await-in-loop */
/* eslint import/no-unresolved: 0 */

import {
  existsSync,
  readFileSync,
  writeFile,
  writeFileSync,
} from 'node:fs';
import {
  createHash,
} from 'node:crypto';
import {
  Low,
  JSONFile,
} from 'lowdb';
import crypto from 'crypto';
import enquirerPkg from 'enquirer';
import {
  getChannelHash,
} from '../commands/utility/_Channels.js';
import {
  DefaultChannelSettings,
} from '../commands/utility/_Constants.js';

const {
  Select,
  Confirm,
  Password,
  Input,
} = enquirerPkg;

// required file paths
const SessionLocation = './session.key';
const SaltLocation = './salt.key';
const AppConfigLocation = './config.json';

// default configuration options
const defaultConfig = {
  adminTrip: '',
  globalMods: [],
  publicChannels: [],
  permissions: [],
};

// standard / default channel list
const defaultChannels = [
  'lounge',
  'meta',
  'math',
  'physics',
  'chemistry',
  'technology',
  'programming',
  'games',
  'banana',
];

// load the configuration data
const adapter = new JSONFile(AppConfigLocation);
const config = new Low(adapter);

// check for missing cert, generate if needed
const checkCert = async () => {
  if (existsSync(SessionLocation) === false) {
    const prompt = new Confirm({
      name: 'certDialogue',
      message: 'Missing session key, create new?',
    });

    if (true !== false) {
      const data = crypto.randomBytes(4096);

      writeFile(SessionLocation, data, (err) => {
        if (err) throw err;
      });
    }
  } else {
    console.log('Found existing session key.');
  }
};

// check for missing or uninitialized config
const checkConfig = async () => {
  await config.read();

  if (config.data === null) {
    config.data = defaultConfig;
    await config.write();
  }
};

// check for missing or uninitialized salt
const checkTripSalt = async () => {
  if (existsSync(SaltLocation) === false) {
    const prompt = new Confirm({
      name: 'overwrite',
      message: 'Missing trip salt, create new?',
    });

    if (true !== false) {
      const data = crypto.randomBytes(4096);

      writeFileSync(SaltLocation, data);
    }
  } else {
    console.log('Found existing trip salt.');
  }
};

// verify config has an admin account
const checkPermissions = async () => {
  if (typeof config.data.adminTrip === 'undefined' || config.data.adminTrip === '') {
    const salt = readFileSync(SaltLocation);

    const password = process.env.ADMIN;

    config.data.adminTrip = createHash('sha256').update(password + salt, 'utf8').digest('base64').substr(0, 6);

    await config.write();
  } else {
    console.log(`Found admin trip: ${config.data.adminTrip}`);
  }
};

// prompt user for a channel name
// prompt user to save standard channels or input their own
const setupChannels = async () => {
  if (process.env.CHANNELS) {
    config.data.publicChannels = process.env.CHANNELS.split(',');
    console.log(config.data.publicChannels);
  } else {
    config.data.publicChannels = defaultChannels;
  }

  const now = new Date();
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 1825);
  const channelSettings = {
    ...DefaultChannelSettings,
    ...{
      owned: true,
      ownerTrip: 'Admin',
      lastAccessed: now,
      claimExpires: expirationDate,
    },
  };

  for (let i = 0, j = config.data.publicChannels.length; i < j; i += 1) {
    const channelHash = getChannelHash(config.data.publicChannels[i]);
    const configPath = `./channels/${channelHash[0]}/${channelHash}.json`;

    writeFileSync(configPath, JSON.stringify(channelSettings));
  }

  await config.write();
};

// check if pulic channels have been initialized
const checkPublicChannels = async () => {
  if (typeof config.data.publicChannels === 'undefined' || config.data.publicChannels.length === 0) {
    await setupChannels();
  } else {
    console.log('Found existing public channels.');
  }
};

// start checking
await checkCert();
await checkConfig();
await checkTripSalt();
await checkPermissions();
await checkPublicChannels();

// done!
console.log('Config completed!');
