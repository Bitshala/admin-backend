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
