import {
  Component,
  Injectable,
  Input,
  OnInit
} from '@angular/core'
import { MdButtonToggleModule, MdTooltipModule } from '@angular/material'

import { EditorService } from '../editor.service'

@Component({
  selector: 'mute-style-toolbar',
  templateUrl: './style-toolbar.component.html',
  styleUrls: ['./style-toolbar.component.scss'],
  providers: [ EditorService ]
})

@Injectable()
export class StyleToolbarComponent implements OnInit {

  @Input() cm: CodeMirror.Editor

  private buttons: Array<any> = new Array()
  private toolbarWidth: number
  private toolbar: any

  constructor (
    private editorService: EditorService
  ) {}

  ngOnInit () {
    this.toolbar = document.getElementsByClassName('mute-style-toolbar')[0]
    this.getToggleButtons()
    this.toolbarWidth = this.removePx(getComputedStyle(this.toolbar).width)
    this.setListeners()
  }

  // Set up when to show/hide toolbar
  setListeners (): void {
    this.cm.on('cursorActivity', () => { this.updateToolbarState() })

    // Handles 'on blur'
    let editor = document.getElementsByTagName('mute-editor')[0]
    editor.addEventListener('mousedown', this.checkThenHide.bind(this))

    this.cm.addKeyMap({Esc: () => this.hideToolbar() })
  }

  checkThenHide (event: Event): void {
    let editor = document.getElementsByTagName('mute-editor')[0]
    if (event.target === editor) {
      this.hideToolbar()
    }
  }

  hideToolbar (): void {
    if (this.toolbar.classList.contains('active')) {
      if (this.cm.getDoc().somethingSelected()) { // For 'Esc', so the selection is removed
        this.cm.getDoc().setSelection(this.cm.getDoc().getCursor(), this.cm.getDoc().getCursor())
      }
      this.resetToggledButtons()
      this.toolbar.classList.remove('active')
      this.toolbar.classList.add('inactive')
    }
  }

  updateToolbarState (): void {
    if (this.cm.getDoc().somethingSelected() && this.toolbar.classList.contains('inactive')) {
      this.setToggledButtons()
      this.setToolbarLocation()
      this.toolbar.classList.remove('inactive')
      this.toolbar.classList.add('active')
    } else if (!this.cm.getDoc().somethingSelected()) {
      this.hideToolbar()
    } else if (this.toolbar.classList.contains('active')) {
      this.setToggledButtons()
      this.setToolbarLocation()
    }
  }

  // SET TOOLBAR UP
  setToggledButtons (): void {
    // log.debug('SET BUTTONS')
    const selection = this.cm.getDoc().listSelections()[0]
    let sum = (selection.anchor.ch + selection.head.ch) / 2
    this.cm.getDoc().setSelection({ch: sum - 1, line: selection.anchor.line}, {ch: sum + 1, line: selection.head.line})
    const selectionStyles = (this.cm.getTokenAt(this.cm.getDoc().listSelections()[0].anchor)).type
    // log.debug('STYLES', selectionStyles)
    const existingStyles = ['strong', 'em', 'strikethrough', 'quote', 'link']
    let buttonIndex = 0
    existingStyles.forEach((style) => {

      if (selectionStyles && selectionStyles.includes(style)) {

        // log.debug('it should be toggled')

        this.buttons[buttonIndex].classList.add('mat-button-toggle-checked')

        // log.debug('button', this.buttons[buttonIndex])

      } else if (this.buttons[buttonIndex].classList.contains('mat-button-toggle-checked')) {

        // log.debug('before', this.buttons[buttonIndex])
        this.buttons[buttonIndex].classList.remove('mat-button-toggle-checked')
        // log.debug('after', this.buttons[buttonIndex])

      }
      buttonIndex++
    })
    this.cm.getDoc().setSelection(selection.anchor, selection.head)
  }

  setToolbarLocation (): void {
    const width: number = this.removePx(getComputedStyle(document.getElementsByTagName('mute-editor')[0] as any).borderLeft) // not ideal

    const line: number = this.getUpperLine()
    let top: number = this.getTopFromSelection(line)
    let left: number = this.getLeftFromMiddleOfSelection(line)
    let right: number = this.getRightFromMiddleOfSelection(line)

    let horizontalPosition = ''

    if (left < this.toolbarWidth / 2) {
      left = 0
      horizontalPosition = 'left: ' + left + 'px;'
    } else {
      if (right < width - this.toolbarWidth / 2) {
        right = 0
        horizontalPosition = 'right: ' + right + 'px;'
      } else {
        left -= this.toolbarWidth / 2
        horizontalPosition = 'left: ' + left + 'px;'
      }
    }
    this.toolbar.style = 'top: ' + top + 'px; ' + horizontalPosition
  }

