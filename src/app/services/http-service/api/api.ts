import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class Api {
    get sidebarItemConfig(){
        return 'assets/data/sidebarItemConfig.json';
    }
}
