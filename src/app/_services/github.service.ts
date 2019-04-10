import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

const GITHUB_API = 'https://api.github.com/repos/TryHardDood/mi-vendor-updater/releases';
const REGEX_LINKS = /<(.*?)>/g;

@Injectable({
  providedIn: 'root'
})
export class GithubService {

  devices = [];

  constructor(private httpClient: HttpClient) {
  }

  async getReleases(url) {
    if (!url) {
      url = GITHUB_API;
    }

    await this.httpClient.get(url, { observe: 'response' }).subscribe(async (response: HttpResponse<any>) => {
      if (response.headers.get('Link') && response.headers.get('Link').length > 0) {
        const data = response.headers.get('Link').match(REGEX_LINKS);
        if (data.length === 2) {
          this.devices.push(...response.body);
          await this.getReleases(data[0].replace('<', '').replace('>', ''));
        }
      } else {
        this.devices.push(...response.body);
      }
    });
    return this.devices;
  }
}
