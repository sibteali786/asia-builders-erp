import * as bcrypt from 'bcrypt';
import { BCRYPT_TOKEN } from './types';
export const importsProviders = [
  {
    provide: BCRYPT_TOKEN,
    useFactory: () => bcrypt,
  },
];
