import type { AnchorHTMLAttributes } from "react";
import type { Page } from "../types/study";
import { navigate } from "../hooks/usePage";
import { routes } from "../config/routes";

export function RouteLink({
  page,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { page: Page }) {
  return (
    <a
      {...props}
      href={routes[page]}
      onClick={(event) => {
        props.onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank"
        )
          return;
        event.preventDefault();
        navigate(page);
      }}
    >
      {children}
    </a>
  );
}
