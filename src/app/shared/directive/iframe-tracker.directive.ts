import {
  Directive,
  ElementRef,
  OnInit,
  Renderer2,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';

@Directive({
  selector: '[appIframeTracker]',
})
export class IframeTrackerDirective implements OnInit {
  private iframeMouseOver: boolean;

  @Input() debug: boolean;

  @Output() iframeClick = new EventEmitter<ElementRef>();

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.listen(window, 'blur', () => this.onWindowBlur());
  }

  @HostListener('mouseover')
  private onIframeMouseOver(): void  {
    this.log('Iframe mouse over');
    this.iframeMouseOver = true;
    this.resetFocusOnWindow();
  }

  @HostListener('mouseout')
  private onIframeMouseOut(): void  {
    this.log('Iframe mouse out');
    this.iframeMouseOver = false;
    this.resetFocusOnWindow();
  }

  private onWindowBlur(): void {
    if (this.iframeMouseOver) {
      this.log('WOW! Iframe click!!!');
      this.iframeClick.emit(this.el);
      this.resetFocusOnWindow();
    }
  }

  private resetFocusOnWindow(): void  {
    setTimeout(() => {
      this.log('reset focus to window');
      window.focus();
    }, 100);
  }

  private log(message: string): void  {
    if (this.debug) {
      console.log(message);
    }
  }
}
