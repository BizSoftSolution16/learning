-- Create Users table
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT GETDATE()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON Users(email);
