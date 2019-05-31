import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {GithubService} from '../../_services/github.service';
import {debounceTime} from 'rxjs/operators';
import {Subject} from 'rxjs';

declare var $: any;

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

    constructor(private githubService: GithubService) {
    }

    get seletedBranches() {
        return this.branches.filter(opt => opt.checked);
    }

    devices = [];
    filteredDevices = [];
    loading = false;
    loadingDevices = false;
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

    ngOnInit(): void {
        this.subject
            .pipe(debounceTime(1000))
            .subscribe(searchTextValue => {
                this.filter(searchTextValue);
            });
        this.load();

        $('.ui.accordion').accordion();
        this.updateCheckboxes();

        const route = this.getAllUrlParams(window.location.href);
        if (route.hasOwnProperty('id')) {
            setTimeout(() => {
                this.searchText.nativeElement.value = route['id'];
                this.onKeyUp(route['id']);
            }, 10);
        }
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
        this.loadingDevices = true;
        this.devices = await this.githubService.getReleases('') as GithubRelease[];
        this.loadingDevices = false;
    }

    updateCheckboxes() {
        setTimeout(() => {
            $('.ui.checkbox').checkbox();
        }, 1);
    }

    getAllUrlParams(url) {
        let queryString = url ? url.split('?')[1] : window.location.search.slice(1);

        const obj = {};

        if (queryString) {
            queryString = queryString.split('#')[0];
            const arr = queryString.split('&');

            for (let i = 0; i < arr.length; i++) {
                const a = arr[i].split('=');

                let paramName = a[0];
                let paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

                paramName = paramName.toLowerCase();
                if (typeof paramValue === 'string') {
                    paramValue = paramValue.toLowerCase();
                }

                if (paramName.match(/\[(\d+)?\]$/)) {

                    const key = paramName.replace(/\[(\d+)?\]/, '');
                    if (!obj[key]) {
                        obj[key] = [];
                    }

                    if (paramName.match(/\[\d+\]$/)) {
                        const index = /\[(\d+)\]/.exec(paramName)[1];
                        obj[key][index] = paramValue;
                    } else {
                        obj[key].push(paramValue);
                    }
                } else {
                    if (!obj[paramName]) {
                        obj[paramName] = paramValue;
                    } else if (obj[paramName] && typeof obj[paramName] === 'string') {
                        obj[paramName] = [obj[paramName]];
                        obj[paramName].push(paramValue);
                    } else {
                        obj[paramName].push(paramValue);
                    }
                }
            }
        }
        return obj;
    }
}
