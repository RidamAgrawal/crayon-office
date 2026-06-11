import { Component, input } from '@angular/core';

@Component({
  selector: 'app-listing',
  imports: [],
  templateUrl: './listing.html',
  styleUrl: './listing.scss',
})
export class Listing {
  protected readonly listingConfig = input<any>({
    heading: 'today',
    items: [
      {
        title: 'Version Information grid shows incorrect S.No when case is created as Follow Up',
        type: 'suggestion',
        itemName: 'Crayon-Item-123',
        itemType: 'task',
        projectName: 'Crayon-Project',
        lastViewed: 'You viewed 2 hours ago',
        icon: './assets/icons/search.svg',
      },
      {
        title: 'Version Information grid shows incorrect S.No when case is created as Follow Up',
        type: 'ordinary',
        itemName: 'PVCM-125149',
        projectName: 'PV Case Management',
        status: 'Updated',
        avatars: ['RA', 'KK', 'PA', 'JK'],
        icon: './assets/icons/search.svg',
      },
    ],
  });
}
