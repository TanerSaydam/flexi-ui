import { AfterViewInit, Component, ElementRef, forwardRef, signal, viewChild, ViewChild, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'flexi-editor',
    imports: [],
    templateUrl: "./flexi-editor.component.html",
    styleUrls: ["./flexi-editor.component.css"],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FlexiEditorComponent),
            multi: true
        }
    ]
})
export class FlexiEditorComponent implements ControlValueAccessor, AfterViewInit {
  editor = viewChild.required<ElementRef<HTMLDivElement>>("editor");
  fonts = signal<string[]>([
    "Poppins",
    "Arial",
    "Courier New",
    "Georgia",
    "Times New Roman",
    "Verdana"
  ]);
  fontSizes = signal<number[]>([
    1,
    2,
    3,
    4,
    5,
    6,
    7
  ]);
  content = signal<string>("");

  constructor(private dom: DomSanitizer){}  

  ngAfterViewInit(): void {
    this.writeValue(this.content());
  }

  onChange = (content: string) => {};
  onTouched = () => {};  

  format(command: any, value: any | undefined = undefined) {        
    document.execCommand(command, false, value);
  }

  insertLink() {
    const url: any = prompt('Enter the link here: ', 'http:\/\/');
    document.execCommand('createLink', false, url);
  }

  insertImage() {
    const url: any = prompt('Enter the image URL here: ', 'http:\/\/');
    document.execCommand('insertImage', false, url);
  }

  onInput(event: Event) {
    const editorElement: any = event.target;
    if (editorElement) {
      const content = editorElement.innerHTML;
      const safeHTML:any = this.dom.bypassSecurityTrustHtml(content);
      const safeContent = safeHTML.changingThisBreaksApplicationSecurity;
      this.content.set(editorElement.innerText);
      this.onChange(safeContent);
    }
  }

  writeValue(value: any): void { 
   if(value){
    this.content.set(value);
    if(this.editor){
      this.editor().nativeElement.innerHTML = this.content();
    }
   }
   
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (this.editor && this.editor().nativeElement) {
      //this.editor().nativeElement.contentEditable = !isDisabled;
    }
  }
}
