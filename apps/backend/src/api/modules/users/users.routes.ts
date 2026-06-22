import { FastifyInstance } from 'fastify';
import { deleteUserPhone, getCurrentUserProfile, getSocketToken, saveUserPhone, updateMyProfile } from './users.controller.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/me', getCurrentUserProfile);
  // Short-lived token for the Socket.io gateway handshake (cross-origin → cookie yo'q)
  fastify.get('/me/socket-token', getSocketToken);
  // PATCH /users/me — fullName va/yoki phoneNumber yangilash (customer profil)
  fastify.patch('/me', updateMyProfile);
  // PATCH /users/me/phone — save / update caller's phone number
  fastify.patch('/me/phone', saveUserPhone);
  fastify.delete('/me/phone', deleteUserPhone);
}
