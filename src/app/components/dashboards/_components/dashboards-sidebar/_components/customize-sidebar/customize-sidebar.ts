import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { OverlayService } from '../../../../../../services/overlay-service/overlay-service';
import { OptionWrapper } from '../../../../../../templates/option-wrapper/option-wrapper';
import { OverlayRef } from '@angular/cdk/overlay';

export const ITEM_OPTIONLISTS = [
    {
      options: [
        {
          type: "button",
          icon: "settings",
          label: "Move Item within sidebar",
          id: "move",
          visible: true,
        },
        {
          type: "button",
          icon: "hide",
          label: "Hide item from sidebar",
          id: "hide",
          visible: true,
        },
        {
          type: "button",
          icon: "show",
          label: "Show item in sidebar",
          id: "show",
          visible: false,
        }
      ]
  },
];
export const MOVE_ITEM_OPTIONLISTS = [
  {
    options: [
        {
          type: "button",
          icon: "settings",
          label: "Move to top",
          id: "top",
          visible: true,
        },
        {
          type: "button",
          icon: "settings",
          label: "Move up",
          id: "up",
          visible: true,
        },
        {
          type: "button",
          icon: "settings",
          label: "Move down",
          id: "down",
          visible: true,
        },
        {
          type: "button",
          icon: "settings",
          label: "Move to Bottom",
          id: "bottom",
          visible: true,
        }
      ]
  }
]

@Component({
  selector: 'app-customize-sidebar',
  standalone: false,
  templateUrl: './customize-sidebar.html',
  styleUrl: './customize-sidebar.scss',
  providers: [OverlayService]
})
export class CustomizeSidebar {
  @Input({required: true}) externalLinks: any[]=[];
  @Input({required: true}) internalItems: any[]=[];
  @Output() saveChanges: EventEmitter<any> = new EventEmitter<any>();
  private moreOptionOverlayRef: OverlayRef | null = null;
  constructor(
    private changeRef: ChangeDetectorRef,
    private overlayService: OverlayService
  ) { }

  public save(){
    this.saveChanges.emit({
      'externalLinks': this.externalLinks,
      'internalItems': this.internalItems,
    });
  }

  public dismissModal() {
    this.saveChanges.emit(null);
  }

  public drop(itemArray: any[], event: CdkDragDrop<any[]>) {
    moveItemInArray(itemArray, event.previousIndex, event.currentIndex);
  }

  public handleMore(item: any, elementRef: ElementRef) {
    const handleMoreOptionClick = (option: any) => {
      switch (option.id) {
        case 'show':
          this.showIteminSidebar(item, option);
          break;
          case 'hide':
          this.hideItemfromSidebar(item, option);
          break;
        case 'move':
          if(option.hasOwnProperty('elementRef') && option.elementRef instanceof ElementRef){
            this.initializeOptionListsConfigForItem(option, MOVE_ITEM_OPTIONLISTS, handleMoreOptionClick);
            this.overlayService.open({
              component: OptionWrapper,
              componentInputs: { optionListsConfig: option.optionListsConfig },
              connectedTo: option.elementRef,
              positions: [
                {originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 10},
                {originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -10}
              ]
            });
          }
          break;
          case 'top':
          case 'up':
          case 'down':
          case 'bottom':
            this.moveItemOptionsOverlay(option.id, item);
            break;
      }
      this.changeRef.detectChanges();
    }
    this.initializeOptionListsConfigForItem(item, ITEM_OPTIONLISTS, handleMoreOptionClick);
    this.moreOptionOverlayRef = this.overlayService.open({
      component: OptionWrapper,
      componentInputs: {
        optionListsConfig: item.optionListsConfig
      },
      connectedTo: elementRef,
      positions: [
        {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -10}
      ]
    });
  }

  public initializeOptionListsConfigForItem(item: any, itemOptionLists: any, callback: (data: any) => void) {
    if(!item.hasOwnProperty('optionListsConfig')) {
      item.optionListsConfig = {
        optionLists: structuredClone(itemOptionLists),
      };
    }
    if(!item.optionListsConfig.hasOwnProperty('handleOptionEvent') && typeof item.optionListsConfig.handleOptionEvent != 'function') {
      item.optionListsConfig.handleOptionEvent = (option: any) => callback(option);
    }
  }

  public hideItemfromSidebar(item: any,option: any) {
    item.visible = !item.visible;
    option.visible = false;
    item.optionListsConfig.optionLists[0].options.find((option: any)=>option.id == 'show').visible = true;
  }
  public showIteminSidebar(item: any,option: any) {
    item.visible = !item.visible;
    option.visible = false;
    item.optionListsConfig.optionLists[0].options.find((option: any)=>option.id == 'hide').visible = true;
  }
  public moveItemOptionsOverlay(position: string, item: any) {
    let containerArray = this.internalItems;
    let currentItemIndex = containerArray.findIndex(itm => itm.title == item.title);
    if(currentItemIndex == -1) { 
      containerArray = this.externalLinks;
      currentItemIndex = containerArray.findIndex(itm => itm.title == item.title);
    }
    if(currentItemIndex != -1) {
      switch (position) {
        case 'up':
          moveItemInArray(containerArray, currentItemIndex, Math.max(currentItemIndex - 1, 0));
          break;
        case 'top':
          moveItemInArray(containerArray, currentItemIndex, 0);
          break;
        case 'down':
          moveItemInArray(containerArray, currentItemIndex, Math.min(currentItemIndex + 1,containerArray.length - 1));
          break;
        case 'bottom':
          moveItemInArray(containerArray, currentItemIndex, containerArray.length - 1);
      }
    }
  }
  public ngOnDestroy() {
    this.overlayService.close();
    if(this.moreOptionOverlayRef) {
      this.moreOptionOverlayRef.detach();
      this.moreOptionOverlayRef.dispose();
      this.moreOptionOverlayRef = null;
    }
  }
}
