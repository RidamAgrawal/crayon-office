import { Component, output, signal } from "@angular/core";
import { TextField } from "../../../../../../templates/text-field/text-field";

@Component({
    selector: 'board-space-text-field-wrapper-template',
    templateUrl: './board-space-text-field-wrapper.template.html',
    styleUrl: './board-space-text-field-wrapper.template.scss',
    imports: [TextField]
})
export class BoardSpaceTextFieldWrapperTemplate {
    public readonly close = output<void>();
    public readonly setValue = output<string>();

    protected val = signal<string>('');

    public reset(): void {
        this.val.set('');
    }

    public ngOnDestroy(): void {
        this.reset();
    }
}