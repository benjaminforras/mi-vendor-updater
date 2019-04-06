import {Component, OnInit} from '@angular/core';
import {GithubService} from './_services/github.service';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {Subject} from 'rxjs';

declare var $: any;

export interface GithubRelease {
    id: number;
    name: string;
    assets: any;
    html_url: string;
}


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    devices = [];
    filteredDevices = [];
    loading = false;
    private subject: Subject<string> = new Subject();

    constructor(private githubService: GithubService) {
    }

    ngOnInit(): void {
        this.subject
            .pipe(debounceTime(1000))
            .pipe(distinctUntilChanged())
            .subscribe(searchTextValue => {
                this.filter(searchTextValue);
            });
        this.load();

        $('.ui.accordion').accordion();
    }

    filter(filterValue: string) {
        if (!filterValue) {
            this.filteredDevices = [];
            this.loading = false;
            return;
        }

        this.filteredDevices = this.devices.filter((device: GithubRelease) => {
            if (device.id === +filterValue) {
                return true;
            }
            if (device.name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
                return true;
            }

            for (const asset of device.assets) {
                if (asset.name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
                    return true;
                }
            }
        });
        this.loading = false;
        setTimeout(() => {
            $('.ui.accordion').accordion();
        }, 1);
    }

    onKeyUp(searchTextValue: string) {
        this.loading = true;
        this.subject.next(searchTextValue);
    }

    async load() {
        this.devices = await this.githubService.getReleases('') as GithubRelease[];
    }
}
