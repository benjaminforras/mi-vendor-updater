import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import * as Octokat from 'octokat';

const GITHUB_API = 'https://api.github.com/repositories/179057194/releases?page=1';
const REGEX_LINKS = /<(.*?)>/g;

@Injectable({
    providedIn: 'root'
})
export class GithubService {
    prevValue: number;
    devices = [];

    private octo: Octokat;
    private repo: any;

    constructor(private httpClient: HttpClient) {
        this.prevValue = 0;
        this.octo = new Octokat();
        this.repo = this.octo.repos('TryHardDood', 'mi-vendor-updater');
    }

    async getReleases(url) {
        this.devices = [];
        await this.repo.releases.fetch().then(async (releases) => {
            this.devices.push(releases.items);
            await releases.nextPage.fetch().then(async (first) => {
                this.devices.push(first.items);
                await first.nextPage.fetch().then(async (second) => {
                    this.devices.push(second.items);

                    const flat = e => e.reduce(
                        (a, b) => a.concat(Array.isArray(b) ? flat(b) : b), []
                    );
                    this.devices = flat(this.devices);
                });
            });
        });
        return this.devices;
    }

    extractUrlValue(key, url) {
        if (typeof (url) === 'undefined') {
            url = window.location.href;
        }
        const match = url.match('[?&]' + key + '=([^&]+)');
        return match ? match[1] : null;
    }
}
