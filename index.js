require('dotenv').config();

const fs = require('fs');
const request = require('request');
const jsonDiff = require('json-diff');

let { PythonShell } = require('python-shell');
const { exec } = require('child_process');

const Octokit = require('@octokit/rest')
const octokit = new Octokit({
    auth: 'token ' + process.env.GITHUB_TOKEN,
    baseUrl: 'https://api.github.com'
});

// Telegram bot
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const TELEGRAM_CHANNEL = '@MIUIVendorUpdater';

const UPDATER_LINK_STABLE = "https://raw.githubusercontent.com/XiaomiFirmwareUpdater/miui-updates-tracker/master/stable_recovery/stable_recovery.json";
const UPDATER_LINK_WEEKLY = "https://raw.githubusercontent.com/XiaomiFirmwareUpdater/miui-updates-tracker/master/weekly_recovery/weekly_recovery.json";

const stable_devices = ['beryllium_global', 'cappu', 'capricorn', 'capricorn_global', 'cepheus', 'cepheus_eea_global', 'chiron', 'chiron_global',
    'clover', 'dipper', 'dipper_global', 'equuleus', 'equuleus_global', 'grus',
    'helium', 'helium_global', 'hydrogen', 'hydrogen_global', 'jason',
    'jason_global', 'kate_global', 'land', 'land_global', 'lavender', 'lavender_in_global', 'lithium',
    'lithium_global', 'markw', 'mido', 'mido_global', 'natrium', 'natrium_global', 'nitrogen', 'nitrogen_global',
    'onclite', 'oxygen', 'oxygen_global', 'perseus', 'perseus_global', 'platina', 'platina_global', 'polaris', 'polaris_global',
    'prada', 'riva', 'riva_global', 'rolex', 'rolex_global', 'rosy', 'rosy_global', 'sagit',
    'sagit_global', 'sakura', 'sakura_india_global', 'santoni', 'santoni_global', 'scorpio',
    'scorpio_global', 'sirius', 'tiffany', 'tulip_global', 'ursa', 'ugg', 'ugg_global', 'ugglite',
    'ugglite_global', 'violet', 'violet_in_global', 'vince', 'vince_global', 'wayne', 'whyred', 'whyred_global', 'ysl', 'ysl_global'];

const weekly_devices = ['beryllium_global', 'cappu', 'capricorn', 'capricorn_global', 'cepheus', 'cepheus_global', 'chiron', 'chiron_global', 'clover',
    'dipper', 'dipper_global', 'equuleus', 'equuleus_global', 'helium', 'helium_global', 'hydrogen',
    'hydrogen_global', 'jason', 'jason_global', 'kate_global', 'land', 'land_global', 'lavender', 'lithium',
    'lithium_global', 'markw', 'mido', 'mido_global', 'natrium', 'natrium_global', 'nitrogen', 'nitrogen_global',
    'oxygen', 'oxygen_global', 'perseus', 'perseus_global', 'platina', 'platina_global', 'polaris', 'polaris_global',
    'prada', 'riva', 'riva_global', 'rolex', 'rolex_global', 'rosy', 'rosy_global', 'sagit',
    'sagit_global', 'sakura', 'sakura_india_global', 'santoni', 'santoni_global', 'scorpio',
    'scorpio_global', 'sirius', 'tiffany', 'tulip_global', 'ursa', 'ugg', 'ugg_global', 'ugglite',
    'ugglite_global', 'vince', 'vince_global', 'wayne', 'whyred', 'whyred_global', 'ysl', 'ysl_global'];

// const arb_devices = ['nitrogen', 'nitrogen_global', 'sakura', 'sakura_india_global', 'wayne', 'whyred', 'whyred_global']

const versions = ['stable', 'weekly'];

let stable_all, weekly_all;

let stable = [], weekly = [];

let devices_all, devices, branch;

