import {Injectable} from '@angular/core';

import * as Octokat from 'octokat';
import {MatSnackBar} from '@angular/material';

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

  async getReleases() {
    this.devices = [];

    this.snackBar.open('Loading devices..', '', {
      duration: 5000
    });

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
