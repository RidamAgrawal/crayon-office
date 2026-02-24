import { ConnectedPosition } from "@angular/cdk/overlay";


export declare namespace WYSIWYGEditor {
    interface ColorPallette {
        colorName: string;
        colorClass: string;
        colorHexCode: string;
    }

    type ColorPickerOptions = { options: ColorPallette[] }[];

}
export const FLOAT_BOTTOM_POSITION: ConnectedPosition = {
    originX: 'center',
    overlayX: 'center',
    originY: 'bottom',
    overlayY: 'top',
    offsetY: 8,
}

export const FLOAT_TOP_POSITION: ConnectedPosition = {
    originX: 'center',
    overlayX: 'center',
    originY: 'top',
    overlayY: 'bottom',
    offsetY: -8,
}