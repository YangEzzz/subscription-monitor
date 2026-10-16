// uni-app puts aria attributes on its host element in H5. Mirror them to the
// native control so browser assistive technology can name the actual input.
export function syncNativeFieldLabels(root) {
  // #ifdef H5
  if (!root?.querySelectorAll) return;
  root.querySelectorAll("input, textarea").forEach((input) => {
    const host = input.closest("uni-input, uni-textarea");
    const row = input.closest(".form-row");
    const name =
      host?.getAttribute("aria-label") ||
      row?.querySelector(".form-label")?.textContent?.trim();
    if (name) input.setAttribute("aria-label", name);
    for (const attribute of ["aria-describedby", "aria-invalid"]) {
      const value = host?.getAttribute(attribute);
      if (
        value &&
        (attribute !== "aria-describedby" || document.getElementById(value))
      ) {
        input.setAttribute(attribute, value);
      } else input.removeAttribute(attribute);
    }
    if (row?.querySelector(".form-label.required"))
      input.setAttribute("aria-required", "true");
  });
  // #endif
}
