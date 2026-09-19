import { requestAi } from "../src/services/ai";
import { buildStudyOverview, parseStudyOverview } from "../src/features/ai/studyOverview";
import { library, reviewer, attempt } from "./fixtures";

test("overview includes the saved name, organization, current reviewer and real statistics", () => {
 const data=library();data.settings.name=" Mira ";data.folders=[{id:"f",name:"Semester"}];data.reviewers[0].folderId="f";data.lastStudy={reviewerId:data.reviewers[0].id,startedAt:new Date().toISOString()};data.attempts=[attempt({correct:1,total:2})];
 const result=buildStudyOverview(data);
 expect(result.name).toBe("Mira");expect(result.currentStudy).toContain("Semester");
 expect(JSON.parse(result.activity).accuracyPercent).toBe(50);
 expect(JSON.parse(result.library).reviewers).toBe(1);
 expect(JSON.stringify(result)).not.toContain("Powerhouse of the cell?");
 expect(parseStudyOverview(result)).toEqual(result);
});
test("large libraries retain full counts while lists and request size are bounded", () => {
 const data=library();data.reviewers=Array.from({length:1000},(_,i)=>reviewer({id:String(i),title:'"'.repeat(200)}));
 const result=buildStudyOverview(data);
 expect(JSON.parse(result.library).reviewers).toBe(1000);
 expect(JSON.parse(result.reviewers).length).toBeLessThanOrEqual(10);
 expect(JSON.stringify(result).length).toBeLessThanOrEqual(12000);
 expect(()=>parseStudyOverview(result)).not.toThrow();
});
test("empty libraries have no fabricated name or accuracy, and malformed contexts are rejected", () => {
 const data=library();data.settings.name="";const result=buildStudyOverview(data);
 expect(result.name).toBe("");expect(JSON.parse(result.activity).accuracyPercent).toBeNull();
 expect(parseStudyOverview(undefined)).toBeUndefined();
 expect(()=>parseStudyOverview({...result,name:42})).toThrow();
 expect(()=>parseStudyOverview({...result,reviewers:"x".repeat(3001)})).toThrow();
});

test("offline chat never sends the approved overview", async () => {
 jest.spyOn(navigator,"onLine","get").mockReturnValue(false);
 const original=Object.getOwnPropertyDescriptor(globalThis,"fetch");
 const fetchMock=jest.fn();
 Object.defineProperty(globalThis,"fetch",{value:fetchMock,configurable:true,writable:true});
 try {
 await expect(requestAi({mode:"chat",prompt:"How am I doing?",topic:"",count:1,overview:buildStudyOverview(library())},new AbortController().signal)).rejects.toThrow("offline");
 expect(fetchMock).not.toHaveBeenCalled();
 } finally { if (original) Object.defineProperty(globalThis,"fetch",original); else Reflect.deleteProperty(globalThis,"fetch"); }
});
