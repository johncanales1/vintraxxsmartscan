/* We cannot use type `unknown` instead of `any` here because it will break the type assertion `isReactComponent` function is providing. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";

type ReactComponent = React.FC<any> | React.ComponentClass<any, any>;

/**
 * Checks if a given value is a function component.
 */
export const isFunctionComponent = (component: any): component is React.FC<any> => {
    return typeof component === "function";
};

/**
 * Checks if a given value is a class component.
 */
export const isClassComponent = (component: any): component is React.ComponentClass<any, any> => {
    return typeof component === "function" && component.prototype && (!!component.prototype.isReactComponent || !!component.prototype.render);
};

/**
 * Checks if a given value is a forward ref component.
 *
 * Defensive against arbitrary objects: only proceeds with the toString check
 * when `$$typeof` is actually a Symbol (which it always is for real React
 * forwardRef objects). Without this guard, a plain `{}` argument would throw
 * `Cannot read properties of undefined (reading 'toString')`.
 */
export const isForwardRefComponent = (component: any): component is React.ForwardRefExoticComponent<any> => {
    if (typeof component !== "object" || component === null) return false;
    const tag = (component as { $$typeof?: unknown }).$$typeof;
    if (typeof tag !== "symbol") return false;
    return tag.toString() === "Symbol(react.forward_ref)";
};

/**
 * Checks if a given value is a valid React component.
 */
export const isReactComponent = (component: any): component is ReactComponent => {
    return isFunctionComponent(component) || isForwardRefComponent(component) || isClassComponent(component);
};
