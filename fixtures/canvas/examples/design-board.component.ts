import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import '@asyra/design/element'

@Component({
  selector: 'app-design-board',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<asyra-design></asyra-design>'
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Angular uses this class as its template owner.
export class DesignBoard {}
