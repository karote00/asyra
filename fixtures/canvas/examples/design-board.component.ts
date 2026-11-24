import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild
} from '@angular/core'
import { mountDesign } from './mount-design'

@Component({
  selector: 'app-design-board',
  standalone: true,
  template: '<div #host style="height: 480px"></div>'
})
export class DesignBoard {
  private host = viewChild.required<ElementRef<HTMLDivElement>>('host')

  constructor() {
    const lifetime = inject(DestroyRef)

    afterNextRender(() => {
      lifetime.onDestroy(mountDesign(this.host().nativeElement))
    })
  }
}
