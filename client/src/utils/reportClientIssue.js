export const reportClientIssue = (context) => {
  if (import.meta.env.DEV) {
    console.warn(`${context}. Details are hidden in the customer view.`);
  }
};