let main = async () => {
    await new Promise(resolve => request(UPDATER_LINK_STABLE, ((error, response, body) => {
        if (error) console.log(error);

        stable_all = JSON.parse(body);
        resolve();
    })));

    await new Promise(resolve => request(UPDATER_LINK_WEEKLY, ((error, response, body) => {
        if (error) console.log(error);

        weekly_all = JSON.parse(body);
        resolve();
    })));

    for (let v of versions) {
        if (fs.existsSync(v + '.json')) {
            fs.renameSync(v + '.json', v + '_old.json');
        }

        if (v == 'stable') {
            devices_all = stable_all;
            devices = stable_devices;
            branch = stable;
        }
        else if (v == "weekly") {
            devices_all = weekly_all;
            devices = weekly_devices;
            branch = weekly;
        }


        for (let i of devices_all) {
            codename = i.codename;
            if (devices.indexOf(codename) > -1) {
                let obj = {}; obj[codename] = i.filename.split('_')[1] + '_' + i.filename.split('_')[2];
                branch.push(obj);
            }
        }
        fs.writeFileSync(v + '.json', JSON.stringify(branch, null, 4));

        if (fs.existsSync(v + '_old.json') && fs.existsSync(v + '.json')) {
            let o = fs.readFileSync(v + '_old.json');
            let n = fs.readFileSync(v + '.json');
            let diff = jsonDiff.diff(JSON.parse(o), JSON.parse(n), { verbose: true });
            if (!diff) {
                console.log("No changes found for " + v);
            }
            else {
                let links = [];
                for (let change of Object.keys(diff)) {
                    if (diff[change][0].indexOf('+') > -1) {
                        for (let codename of Object.keys(diff[change][1])) {
                            for (let info of devices_all) {
                                if (info.filename.split('_')[1] + '_' + info.filename.split('_')[2] == diff[change][1][codename]) {
                                    let obj = { codename: codename, filename: info.filename, download: info.download, device: info.device, android: info.android, version: info.version };
                                    links.push(obj);
                                    console.log("New version for " + codename + " is available (" + info.filename + ")");
                                }
                            }
                        }
                    }
                }
                for (let link of links) {
                    console.log("starting download: " + link.filename);
                    await new Promise(resolve => request(link.download).pipe(fs.createWriteStream(link.filename)).on('finish', resolve));
                    console.log(link.filename + ' downloaded');

                    await new Promise((resolve) => {
                        var options = {
                            scriptPath: 'xiaomi-flashable-firmware-creator.py',
                            args: ['-V', link.filename]
                        };
                        PythonShell.run('create_flashable_firmware.py', options, function(err, results) {
                            if (err) throw err;
                            resolve(results);
                        });
                    });
                    fs.unlinkSync(link.filename);

                    var file = fs.readdirSync('.').filter(fn => fn.startsWith('fw-vendor_') && fn.endsWith('.zip'))[0];
                    console.log("done generating vendor: " + file);

                    const tagname = link.codename + '-' + v;
                    let result;
                    try {
                        result = await octokit.repos.getReleaseByTag({ owner: 'TryHardDood', repo: 'mi-vendor-updater', tag: tagname });
                        console.log('Release found by tag. (' + tagname + ')');
                    } catch (e) {
                        console.log('Release not found. Creating it.');
                        try {
                            result = await octokit.repos.createRelease({ owner: 'TryHardDood', repo: 'mi-vendor-updater', tag_name: tagname, name: tagname, body: "Autogenerated firmware+vendor files without anti-rollback protection. \n\n\n- Credits: [XiaomiFirmwareUpdater/xiaomi-flashable-firmware-creator.py](https://github.com/XiaomiFirmwareUpdater/xiaomi-flashable-firmware-creator.py)", draft: false, prerelease: false });
                            console.log('Release created (' + tagname + '/' + result.data.id + ')');
                        } catch (e2) {
                            console.log('Couldn\'t create release:');
                            console.error(e);
                        }
                    }

                    try {
                        await octokit.repos.uploadReleaseAsset({ headers: { "content-length": fs.statSync(file).size, "content-type": "application/octet-stream" }, url: result.data.upload_url, name: file, label: file, file: fs.createReadStream(file) });
                        console.log(file + ' uploaded');

                        console.log("Sending telegram message.");
                        let telegram_message = "New firmware+vendor update available!: \n*Device:* " + link.device + " \n*Codename:* `" + link.codename + "` \n" +
                            "*Version:* `" + link.version + "` \n*Android:* " + link.android + " \nFilename: `" + file + "` \nFilesize: " + (fs.statSync(file).size / 1000000.0) + "MB \n" +
                            "*Download:* [Here](https://github.com/TryHardDood/mi-vendor-updater/releases/" + link.codename + "-" + v + ")\n@XiaomiFirmwareUpdater | @MIUIVendorUpdater";
                        try {
                            await bot.telegram.sendMessage(TELEGRAM_CHANNEL, telegram_message, {parse_mode: 'markdown'});
                        } catch(e3) {
                            console.log('Error sending telegram message:');
                            console.log(telegram_message);
                            console.error(e3);
                        }
						
						await new Promise((resolve) => {
							var options = {
								scriptPath: '.',
								args: [file]
							};
							PythonShell.run('upload-to-telegram.py', options, function(err, results) {
								if (err) throw err;
								resolve(results);
							});
						});
                    } catch (e) {
                        console.log('Couldn\'t upload asset');
                        console.error(e);
                    }

                    fs.unlinkSync(file);
                }
            }
        }
    }
    exec("git add stable.json weekly.json && git -c \"user.name=TryHardDood\" -c \"user.email=rsnconfigs@gmail.com\" commit -m \"sync: {0}\" && git push -q https://{1}@github.com/TryHardDood/mi-vendor-updater.git HEAD:master".replace("{0}", new Date().toISOString()).replace("{1}", process.env.GITHUB_TOKEN), (err, stdout, stderr) => {
        if (err) {
            return;
        }

        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
    console.log("Done");
}

main();
