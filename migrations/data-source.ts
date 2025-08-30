import { DataSource } from 'typeorm';

function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (value === undefined) {
        throw new Error(`Environment variable ${key} not defined!`);
    }
    return value;
}

async function configureDataSource(): Promise<DataSource> {
    return new DataSource({
        host: getEnvVariable('DB_POSTGRES_HOST'),
        port: parseInt(getEnvVariable('DB_POSTGRES_PORT')),
        username: getEnvVariable('DB_POSTGRES_USERNAME'),
        password: getEnvVariable('DB_POSTGRES_PASSWORD'),
        database: getEnvVariable('DB_POSTGRES_DATABASE_NAME'),
        type: 'postgres',
        synchronize: false,
        logging: false,
        entities: ['src/entities/*.entity.ts'],
        migrations: ['migrations/**-migrations.ts'],
        subscribers: [],
    });
}

export default configureDataSource();
