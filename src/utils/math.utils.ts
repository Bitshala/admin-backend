export const calculateRatio = (
    value: number,
    max: number,
    defaultMin = 0,
    defaultMax = 5,
): number => {
    const m = Math.max(1, max || defaultMax);
    const v = Math.min(Math.max(value ?? defaultMin, defaultMin), m);
    return v / m;
};
