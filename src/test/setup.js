import '@testing-library/jest-dom'

// jsdom does not implement scrollTo — mock it so components that call
// element.scrollTo() don't throw in tests
window.HTMLElement.prototype.scrollTo = () => {}
window.scrollTo = () => {}
