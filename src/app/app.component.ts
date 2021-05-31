import { ChangeDetectorRef, OnInit, Renderer2 } from '@angular/core';
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { fromEvent, of } from "rxjs";
import { debounceTime, delay, throttleTime } from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'telepathy-app';

  isLoading: Boolean = false;
  boxes = [];

  @ViewChild("counterWrapper") counterWrapper: ElementRef;
  @ViewChild("infiniteScrolling") infiniteScrolling: ElementRef;
  windowHeight = this.window.innerHeight;
  windowWidth = this.window.innerWidth;
  possibleBoxesDimension = {
    x: 0,
    y: 0
  }

  constructor(private window: Window, private renderer: Renderer2, private changeDetector: ChangeDetectorRef) {
    // register on window resize event
    fromEvent(window, "resize")
      .pipe(throttleTime(500), debounceTime(500))
      .subscribe(() => {
        //Will need to determine height, the height of the boxes wrapper, max dimension of the boxes wrapper
        this.windowHeight = this.window.innerHeight;
        this.calculateHeight();
        this.determineMaxDimension();
      });
  }

  ngOnInit() {
  }

  ngAfterViewInit(){
    //Determine the boxes wrapper height first
    this.calculateHeight();
    //Generate initial random boxes first
    this.determineMaxDimension();
    setTimeout(() => {
      this.flushBoxes();
    })
    //Setup the logic to infinite scroll 
    this.setupInfiniteScrollLogic();
  }

  //Infinite scroll by adding more boxes when scroll point is on 3/4 of the content
  setupInfiniteScrollLogic() {
    //Boolean to make sure that the logic does not trigger multiple times due to there's a delay when adding boxes
    let triggeringScrollLogic = false;
    fromEvent(this.infiniteScrolling.nativeElement, 'scroll')
    .subscribe(() => {
      if(!triggeringScrollLogic) {
        let element = this.infiniteScrolling.nativeElement;
        //scrollTop + clientHeight = total scrollable height (scrollHeight)
        //Threshold to trigger is 3/4 the total scrollable height
        let thresholdHeightTrigger = element.scrollHeight * (3/4);
        let currentScrollPosition = element.scrollTop + element.clientHeight;
        if(currentScrollPosition >= thresholdHeightTrigger) {
          triggeringScrollLogic = true;
  
          //Adding new boxes
          let boxesToAdd = (this.possibleBoxesDimension.x * this.possibleBoxesDimension.y);
          this.addBoxes(boxesToAdd);
          triggeringScrollLogic = false;
        }
      }
    });
  }

  //Function to calculate box wrapper height
  calculateHeight() {
    let counterWrapperHeight = this.counterWrapper.nativeElement.offsetHeight;
    this.renderer.setStyle(this.infiniteScrolling.nativeElement, "height", (this.windowHeight - counterWrapperHeight) + "px");
  }

  //Function to count possible boxes dimension in the box wrapper
  determineMaxDimension() {
    //Count possible boxes first
    //Each Boxes has 13x13 size dimension + 2px border so total size is 15x15 with margin of 3px
    //So Total possible boxes to cover entire page is. Window Height >= (Box Height x Y)
    //Both are minus with 3 due to there's a 3px padding on the box wrapper
    this.possibleBoxesDimension.y = Math.floor((this.infiniteScrolling.nativeElement.offsetHeight - 3) / 18);
    this.possibleBoxesDimension.x = Math.floor((this.infiniteScrolling.nativeElement.offsetWidth - 3) / 18);
  }

  //Add boxes
  addBoxes(totalToAdd) {
    return new Promise((resolve) => {
      for(var i = 0; i< totalToAdd; i++) {
        this.boxes.push(this.generateRandomHexColor());
      }
      resolve(true);
    })
  }

  //Toggle rotate animation on the boxes
  toggleClicked(e) {
    let action = (e.target.classList.contains("clicked")) ? "removeClass" : "addClass";
    this.renderer[action](e.target, 'clicked');
  }

  //Reset Boxes count 
  flushBoxes() {
    document.querySelector("#infiniteScrolling").scroll(0,0);
    this.isLoading = true;
    this.changeDetector.detectChanges();
    this.boxes = [];
    let totalBoxes = (this.possibleBoxesDimension.x * this.possibleBoxesDimension.y) * 1.5;
    this.addBoxes(totalBoxes).then(() => {
      setTimeout(() => {
        this.isLoading = false;
      },500)
    });
  }

  resetBoxes() {
    document.querySelector("#infiniteScrolling").scroll(0,0)
    this.changeDetector.detectChanges();
    // console.log(this.infiniteScrolling)
    setTimeout(() => {
      this.boxes = [];
    })
  }

  //Function to generate random hex color
  generateRandomHexColor() {
    return "#" + Math.floor(Math.random()*16777215).toString(16);
  }
}
