import { act, renderHook, waitFor } from "@testing-library/react";
import { usePresence } from "../../src/hooks/usePresence";
import { startPresence } from "../../src/services/presence";
jest.mock("../../src/config/firebase",()=>({presenceConfigured:true}));
jest.mock("../../src/services/presence",()=>({startPresence:jest.fn()}));
test("starts once online, forwards counts and disconnects on cleanup",async()=>{const stop=jest.fn();jest.mocked(startPresence).mockImplementation(notify=>{notify({status:"online",count:2});return stop;});const view=renderHook(()=>usePresence(true));await waitFor(()=>expect(view.result.current.count).toBe(2));view.unmount();expect(stop).toHaveBeenCalled();});
test("late import cannot start an unmounted presence connection",async()=>{const view=renderHook(()=>usePresence(true));view.unmount();await act(async()=>{});expect(startPresence).not.toHaveBeenCalled();});
test("a startup error becomes unavailable rather than breaking the app",async()=>{jest.mocked(startPresence).mockImplementation(()=>{throw Error("blocked");});const view=renderHook(()=>usePresence(true));await waitFor(()=>expect(view.result.current.status).toBe("unavailable"));});
