import { Cookie, Request } from '../../common/router';

export interface HooksResponse {
  set(name: string, value: string): void;
  cookie(cookie: Cookie): void;
  clearCookie(name: string);
  /**
   * Redirect the user to another URL
   * @param url The URL to redirect to
   * @param statusCode The HTTP status code to use for the redirect. Defaults to 302. Introduced in Sitevision 2023.03.1.
   */
  redirect(url: string, statusCode?: 301 | 302 | 303 | 307 | 308): void;
}

export interface Hooks {
  beforeRender(callback: (req: Request, res: HooksResponse) => void): void;
  getPageTitle(callback: (req: Request) => string): void;
  addHeadElement(callback: (req: Request) => string): void;
}

declare namespace Hooks {}

declare var hooks: Hooks;

export default hooks;

export declare function beforeRender(callback: (req: Request, res: HooksResponse) => void): void;
export declare function getPageTitle(callback: (req: Request) => string): void;
export declare function addHeadElement(callback: (req: Request) => string): void;
