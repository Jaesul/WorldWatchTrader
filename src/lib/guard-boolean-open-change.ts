/**
 * Dialog/Sheet `onOpenChange` must receive a boolean. If a DOM event is ever
 * forwarded (mis-wired handler), doing `useState(event)` breaks Radix controlled
 * `open` and can surface as a runtime error whose message is "[object Event]".
 */
export function guardBooleanOpenChange(setOpen: (open: boolean) => void): (value: unknown) => void {
  return (value: unknown) => {
    if (typeof value === 'boolean') setOpen(value);
  };
}
