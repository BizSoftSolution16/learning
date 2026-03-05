import sql from 'mssql';

const config = {
    server: 'DESKTOP-H5CNO72',
    database: 'SNSDB',
    user: 'sa',
    password: '123456',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 120000,
    requestTimeout: 120000,
};

let pool;

export default async function connectDB() {
    try {
        if (!pool) {
            pool = await sql.connect(config);
            console.log('Connected to SQL Server');
        }
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
}

export { sql };
