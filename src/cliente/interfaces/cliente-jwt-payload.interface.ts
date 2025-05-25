export interface ClienteJwtPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    type: 'cliente'; // Para diferenciar del token de admin
}