  resetToggledButtons (): void {
    // log.debug('RESET BUTTONS')
    this.buttons.forEach(function (button) {
      if (button.classList.contains('mat-button-toggle-checked')) {
        button.classList.remove('mat-button-toggle-checked')
      }
    })
  }

  // ACCESS PROPERTIES OF SELECTION
  getLeftFromMiddleOfSelection (line: number): number {
    let selection = this.cm.getDoc().listSelections()[0]
    let anchor = selection.anchor.ch
    let head = selection.head.ch
    let middleOfSelection = Math.floor((head + anchor) / 2)
    let charCoords = this.cm.charCoords({line, ch: middleOfSelection}, 'window')
    return charCoords.left
  }

  getRightFromMiddleOfSelection (line: number): number {
    let selection = this.cm.getDoc().listSelections()[0]
    let anchor = selection.anchor.ch
    let head = selection.head.ch
    let middleOfSelection = Math.floor((head + anchor) / 2)
    let charCoords = this.cm.charCoords({line, ch: middleOfSelection}, 'window')
    return charCoords.right
  }

  getTopFromSelection (line: number): number {
    let charCoords = this.cm.charCoords({line, ch: 0}, 'local')
    return charCoords.top - 8
  }

  getUpperLine (): number {
    let selection = this.cm.getDoc().listSelections()[0]
    let anchor = selection.anchor.line
    let head = selection.head.line
    return Math.min(anchor, head)
  }

  // BUTTONS FUNCTIONNALITIES
  toggleBold (): void {
    this.editorService.toggleStyle(this.cm, '**', {'**': new RegExp('[\\s\\S]*\\*\\*[\\s\\S]*\\*\\*[\\s\\S]*'),
      __: new RegExp('[\\s\\S]*__[\\s\\S]*__[\\s\\S]*')})
  }

  toggleItalic (): void {
    this.editorService.toggleStyle(this.cm, '_', {_: new RegExp('[^_]*(_|___)[^_][\\s\\S]*[^_](_|___)[^_]*', 'y'),
      '*': new RegExp('[^\\*]*(\\*|\\*\\*\\*)[^\\*][\\s\\S]*[^\\*](\\*|\\*\\*\\*)[^\\*]*', 'y')})
  }

  toggleStrikethrough (): void {
    this.editorService.toggleStyle(this.cm, '~~', {'~~': new RegExp('.*~~.*~~.*')})
  }

  handleLink (): void {
    this.editorService.handleLink(this.cm.getDoc())
  }

  createQuotation (): void {
    this.cm.getDoc().replaceSelection('>' + this.cm.getDoc().getSelection())
  }

  addHeader (headerSize: string): void {
    const selection = this.cm.getDoc().getSelection()
    switch (+(headerSize)) {
    case 1:
      headerSize = '# '
      break
    case 2:
      headerSize = '## '
      break
    case 3:
      headerSize = '### '
      break
    case 4:
      headerSize = '#### '
      break
    case 5:
      headerSize = '##### '
      break
    }
    let list = ''
    let beginningIndexOfSubSelection = 0
    for (let i = 0; i < selection.length; i++) {
      if (selection[i] === '\n' || i === selection.length - 1) {
        list += headerSize + selection.slice(beginningIndexOfSubSelection, i + 1)
        beginningIndexOfSubSelection = i + 1
      }
    }
    this.cm.getDoc().replaceSelection(list, 'around')
  }

  createList (bullet: string): void {
    const selection = this.cm.getDoc().getSelection()
    switch (+(bullet)) {
    case 0:
      bullet = '. '
      break
    case 1:
      bullet = '- '
      break
    case 2:
      bullet = '* '
      break
    case 3:
      bullet = '+ '
      break
    case 4:
      bullet = '- [ ] '
      break
    }
    let list = ''
    let beginningIndexOfSubSelection = 0
    let counter = 1
    for (let i = 0; i < selection.length; i++) {
      if (selection[i] === '\n' || i === selection.length - 1) {
        if (bullet === '. ') {
          list += counter + bullet + selection.slice(beginningIndexOfSubSelection, i + 1)
          counter++
        } else {
          list += bullet + selection.slice(beginningIndexOfSubSelection, i + 1)
        }
        beginningIndexOfSubSelection = i + 1
      }
    }
    this.cm.getDoc().replaceSelection(list, 'around')
  }

  // TOOLS
  getToggleButtons (): void {
    this.toolbar.childNodes.forEach((child) => {
      if (child.className && child.classList.contains('mat-button-toggle')) {
        this.buttons.push(child)
      }
    })
  }

  removePx (cssSize: string): number {
    return +(cssSize.slice(0, -2))
  }

}
