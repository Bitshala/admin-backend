import {
    buildMessage,
    isInt,
    max,
    min,
    registerDecorator,
    ValidationOptions,
} from 'class-validator';

export function IsValidScore(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsValidScore',
            target: object.constructor,
            propertyName,
            constraints: [],
            options: validationOptions,
            validator: {
                validate: (value): boolean => {
                    return isInt(value) && max(value, 5) && min(value, 0);
                },
                defaultMessage: buildMessage(
                    (eachPrefix) =>
                        eachPrefix +
                        '$property must be an integer between 0 and 5',
                    validationOptions,
                ),
            },
        });
    };
}
