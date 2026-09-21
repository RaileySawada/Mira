import { library } from "../support/fixtures";
const mockOpen=jest.fn(),mockRead=jest.fn(),mockMigrate=jest.fn(),mockWrite=jest.fn(),mockReadDraft=jest.fn(),mockWriteDraft=jest.fn(),mockExport=jest.fn();
jest.mock("../../src/services/studyDatabase",()=>({exportStudyRecovery:(...args:unknown[])=>mockExport(...args),openStudyDatabase:(...args:unknown[])=>mockOpen(...args),readStudyDatabase:(...args:unknown[])=>mockRead(...args),migrateStudyDatabase:(...args:unknown[])=>mockMigrate(...args),writeStudyDatabase:(...args:unknown[])=>mockWrite(...args),readQuizDraft:(...args:unknown[])=>mockReadDraft(...args),writeQuizDraft:(...args:unknown[])=>mockWriteDraft(...args)}));
beforeEach(()=>{jest.resetModules();Object.defineProperty(globalThis,"indexedDB",{value:{},configurable:true});mockOpen.mockResolvedValue({});mockRead.mockResolvedValue(undefined);mockMigrate.mockResolvedValue({...library(),version:3});mockWrite.mockResolvedValue(undefined);mockWriteDraft.mockResolvedValue(undefined);});
afterEach(()=>{Reflect.deleteProperty(globalThis,"indexedDB");});
test("initializes an empty library, saves v3 and reloads the in-memory snapshot",async()=>{
 const runtime=await import("../../src/services/storageRuntime");await runtime.initializeStudyStorage();expect(runtime.databaseReady()).toBe(true);expect(runtime.storedSnapshot()?.data.version).toBe(3);await runtime.persistStudyData(library());expect(mockWrite).toHaveBeenCalled();expect(JSON.parse(localStorage.getItem("mira.preferences")!).name).toBe("");
 const storage=await import("../../src/services/storage");expect(storage.readData().data).toEqual(runtime.storedSnapshot()?.data);await storage.saveData(library());
});
test("uses IndexedDB over stale legacy data and retains the original backup during migration",async()=>{
 const runtime=await import("../../src/services/storageRuntime");localStorage.setItem("mira.study.v1",JSON.stringify(library()));await runtime.initializeStudyStorage();expect(localStorage.getItem("mira.study.v1")).not.toBeNull();mockRead.mockResolvedValue({...library(),version:3});mockMigrate.mockClear();await runtime.initializeStudyStorage();expect(mockMigrate).not.toHaveBeenCalled();
});
test("database failures preserve recovery state; missing database never reports a successful save",async()=>{
 const runtime=await import("../../src/services/storageRuntime");mockOpen.mockRejectedValueOnce(new Error("blocked"));await runtime.initializeStudyStorage();expect(runtime.storedSnapshot()?.error).toContain("untouched");await expect(runtime.persistStudyData(library())).rejects.toThrow("not open");await expect(runtime.loadActiveDraft()).rejects.toThrow("unavailable");await expect(runtime.persistActiveDraft(undefined)).rejects.toThrow("unavailable");
});
test("optional preference failure does not lose a committed database write",async()=>{
 const runtime=await import("../../src/services/storageRuntime");await runtime.initializeStudyStorage();jest.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw Error("blocked");});await expect(runtime.persistStudyData(library())).resolves.toBeUndefined();expect(runtime.storedSnapshot()?.data.reviewers).toHaveLength(1);
});
test("draft writes are serialized and a failure does not poison later writes",async()=>{
 const runtime=await import("../../src/services/storageRuntime");await runtime.initializeStudyStorage();mockReadDraft.mockResolvedValue({id:"a"});expect(await runtime.loadActiveDraft()).toEqual({id:"a"});mockWriteDraft.mockRejectedValueOnce(new Error("quota"));await expect(runtime.persistActiveDraft({id:"a"})).rejects.toThrow("quota");await runtime.persistActiveDraft(undefined);expect(mockWriteDraft).toHaveBeenLastCalledWith(expect.anything(),undefined);
});
test("unsupported IndexedDB leaves the legacy fallback available",async()=>{
 Reflect.deleteProperty(globalThis,"indexedDB");const runtime=await import("../../src/services/storageRuntime");await runtime.initializeStudyStorage();expect(runtime.storedSnapshot()).toBeUndefined();
});

test("recovery export preserves raw records and resetting clears only recovery and draft", async () => {
 const runtime=await import("../../src/services/storageRuntime");
 localStorage.setItem("mira.study.v1","original");
 localStorage.setItem("unrelated","keep");
 await runtime.initializeStudyStorage();
 mockExport.mockResolvedValue({cards:[{id:"corrupt"}],drafts:[{id:"paused"}]});
 expect(await runtime.recoveryBackup()).toEqual({format:"mira-recovery-v3",legacy:"original",stores:{cards:[{id:"corrupt"}],drafts:[{id:"paused"}]}});
 await runtime.clearStudyRecoveryAndDraft();
 expect(mockWriteDraft).toHaveBeenLastCalledWith(expect.anything(),undefined);
 expect(localStorage.getItem("mira.study.v1")).toBeNull();
 expect(localStorage.getItem("unrelated")).toBe("keep");
});

test("legacy-only draft fallback saves and discards without touching the library", async () => {
 Reflect.deleteProperty(globalThis,"indexedDB");
 const runtime=await import("../../src/services/storageRuntime");
 expect(await runtime.recoveryBackup()).toBe("{}");
 localStorage.setItem("mira.study.v1","backup");
 expect(await runtime.recoveryBackup()).toBe("backup");
 await runtime.persistActiveDraft({id:"paused"});
 expect(await runtime.loadActiveDraft()).toEqual({id:"paused"});
 await runtime.persistActiveDraft(undefined);
 expect(await runtime.loadActiveDraft()).toBeUndefined();
 expect(localStorage.getItem("mira.study.v1")).toBe("backup");
});
