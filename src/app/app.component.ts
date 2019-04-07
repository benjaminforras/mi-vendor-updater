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
    branches = [{
        display: 'Weekly',
        value: '-weekly',
        checked: true
    }, {
        display: 'Stable',
        value: '-stable',
        checked: true
    }];

    constructor(private githubService: GithubService) {
    }

    get seletedBranches() {
        console.log(this.branches);
        return this.branches.filter(opt => opt.checked);
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
        $('.ui.checkbox').checkbox();
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
        setTimeout(() => {
            $('.ui.accordion').accordion();
        }, 1);
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
        this.devices = await this.githubService.getReleases('') as GithubRelease[];
    }

    updateCheckboxes() {
        setTimeout(() => {
            $('.ui.checkbox').checkbox();
        }, 1);
    }
}
