(() => {
  const getErrorMessage = (cart) => {
    if (!cart) return "";
    if (typeof cart.description === "string" && cart.description) return cart.description;
    if (typeof cart.message === "string" && cart.message) return cart.message;
    if (typeof cart.errors === "string" && cart.errors) return cart.errors;
    if (Array.isArray(cart.errors)) return cart.errors.join(" ");
    if (cart.errors && typeof cart.errors === "object") {
      return Object.values(cart.errors).join(" ");
    }
    return "";
  };

  const isCartError = (cart) => {
    if (!cart) return false;
    if (cart.status && cart.status !== 200) return true;
    if (cart.errors) return true;
    return false;
  };

  const errorTimers = new WeakMap();

  const clearLineItemError = (lineItem) => {
    if (!lineItem) return;
    const errorWrapper = lineItem.querySelector(".line-item__error");
    const errorText = lineItem.querySelector(".line-item__error-text");
    const existingTimer = errorTimers.get(lineItem);
    if (existingTimer) {
      clearTimeout(existingTimer);
      errorTimers.delete(lineItem);
    }
    if (errorText) errorText.textContent = "";
    if (errorWrapper) errorWrapper.hidden = true;
  };

  const showLineItemError = (lineItem, message) => {
    if (!lineItem) return;
    const errorWrapper = lineItem.querySelector(".line-item__error");
    const errorText = lineItem.querySelector(".line-item__error-text");
    if (errorText) errorText.textContent = message;
    if (errorWrapper) errorWrapper.hidden = false;
    const existingTimer = errorTimers.get(lineItem);
    if (existingTimer) clearTimeout(existingTimer);
    const timeoutId = setTimeout(() => {
      clearLineItemError(lineItem);
    }, 3000);
    errorTimers.set(lineItem, timeoutId);
  };

  const hideLineItemLoader = (lineItem) => {
    if (!lineItem) return;
    const loader = lineItem.querySelector(".line-item__loader");
    if (!loader) return;
    loader.hidden = true;
    if (loader.firstElementChild) loader.firstElementChild.hidden = true;
    if (loader.lastElementChild) loader.lastElementChild.hidden = true;
  };

  document.addEventListener(
    "line-item-quantity:change:start",
    (event) => {
      const lineItem = event.target.closest("line-item");
      clearLineItemError(lineItem);
    },
    true
  );

  document.addEventListener(
    "line-item-quantity:change:end",
    (event) => {
      const cart = event.detail && event.detail.cart;
      if (!isCartError(cart)) return;

      event.stopImmediatePropagation();

      const lineItem = event.target.closest("line-item");
      hideLineItemLoader(lineItem);

      const message =
        getErrorMessage(cart) ||
        (window.cartStrings && window.cartStrings.error) ||
        "Erreur lors de la mise a jour du panier.";
      showLineItemError(lineItem, message);
    },
    true
  );

  const stopErrorRefresh = (event) => {
    const cart = event.detail && event.detail.cart;
    if (!isCartError(cart)) return;
    event.stopImmediatePropagation();
  };

  document.addEventListener("cart:updated", stopErrorRefresh, true);
  document.addEventListener("cart:refresh", stopErrorRefresh, true);
})();
