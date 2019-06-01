import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {GithubService} from '../../_services/github.service';
import {debounceTime} from 'rxjs/operators';
import {Subject} from 'rxjs';

export interface GithubRelease {
  id: number;
  name: string;
  assets: any;
  html_url: string;
}


@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {

  @ViewChild('searchText') searchText: ElementRef;
  devices = [];
  filteredDevices = [];
  loading = false;
  loadingDevices = false;
  branches = [{
    display: 'Weekly',
    value: '-weekly',
    checked: true
  }, {
    display: 'Stable',
    value: '-stable',
    checked: true
  }];
  private subject: Subject<string> = new Subject();

  constructor(public githubService: GithubService) {
  }

  get seletedBranches() {
    return this.branches.filter(opt => opt.checked);
  }

  ngOnInit(): void {
    this.subject
      .pipe(debounceTime(1000))
      .subscribe(searchTextValue => {
        this.filter(searchTextValue);
      });
    this.load();
  }

  filter(filterValue: string) {
    this.filteredDevices = this.devices.filter((device: GithubRelease) => {
      if (device.id === +filterValue) {
        return true;
      }

      if (this.seletedBranches && this.seletedBranches.length > 0) {
        for (const branch of this.seletedBranches) {
          if (device.name.toLowerCase().indexOf(branch.value) > -1) {
            if (device.name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
              return true;
            }

            for (const asset of device.assets) {
              if (asset.name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
                return true;
              }
            }
          }
        }
      } else {
        if (device.name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
          return true;
        }

        for (const asset of device.assets) {
          if (asset.name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
            return true;
          }
        }
      }


    });
    this.loading = false;
  }

  onKeyUp(searchTextValue: string) {
    if (!searchTextValue) {
      this.filteredDevices = [];
      this.loading = false;
      return;
    }

    this.loading = true;
    this.subject.next(searchTextValue);
  }

  async load() {
    this.loadingDevices = true;
    this.devices = await this.githubService.getReleases() as GithubRelease[];
    this.loadingDevices = false;
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
