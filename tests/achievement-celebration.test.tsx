import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useStudyData } from "../src/hooks/useStudyData";
import { achievements, withAchievements } from "../src/features/achievements/achievements";
import { AchievementCelebration } from "../src/features/achievements/AchievementCelebration";
import { saveData } from "../src/services/storage";
import { attempt, library } from "./fixtures";

test("groups new quiz rewards, dismisses them, and does not repeat after reload", () => {
 const {result,unmount}=renderHook(useStudyData);
 act(()=>{result.current.update({...library(),attempts:[attempt({correct:2,total:2,date:"2026-09-18T12:00:00"})]});});
 expect(result.current.rewards.map(b=>b.id)).toEqual(["badge-1","badge-4"]);
 act(()=>result.current.dismissRewards());
 act(()=>{result.current.update({...result.current.data,settings:{...result.current.data.settings,name:"Mira"}});});
 expect(result.current.rewards).toEqual([]);
 unmount();const reloaded=renderHook(useStudyData);expect(reloaded.result.current.rewards).toEqual([]);
});
test("practice and successful chat milestones each celebrate once", () => {
 const {result}=renderHook(useStudyData);
 act(()=>{result.current.update({...library(),milestones:{studyDates:["2026-09-18T12:00:00"]}});});
 expect(result.current.rewards[0].title).toBe("First Step");
 act(()=>result.current.dismissRewards());
 act(()=>{result.current.update({...result.current.data,milestones:{...result.current.data.milestones,askedMira:true}});});
 expect(result.current.rewards.map(b=>b.title)).toEqual(["Helper"]);
 act(()=>{result.current.update(result.current.data);});
 expect(result.current.rewards).toHaveLength(1);
});
test("failed saves never celebrate and successful retry does", () => {
 const {result}=renderHook(useStudyData);
 const fail=jest.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw Error("full");});
 const next={...library(),milestones:{askedMira:true}};
 act(()=>{expect(result.current.update(next)).toBe(false);});expect(result.current.rewards).toEqual([]);
 fail.mockRestore();act(()=>{expect(result.current.update(next)).toBe(true);});expect(result.current.rewards[0].title).toBe("Helper");
});
test("loading or importing already earned badges does not replay them", () => {
 const old=withAchievements({...library(),milestones:{askedMira:true}});
 saveData(old);const {result}=renderHook(useStudyData);expect(result.current.rewards).toEqual([]);
 const imported=withAchievements({...old,milestones:{askedMira:true,focusCompleted:true}});
 act(()=>{result.current.update(imported);});expect(result.current.rewards).toEqual([]);
});
test("celebration shows new artwork, mission and a working dismissal", () => {
 const badges=achievements({...library(),milestones:{askedMira:true}}).filter(b=>b.earned),close=jest.fn();
 render(<AchievementCelebration badges={badges} onClose={close}/>);
 expect(screen.getByRole("dialog",{name:"A little win worth celebrating"})).toBeVisible();
 expect(screen.getByRole("img",{name:"Helper badge"})).toHaveAttribute("src","/rewards/9.webp");
 expect(screen.getByText("Asked MIRA for guidance")).toBeVisible();
 fireEvent.click(screen.getByRole("button",{name:"Keep learning"}));expect(close).toHaveBeenCalledTimes(1);
});
