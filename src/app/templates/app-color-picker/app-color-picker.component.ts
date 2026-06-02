import { Component } from "@angular/core";
import { TabComponent } from "../../components/dashboards/_components/tabs/tabs";
import { ScrollBorder } from "../../directives";
import { TextField } from "../text-field/text-field";

@Component({
    selector: 'color-picker',
    templateUrl: './app-color-picker.component.html',
    styleUrl: './app-color-picker.component.scss',
    imports: [TabComponent, ScrollBorder, TextField]
})
export class AppColorPicker {
    protected gradients = [1,2,3,4,5,6,7,8,9,10];
}