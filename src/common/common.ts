export const camelToSnakeCase = (inputString: string) => {
    return inputString
        .split('.')
        .map((string) => {
            return string.replace(/[A-Z]/g, (letter) => `_${letter}`);
        })
        .join('_')
        .toUpperCase();
};

// Escapes LIKE/ILIKE wildcards (% _ \) so user-supplied search terms
// match literally instead of acting as patterns.
export const escapeLikePattern = (term: string) => {
    return term.replace(/[\\%_]/g, '\\$&');
};

// Returns a new Date that is `months` calendar months after `date`.
// When the original day-of-month does not exist in the target month
// (e.g. Jan 31 + 1 month), it clamps to the last day of that month
// (Feb 28/29) instead of overflowing into the next one. Uses UTC so
// the result is independent of the server timezone.
export const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    const targetDay = result.getUTCDate();
    result.setUTCMonth(result.getUTCMonth() + months);
    if (result.getUTCDate() < targetDay) {
        result.setUTCDate(0);
    }
    return result;
};
