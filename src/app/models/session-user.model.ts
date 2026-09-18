import { User } from './user.model';

/** Datos de sesión persistidos en el dispositivo. Nunca incluye la contraseña. */
export type SessionUser = Omit<User, 'password'>;
