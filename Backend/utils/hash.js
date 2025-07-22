import crypto from 'crypto';

export const getSalt = () => {
    return crypto.randomBytes(16).toString('base64url').substring(0, process.env.SALT_SIZE);
};

export const hashing = (text, salt) => {};
