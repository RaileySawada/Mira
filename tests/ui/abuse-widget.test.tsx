import { act, fireEvent, render, screen } from "@testing-library/react";
import { AbuseChallenge } from "../../src/features/ai/AbuseChallenge";
afterEach(()=>{delete window.turnstile;document.querySelectorAll("script[data-mira-turnstile]").forEach(s=>s.remove());});
test("renders explicitly, expires tokens, reports errors and removes the widget",()=>{
 const renderWidget=jest.fn(()=>"widget"),remove=jest.fn(),token=jest.fn();window.turnstile={render:renderWidget,remove};
 const view=render(<AbuseChallenge siteKey="public-key" onToken={token}/>);expect(renderWidget).toHaveBeenCalledTimes(1);
 const options=(renderWidget.mock.calls as unknown as [HTMLElement,Parameters<NonNullable<Window["turnstile"]>["render"]>[1]][])[0][1];
 act(()=>options.callback("token"));expect(token).toHaveBeenLastCalledWith("token");act(()=>options["expired-callback"]());expect(token).toHaveBeenLastCalledWith("");act(()=>options["error-callback"]());expect(screen.getByRole("alert")).toHaveTextContent("Local studying");fireEvent.load(document.querySelector("script")!);expect(renderWidget).toHaveBeenCalledTimes(1);view.unmount();expect(remove).toHaveBeenCalledWith("widget");
});
test("waits for script load and reports network errors; no key does not load it",()=>{
 const token=jest.fn();const empty=render(<AbuseChallenge siteKey="" onToken={token}/>);expect(document.querySelector("script[data-mira-turnstile]")).toBeNull();empty.unmount();
 const view=render(<AbuseChallenge siteKey="key" onToken={token}/>);const script=document.querySelector("script[data-mira-turnstile]")!;fireEvent.error(script);expect(screen.getByRole("alert")).toBeVisible();window.turnstile={render:jest.fn(()=>"loaded"),remove:jest.fn()};fireEvent.load(script);expect(window.turnstile.render).toHaveBeenCalledTimes(1);view.unmount();
});
