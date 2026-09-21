import { fireEvent, render, screen } from "@testing-library/react";
import { VoiceStudy } from "../../src/features/study/VoiceStudy";
import { useVoiceInput } from "../../src/hooks/useVoiceInput";
jest.mock("../../src/hooks/useVoiceInput",()=>({useVoiceInput:jest.fn()}));
const start=jest.fn(),stop=jest.fn(),speak=jest.fn(),cancel=jest.fn();
beforeEach(()=>{jest.mocked(useVoiceInput).mockReturnValue({supported:true,listening:false,error:"",start,stop});Object.defineProperty(globalThis,"speechSynthesis",{value:{speak,cancel},configurable:true});Object.defineProperty(globalThis,"SpeechSynthesisUtterance",{value:class {text:string;lang="";constructor(text:string){this.text=text;}},configurable:true});});
afterEach(()=>{Reflect.deleteProperty(globalThis,"speechSynthesis");Reflect.deleteProperty(globalThis,"SpeechSynthesisUtterance");});
test("reads, repeats, pauses and stops speech; transcript stays under user control",()=>{
 const onAnswer=jest.fn();const view=render(<VoiceStudy question="Question one" answer="editable" onAnswer={onAnswer} disabled={false}/>);
 fireEvent.click(screen.getByRole("button",{name:"Start voice study"}));expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({text:"Question one"}));
 fireEvent.click(screen.getByRole("button",{name:"Repeat question"}));expect(stop).toHaveBeenCalled();fireEvent.click(screen.getByRole("button",{name:"Speak answer"}));expect(start).toHaveBeenCalledWith("editable");
 jest.mocked(useVoiceInput).mockReturnValue({supported:true,listening:true,error:"",start,stop});view.rerender(<VoiceStudy question="Question one" answer="editable" onAnswer={onAnswer} disabled={false}/>);expect(screen.getByRole("status")).toHaveTextContent("Listening");fireEvent.click(screen.getByRole("button",{name:"Stop microphone"}));
 fireEvent.click(screen.getByRole("button",{name:"Pause voice"}));expect(cancel).toHaveBeenCalled();fireEvent.click(screen.getByRole("button",{name:"Resume voice"}));
 view.rerender(<VoiceStudy question="Question two" answer="" onAnswer={onAnswer} disabled={false}/>);expect(speak).toHaveBeenLastCalledWith(expect.objectContaining({text:"Question two"}));fireEvent.click(screen.getByRole("button",{name:"Stop voice study"}));expect(onAnswer).not.toHaveBeenCalled();view.unmount();expect(cancel).toHaveBeenCalled();
});
test("recognition errors remain visible and typed answers remain available",()=>{jest.mocked(useVoiceInput).mockReturnValue({supported:false,listening:false,error:"Microphone denied",start,stop});render(<VoiceStudy question="q" answer="" onAnswer={jest.fn()} disabled={false}/>);fireEvent.click(screen.getByRole("button",{name:"Start voice study"}));expect(screen.getByRole("alert")).toHaveTextContent("Microphone denied");expect(screen.getByRole("button",{name:"Speak answer"})).toBeDisabled();});
