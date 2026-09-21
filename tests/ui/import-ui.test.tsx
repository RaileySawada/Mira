import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentImport } from "../../src/features/import/DocumentImport";
function upload(name:string,text:string,size=text.length) {fireEvent.change(screen.getByLabelText("Import local notes"),{target:{files:[{name,size,text:async()=>text}]}});}
test("CSV imports locally after editable preview",async()=>{
 const save=jest.fn();render(<DocumentImport onReviewer={save}/>);fireEvent.click(screen.getByRole("button",{name:"Import notes"}));upload("biology.csv","question,answer\nCell?,Unit of life");
 await screen.findByRole("dialog");expect(save).not.toHaveBeenCalled();fireEvent.change(screen.getByLabelText("Reviewer title"),{target:{value:"Edited title"}});
 fireEvent.click(screen.getByRole("button",{name:"Create reviewer locally"}));await waitFor(()=>expect(save).toHaveBeenCalled());expect(save.mock.calls[0][0]).toMatchObject({title:"Edited title",cards:[{question:"Cell?",answer:"Unit of life"}]});
});
test("text preview supports cleanup and manual creation without uploading",async()=>{
 const save=jest.fn();render(<DocumentImport onReviewer={save}/>);upload("notes.md","# My notes");await screen.findByRole("dialog");fireEvent.change(screen.getByLabelText("Selected content"),{target:{value:"Cleaned notes"}});fireEvent.click(screen.getByRole("button",{name:"Create reviewer locally"}));await waitFor(()=>expect(save).toHaveBeenCalled());expect(save.mock.calls[0][0].cards[0].answer).toBe("Cleaned notes");
});
test("Generate with Mira requires opt-in and only prefills the selected bounded text",async()=>{
 const receive=jest.fn();window.addEventListener("mira:import-notes",receive);render(<DocumentImport onReviewer={jest.fn()}/>);upload("notes.txt","x".repeat(4000));await screen.findByRole("dialog");expect(screen.getByRole("button",{name:"Generate with Mira"})).toBeDisabled();fireEvent.click(screen.getByRole("checkbox"));fireEvent.click(screen.getByRole("button",{name:"Generate with Mira"}));expect((receive.mock.calls[0][0] as CustomEvent).detail).toHaveLength(3000);window.removeEventListener("mira:import-notes",receive);
});
test("invalid files, blank selections and oversize card selections give recoverable errors",async()=>{
 render(<DocumentImport onReviewer={jest.fn()}/>);upload("notes.txt","x",1000001);expect(await screen.findByRole("alert")).toHaveTextContent("1 MB");upload("notes.txt","x");await screen.findByRole("dialog");fireEvent.change(screen.getByLabelText("Selected content"),{target:{value:""}});fireEvent.click(screen.getByRole("button",{name:"Create reviewer locally"}));await waitFor(()=>expect(screen.getByRole("alert")).toHaveTextContent("Add a title"));fireEvent.change(screen.getByLabelText("Selected content"),{target:{value:"x".repeat(5001)}});fireEvent.click(screen.getByRole("button",{name:"Create reviewer locally"}));await waitFor(()=>expect(screen.getByRole("alert")).toHaveTextContent("5,000"));fireEvent.click(screen.getByRole("button",{name:"Close dialog"}));expect(screen.queryByRole("dialog")).toBeNull();
});
test("cancelled picker and unreadable file leave current library alone",async()=>{
 const save=jest.fn();render(<DocumentImport onReviewer={save}/>);fireEvent.change(screen.getByLabelText("Import local notes"),{target:{files:[]}});await act(async()=>{fireEvent.change(screen.getByLabelText("Import local notes"),{target:{files:[{name:"notes.txt",size:1,text:async()=>{throw "unreadable";}}]}});});expect(screen.getByRole("alert")).toHaveTextContent("Could not read");expect(save).not.toHaveBeenCalled();
});
