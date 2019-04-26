import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';

const GITHUB_API = 'https://api.github.com/repos/TryHardDood/mi-vendor-updater/releases';
const REGEX_LINKS = /<(.*?)>/g;

@Injectable({
    providedIn: 'root'
})
export class GithubService {
    prevValue: number;
    devices = [];

    constructor(private httpClient: HttpClient) {
        this.prevValue = 1;
    }

    async getReleases(url) {
        if (!url) {
            url = GITHUB_API;
        }

        await this.httpClient.get(url, {observe: 'response'}).subscribe(async (response: HttpResponse<any>) => {
            if (response.headers.get('Link') && response.headers.get('Link').length > 0) {
                const data = response.headers.get('Link').match(REGEX_LINKS);
                console.log(data);
                if (data.length === 2) {
                    console.log(data[1]);
                    this.devices.push(...response.body);
                    const newUrl = data[1].replace('<', '').replace('>', '');
                    const newValue = this.extractUrlValue('page', newUrl);
                    if (this.prevValue < newValue) {
                        await this.getReleases(newUrl);
                    }
                }
            } else {
                this.devices.push(...response.body);
            }
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
