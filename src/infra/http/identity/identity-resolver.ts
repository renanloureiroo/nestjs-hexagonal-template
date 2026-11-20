import { type Request } from 'express';
import { type RequestIdentity } from './request-identity.js';

/**
 * Porta da borda HTTP: descobre quem fez a requisição. Devolve `null` quando a requisição não traz
 * identidade válida; o guard transforma isso em `401`. Os adaptadores escolhem o mecanismo (header
 * do gateway ou JWT validado aqui) sem que controller ou caso de uso saibam qual.
 */
export abstract class IdentityResolver {
  abstract resolve(request: Request): Promise<RequestIdentity | null>;
}
