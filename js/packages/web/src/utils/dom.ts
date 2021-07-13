function getPositionInDocument(element: Element) {
  const clientRect = element.getBoundingClientRect();

  return {
    top: clientRect.top + window.scrollY,
    left: clientRect.left + window.scrollX,
  };
}

export { getPositionInDocument };
