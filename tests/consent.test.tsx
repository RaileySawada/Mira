import { fireEvent, render, screen } from "@testing-library/react";
import { PolicyConsent } from "../src/features/consent/PolicyConsent";
import { CONSENT_KEY, POLICY_VERSION, hasPolicyConsent } from "../src/features/consent/policy";
import App from "../src/app/App";

test("first visit requires both agreements before entering the app", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Welcome to Mira." })).toBeVisible();
  expect(screen.queryByLabelText("Main navigation")).not.toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Agree & continue" });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByLabelText("I agree to the terms & conditions."));
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Privacy policy" }));
  expect(screen.getByRole("article", { name: "Privacy policy" })).toBeVisible();
  fireEvent.click(screen.getByLabelText("I have read and agree to the privacy policy."));
  fireEvent.click(button);
  expect(hasPolicyConsent()).toBe(true);
  expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
});

test("missing, malformed and outdated agreement records require acceptance", () => {
  expect(hasPolicyConsent()).toBe(false);
  for (const value of ['bad json', 'null', JSON.stringify({ version: 'old', acceptedAt: new Date().toISOString() }), JSON.stringify({version: POLICY_VERSION, acceptedAt:'invalid'})]) {
    localStorage.setItem(CONSENT_KEY, value);
    expect(hasPolicyConsent()).toBe(false);
  }
  localStorage.setItem(CONSENT_KEY, JSON.stringify({version: POLICY_VERSION, acceptedAt: new Date().toISOString()}));
  expect(hasPolicyConsent()).toBe(true);
  render(<App />);
  expect(screen.queryByText("Welcome to Mira.")).not.toBeInTheDocument();
});

test("failed consent storage does not silently allow entry", () => {
  const accepted = jest.fn();
  render(<PolicyConsent onAccept={accepted} />);
  fireEvent.click(screen.getByLabelText("I agree to the terms & conditions."));
  fireEvent.click(screen.getByLabelText("I have read and agree to the privacy policy."));
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error('storage denied'); });
  fireEvent.click(screen.getByRole("button", { name: "Agree & continue" }));
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  expect(accepted).not.toHaveBeenCalled();
});
