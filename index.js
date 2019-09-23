const fs = require('fs');
const rimraf = require('rimraf');
const fetch = require('node-fetch');
const yaml = require('js-yaml');
const execSync = require('child_process').execSync;

const WEEKLY_RECOVERY = 'https://raw.githubusercontent.com/XiaomiFirmwareUpdater/miui-updates-tracker/master/weekly_recovery/weekly_recovery.yml';
const STABLE_RECOVERY = 'https://raw.githubusercontent.com/XiaomiFirmwareUpdater/miui-updates-tracker/master/stable_recovery/stable_recovery.yml';

const GITLAB_API_URL = 'https://gitlab.com/api/v4/projects/14078196/';
const GITLAB_API_TOKEN = process.env.GITLAB_TOKEN;

const WORKDIR = '../work';

async function main() {
    rimraf(WORKDIR, function() {
        fs.mkdirSync(WORKDIR);
    });

    const ignoredDevices = JSON.parse(fs.readFileSync('./ignored-devices.json'));

    console.log("Fetching Weekly recoveries");
    await fetch(WEEKLY_RECOVERY).then(function(response) {
        return response.text();
    }).then(async function(response) {
        const devices = yaml.safeLoad(response);
        for(let device of devices) {
            if (ignoredDevices.includes(device.codename)) {
                continue;
            }
            if (parseFloat(device.android) >= 9.0) {
                console.log("");
                console.log("==================");
                console.log(`${device.device} - ${device.codename}`);
                await updateFiles(device, `${device.codename}-weekly`);
            }
        }
    });

    console.log("Fetching Stable recoveries");
    await fetch(STABLE_RECOVERY).then(function(response) {
        return response.text();
    }).then(async function(response) {
        const devices = yaml.safeLoad(response);
        for(let device of devices) {
            if (ignoredDevices.includes(device.codename)) {
                continue;
            }
            if (parseFloat(device.android) >= 9.0) {
                console.log("");
                console.log("==================");
                console.log(`Weekly - ${device.device} - ${device.codename}`);
                await updateFiles(device, `${device.codename}-stable`);
            }
        }
    });

    console.log("Fetching Stable recoveries");
    await fetch(STABLE_RECOVERY).then(function(response) {
        return response.text();
    }).then(async function(response) {
        const devices = yaml.safeLoad(response);
        for(let device of devices) {
            if (ignoredDevices.includes(device.codename)) {
                continue;
            }
            if (parseFloat(device.android) >= 9.0) {
                console.log("");
                console.log("==================");
                console.log(`Stable - ${device.device} - ${device.codename}`);
                await updateFiles(device, `${device.codename}-stable`);
            }
        }
    });

    rimraf(WORKDIR, function() {
        console.log('Done cleaning up.');
    });
}

async function updateFiles(device, branch) {
    console.log('');

    let commands = `cd ${WORKDIR}`;
    try {
        execSync(`${commands} && git clone https://oauth2:${GITLAB_API_TOKEN}@gitlab.com/xiaomi-vendor-updater-project/mi-vendor-updater.git -b ${branch}`, { stdio: 'inherit' });
    } catch (e) {
        execSync(`${commands} && git clone https://oauth2:${GITLAB_API_TOKEN}@gitlab.com/xiaomi-vendor-updater-project/mi-vendor-updater.git -b empty-branch`, { stdio: 'inherit' });
        execSync(`${commands}/mi-vendor-updater && git branch -m ${branch}`);
    }

    console.log(`Updating .gitlab-ci.yml for ${branch}`);
    const gitlabCI = await getGitlabCI();
    fs.writeFileSync(`${WORKDIR}/mi-vendor-updater/.gitlab-ci.yml`, gitlabCI);

    console.log(`Updating release.sh for ${branch}`);
    const releaseSh = await getRelease();
    fs.writeFileSync(`${WORKDIR}/mi-vendor-updater/release.sh`, releaseSh);

    console.log(`Updating telegram.sh for ${branch}`);
    const telegramSh = await getTelegram();
    fs.writeFileSync(`${WORKDIR}/mi-vendor-updater/telegram.sh`, telegramSh);

    console.log(`Updating ${device.codename}.yml for ${branch}`);
    const fileData = JSON.stringify({
        "device": device.device,
        "version": device.version,
        "download_url": device.download
    });
    fs.writeFileSync(`${WORKDIR}/mi-vendor-updater/${device.codename}.json`, fileData);

    commands = `cd ${WORKDIR}/mi-vendor-updater`;
    try {
        let newCommands = `${commands} && git add .`;
        execSync(`${newCommands}`, { stdio: 'inherit' });

        newCommands = `${commands} && git commit -m "Updated ${device.codename} vendor to ${device.version}"`;
        execSync(`${newCommands}`, { stdio: 'inherit' });

        newCommands = `${commands} && git push origin ${branch}`;
        execSync(`${newCommands}`, { stdio: 'inherit' });
    } catch (e) {
        console.log(`No changes were found for ${device.codename}`);
    }

    console.log(`Cleaning up after ${device.codename}`);
    rimraf.sync(`${WORKDIR}/mi-vendor-updater`);
    console.log(`Done cleaning up after ${device.codename}`);
}

async function getGitlabCI() {
    return fetch(GITLAB_API_URL + `repository/files/.gitlab-ci.yml/raw?ref=empty-branch`, {
        method: 'get',
        headers: {
            'PRIVATE-TOKEN': GITLAB_API_TOKEN
        }
    }).then(function(response) {
        return response.text()
    });
}

async function getRelease() {
    return fetch(GITLAB_API_URL + `repository/files/release.sh/raw?ref=empty-branch`, {
        method: 'get',
        headers: {
            'PRIVATE-TOKEN': GITLAB_API_TOKEN
        }
    }).then(function(response) {
        return response.text()
    });
}

async function getTelegram() {
    return fetch(GITLAB_API_URL + `repository/files/telegram.sh/raw?ref=empty-branch`, {
        method: 'get',
        headers: {
            'PRIVATE-TOKEN': GITLAB_API_TOKEN
        }
    }).then(function(response) {
        return response.text()
    });
}

main();