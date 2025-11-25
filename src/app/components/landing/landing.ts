import { Component, signal, WritableSignal } from '@angular/core';
import { CommonModule } from "@angular/common";
import { Header } from '../header/header';

@Component({
  selector: 'app-landing',
  imports: [CommonModule,Header],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  Carousel: {headerTitle:string,headerDescription:string,content:string,imgUrl:string}[]=[
    {
      headerTitle: '⚡ Plan and organize tasks',
      headerDescription: 'From short projects, to large cross-functional programs, Jira uses AI to help break big ideas down into achievable steps. Organize work, create milestones, map dependencies and more.',
      content: 'https://dam-cdn.atl.orangelogic.com/AssetLink/1u8phig8g50c70bnq25c6x5htq6b253w.webp',
      imgUrl: 'https://dam-cdn.atl.orangelogic.com/AssetLink/1u8phig8g50c70bnq25c6x5htq6b253w.webp'
    },
    {
      headerTitle: 'Keep your projects on track',
      headerDescription: 'Get visibility into project progress, understand risks, and surface insights from real-time data to help you improve team performance.',
      content: 'https://dam-cdn.atl.orangelogic.com/AssetLink/30ref08c2xjhdi3bypsd4l534o6343k6.webp',
      imgUrl: 'https://dam-cdn.atl.orangelogic.com/AssetLink/30ref08c2xjhdi3bypsd4l534o6343k6.webp'
    },
    {
      headerTitle: 'work your way',
      headerDescription: 'Keep Jira in sync with your favorite tools, customize your workflows with AI – and, stay on top of it all with lists, boards, and timeline views.',
      content: 'https://dam-cdn.atl.orangelogic.com/AssetLink/2tqg4ls4336u276d4f6y7rennjd1t742.webp',
      imgUrl: 'https://dam-cdn.atl.orangelogic.com/AssetLink/2tqg4ls4336u276d4f6y7rennjd1t742.webp'
    },
    {
      headerTitle: 'Align work to goals',
      headerDescription: 'Link work to goals so everyone can see how their work contributes to company objectives and stay aligned to what’s important.',
      content: 'https://dam-cdn.atl.orangelogic.com/AssetLink/j7ib7le01l6x411v5h42l87m64l0f611.webp',
      imgUrl: 'https://dam-cdn.atl.orangelogic.com/AssetLink/j7ib7le01l6x411v5h42l87m64l0f611.webp'
    }
  ]
  showSlide: WritableSignal<number>=signal(0);
  timeout: any;
  public slideCarousel(){
    if(this.timeout){}
    this.timeout = setInterval(()=>this.showSlide.update((s)=> (s+1)%4),5000);
  }
  public refresh(slideIndex: number){
    this.showSlide.set(slideIndex);
    this.slideCarousel();
  }
  ngAfterViewInit(){
    this.slideCarousel();
  }
}
