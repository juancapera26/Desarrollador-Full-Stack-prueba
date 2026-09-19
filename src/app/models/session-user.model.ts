import { User } from './user.model';

export type SessionUser = Omit<User, 'password'>;
