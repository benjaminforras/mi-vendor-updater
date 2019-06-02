import {Injectable} from '@angular/core';

import * as Octokat from 'octokat';
import {MatSnackBar} from '@angular/material';
import {GithubRelease} from '../_pages/index-component/index.component';

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  public devices = [];
  public error = false;

  private prevValue: number;
  private octo: Octokat;
  private repo: any;

  constructor(private snackBar: MatSnackBar) {
    this.prevValue = 0;
    this.octo = new Octokat();
    this.repo = this.octo.repos('TryHardDood', 'mi-vendor-updater');
  }

  async getRelease(id: number) {
    let release: GithubRelease;
    await this.repo.releases(id).fetch().then(async (response) => {
      release = response;
    });
    return release;
  }

  async getReleases() {
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
    }).catch((e) => {
      this.error = true;
      this.snackBar.open('Couldn\'t fetch the releases from Github. Please use our Telegram channel to download vendor files..', 'Okay', {
        duration: 100000,
      });
    });
    return this.devices;
  }
}
