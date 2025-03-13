import { jwtDecode } from 'jwt-decode';

export const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (err) {
        return true;
    }
};